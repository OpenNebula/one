#!/usr/bin/env ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
# -------------------------------------------------------------------------- #
ONE_LOCATION = ENV['ONE_LOCATION'] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
  RUBY_LIB_LOCATION = '/usr/lib/one/ruby' if !defined?(RUBY_LIB_LOCATION)
  GEMS_LOCATION     = '/usr/share/one/gems' if !defined?(GEMS_LOCATION)
  ETC_LOCATION      = '/etc/one/' if !defined?(ETC_LOCATION)
else
  RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby' if !defined?(RUBY_LIB_LOCATION)
  GEMS_LOCATION     = ONE_LOCATION + '/share/gems' if !defined?(GEMS_LOCATION)
  ETC_LOCATION      = ONE_LOCATION + '/etc/' if !defined?(ETC_LOCATION)
end

# Load credentials and environment
require 'yaml'

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'CommandManager'
require 'scripts_common'
require 'rexml/document'
require 'VirtualMachineDriver'
require 'opennebula'

# The main class for the driver
class OpenNebulaDriver
  ACTION          = VirtualMachineDriver::ACTION
  POLL_ATTRIBUTE  = VirtualMachineDriver::POLL_ATTRIBUTE
  VM_STATE        = VirtualMachineDriver::VM_STATE

  LIMIT_DEFAULT   = "-1"
  LIMIT_UNLIMITED = "-2"

  UNLIMITED_CPU_VALUE = "100000"
  UNLIMITED_MEMORY_VALUE = "1073741824"

  # Local deploy ids will be formed with this prefix and the remote VM ID
  #DEPLOY_ID_PREFIX = "one-"
  DEPLOY_ID_PREFIX = "opennebula-hybrid-"

  # Remote VM names will be formed with this prefix, plus the local VM ID
  REMOTE_NAME_PREFIX = "remote-opennebula-"

  # constructor, loads credentials and endpoint
  def initialize(host_name, host_id=nil)
    @host_name    = host_name
    @host_id = host_id

    client = OpenNebula::Client.new
    if host_id.nil?
      host_pool = OpenNebula::HostPool.new(client)
      host_pool.info
      objects=host_pool.select {|object| object.name==host_name }
      host_id = objects.first.id
    end

    host = OpenNebula::Host.new_with_id(host_id, client)
    host.info(true)

    region = {}

    ["user", "password", "endpoint", "capacity"].each do |key|
      if key == "capacity"
        region[key] = {}
        ["cpu", "memory"].each do |key_c|
          value = host.retrieve_elements("/HOST/TEMPLATE/ONE_#{key.upcase}/#{key_c.upcase}")[0]
          if host.retrieve_elements("/HOST/TEMPLATE/ONE_#{key.upcase}/#{key_c.upcase}")[0].nil? || value == ""
              raise "Region for host #{host} does not have '#{key_c.upcase}' defined in host template"
          end
          region[key][key_c] = value.to_i
        end
      else
        value = host.retrieve_elements("/HOST/TEMPLATE/ONE_#{key.upcase}")[0]
        if host.retrieve_elements("/HOST/TEMPLATE/ONE_#{key.upcase}")[0].nil? || value == ""
            raise "Region for host #{host} does not have '#{key.upcase}' defined in host template"
        end
        region[key] = value
      end
    end

    region["password"] = host["/HOST/TEMPLATE/ONE_PASSWORD"],

    secret = "#{region['user']}:#{region['password']}"

    @client = OpenNebula::Client.new(secret, region['endpoint'], :sync => true)

    @cpu    = region['capacity']['cpu']
    @memory = region['capacity']['memory']

    @cpu    = 0 if @cpu.nil?
    @memory = 0 if @memory.nil?
  end

  # DEPLOY action, also sets ports and ip if needed
  def deploy(id, host, xml_text, lcm_state, deploy_id)
    if lcm_state == "BOOT" || lcm_state == "BOOT_FAILURE"
      one_info = get_deployment_info(host, xml_text)

      #load_default_template_values

      tid = one_value(one_info, 'TEMPLATE_ID')

      if (tid.nil? || tid == "")
        STDERR.puts("Cannot find TEMPLATE_ID in deployment file")
        exit(-1)
      end

      extra_template = "REMOTE_OPENNEBULA = YES\n"<<
                       "REMOTE_OPENNEBULA_VM_ID = #{id}\n"

      # The OpenNebula context will be included
      xml = OpenNebula::XMLElement.new
      xml.initialize_xml(xml_text, 'VM')

      if xml.has_elements?('TEMPLATE/CONTEXT')
        # Since there is only 1 level ',' will not be added
        context_str = xml.template_like_str('TEMPLATE/CONTEXT')

        if xml['TEMPLATE/CONTEXT/TOKEN'] == 'YES'
          # TODO use OneGate library. See ec2_driver.rb
          token_str = generate_onegate_token(xml)
          if token_str
            context_str << "\nONEGATE_TOKEN=\"#{token_str}\""
          end
        end

        extra_template << context_str
      end

      t = OpenNebula::Template.new_with_id(tid, @client)
      rc = t.instantiate(REMOTE_NAME_PREFIX+id, true, extra_template, false)

      if OpenNebula.is_error?(rc)
        STDERR.puts(rc.to_str())
        exit(-1)
      end

      deploy_id = "#{DEPLOY_ID_PREFIX}#{rc}"
      vm = get_remote_vm(deploy_id)

      if !context_str.nil?
        new_context_update = "CONTEXT = [" << context_str <<"]"
        new_context_update = new_context_update.gsub("\n", ",\n")
        rc = vm.updateconf(new_context_update)
      end

      if OpenNebula.is_error?(rc)
        STDERR.puts(rc.to_str())
        exit(-1)
      end

      vm.release

      rc = vm.update("REMOTE_OPENNEBULA_DEPLOY_ID = \"#{deploy_id}\"", true)

      if OpenNebula.is_error?(rc)
        STDERR.puts("Error adding REMOTE_OPENNEBULA_DEPLOY_ID attribute to VM #{rc}: #{rc.to_str()}")
      end

      puts(deploy_id)
    else
      restore(deploy_id)
      deploy_id
    end
  end

  # Shutdown an instance
  def shutdown(deploy_id, lcm_state)
    vm = get_remote_vm(deploy_id)

    case lcm_state
    when "SHUTDOWN"
      rc = vm.terminate
    when "SHUTDOWN_POWEROFF"
      rc = vm.poweroff
    when "SHUTDOWN_UNDEPLOY"
      rc = vm.undeploy
    end

    if OpenNebula.is_error?(rc)
      STDERR.puts(rc.to_str())
      exit(-1)
    end
  end

  # Reboot an instance
  def reboot(deploy_id)
    vm = get_remote_vm(deploy_id)
    rc = vm.reboot()

    if OpenNebula.is_error?(rc)
      STDERR.puts(rc.to_str())
      exit(-1)
    end
  end

  # Reboot (hard) an instance
  def reset(deploy_id)
    vm = get_remote_vm(deploy_id)
    rc = vm.reboot(true)

    if OpenNebula.is_error?(rc)
      STDERR.puts(rc.to_str())
      exit(-1)
    end
  end

  # Cancel an instance
  def cancel(deploy_id, lcm_state)
    vm = get_remote_vm(deploy_id)

    case lcm_state
    when "SHUTDOWN"
      rc = vm.terminate(true)
    when "SHUTDOWN_POWEROFF"
      rc = vm.poweroff(true)
    when "SHUTDOWN_UNDEPLOY"
      rc = vm.undeploy(true)
    end

    if OpenNebula.is_error?(rc)
      STDERR.puts(rc.to_str())
      exit(-1)
    end
  end

  # Save an instance
  def save(deploy_id)
    vm = get_remote_vm(deploy_id)

    rc = vm.suspend()

    if OpenNebula.is_error?(rc)
      STDERR.puts(rc.to_str())
      exit(-1)
    end
  end

  # Resumes an instance
  def restore(deploy_id)
    vm = get_remote_vm(deploy_id)
    rc = vm.resume()

    if OpenNebula.is_error?(rc)
      STDERR.puts(rc.to_str())
      exit(-1)
    end
  end

  # Get info (IP, and state) for an instance
  def poll(id, deploy_id)
    vm = get_remote_vm(deploy_id)
    rc = vm.info

    if OpenNebula.is_error?(rc)
      STDERR.puts(rc.to_str())
      exit(-1)
    end

    puts parse_poll(vm)
  end

  # Get the info of all the remote instances
  def monitor_all_vms
    user = OpenNebula::User.new_with_id("-1", @client)
    rc = user.info

    if OpenNebula.is_error?(rc)
      STDERR.puts("Error getting remote user information: #{rc.to_str()}")
      exit(-1)
    end

    group = OpenNebula::Group.new_with_id("-1", @client)
    rc = group.info

    if OpenNebula.is_error?(rc)
      STDERR.puts("Error getting remote group information: #{rc.to_str()}")
      exit(-1)
    end

    if @cpu != 0
      totalcpu = @cpu
    else
      u_cpu = user['VM_QUOTA/VM/CPU']
      g_cpu = group['VM_QUOTA/VM/CPU']

      if u_cpu == LIMIT_DEFAULT || u_cpu.nil?
        u_cpu = user['DEFAULT_USER_QUOTAS/VM_QUOTA/VM/CPU']
      end

      if g_cpu == LIMIT_DEFAULT || g_cpu.nil?
        g_cpu = group['DEFAULT_GROUP_QUOTAS/VM_QUOTA/VM/CPU']
      end

      u_cpu = LIMIT_UNLIMITED if u_cpu.nil?
      g_cpu = LIMIT_UNLIMITED if g_cpu.nil?

      u_cpu = UNLIMITED_CPU_VALUE if u_cpu == LIMIT_UNLIMITED
      g_cpu = UNLIMITED_CPU_VALUE if g_cpu == LIMIT_UNLIMITED

      totalcpu = ([u_cpu.to_f, g_cpu.to_f].min * 100).round
    end

    if @memory != 0
      totalmemory = @memory
    else
      u_memory = user['VM_QUOTA/VM/MEMORY']
      g_memory = group['VM_QUOTA/VM/MEMORY']

      if u_memory == LIMIT_DEFAULT || u_memory.nil?
        u_memory = user['DEFAULT_USER_QUOTAS/VM_QUOTA/VM/MEMORY']
      end

      if g_memory == LIMIT_DEFAULT || g_memory.nil?
        g_memory = group['DEFAULT_GROUP_QUOTAS/VM_QUOTA/VM/MEMORY']
      end

      u_memory = LIMIT_UNLIMITED if u_memory.nil?
      g_memory = LIMIT_UNLIMITED if g_memory.nil?

      u_memory = UNLIMITED_MEMORY_VALUE if u_memory == LIMIT_UNLIMITED
      g_memory = UNLIMITED_MEMORY_VALUE if g_memory == LIMIT_UNLIMITED

      totalmemory = [u_memory.to_i, g_memory.to_i].min
    end

    host_info =  "HYPERVISOR=opennebula\n"
    host_info << "PUBLIC_CLOUD=YES\n"
    host_info << "PRIORITY=-1\n"
    host_info << "TOTALMEMORY=#{totalmemory * 1024}\n"
    host_info << "TOTALCPU=#{totalcpu}\n"
    host_info << "HOSTNAME=\"#{@host_name}\"\n"

    vms_info = "VM_POLL=YES\n"

    if user['VM_QUOTA/VM/CPU_USED'].nil?
      usedcpu = 0
    else
      usedcpu = (user['VM_QUOTA/VM/CPU_USED'].to_f * 100).round
    end

    if user['VM_QUOTA/VM/MEMORY_USED'].nil?
      usedmemory = 0
    else
      usedmemory = user['VM_QUOTA/VM/MEMORY_USED'].to_i * 1024
    end

    vmpool = OpenNebula::VirtualMachinePool.new(@client,
      OpenNebula::VirtualMachinePool::INFO_ALL_VM)
    rc = vmpool.info

    if OpenNebula.is_error?(rc)
      STDERR.puts(rc.to_str())
      exit(-1)
    end

    vmpool.each do |vm|
      poll_data = parse_poll(vm)

      deploy_id = vm["USER_TEMPLATE/REMOTE_OPENNEBULA_DEPLOY_ID"] || "#{DEPLOY_ID_PREFIX}#{vm.id()}"
      vmid = vm["USER_TEMPLATE/REMOTE_OPENNEBULA_VM_ID"] || "-1"

      vm_template_to_one = vm_to_import(vm)
      vm_template_to_one = Base64.encode64(vm_template_to_one).gsub("\n","")

      vms_info << "VM=[\n"
      vms_info << "  ID=\"#{vmid}\",\n"
      vms_info << "  DEPLOY_ID=\"#{deploy_id}\",\n"
      vms_info << "  VM_NAME=#{vm.name},\n"
      vms_info << "  IMPORT_TEMPLATE=\"#{vm_template_to_one}\",\n"
      vms_info << "  POLL=\"#{poll_data}\" ]\n"
    end

    host_info << "USEDMEMORY=#{usedmemory}\n"
    host_info << "USEDCPU=#{usedcpu}\n"
    host_info << "FREEMEMORY=#{(totalmemory - usedmemory)}\n"
    host_info << "FREECPU=#{(totalcpu - usedcpu)}\n"

    puts host_info
    puts vms_info
  end

  private

  # Get the OpenNebula hybrid section of the template. With more than one section
  # the HOST element is used and matched with the host
  def get_deployment_info(host, xml_text)
    xml = REXML::Document.new xml_text

    one = nil

    all_one_elements = xml.root.get_elements("//USER_TEMPLATE/PUBLIC_CLOUD")

    # First, let's see if we have an one site that matches
    # our desired host name
    all_one_elements.each { |element|
      cloud = element.elements["HOST"]
      if cloud && cloud.text.upcase == host.upcase
        one = element
      end
    }

    if !one
      # If we don't find the one site, and ONE just
      # knows about one one site, let's use that
      if all_one_elements.size == 1
        one = all_one_elements[0]
      else
        STDERR.puts("Cannot find PUBLIC_CLOUD element in deployment "\
          " file or no HOST site matching the requested in the "\
          "template.")
        exit(-1)
      end
    end

    one
  end

  # Retrieve the vm information from the instance
  def parse_poll(vm)
    begin
      vm_hash = vm.to_hash()

      state = ""

      state = case vm.state_str
      when "INIT" || "PENDING" || "HOLD" || "CLONING"
        VM_STATE[:active]
      when "ACTIVE"
        case vm.lcm_state_str
        when /_FAILURE$/ || "UNKNOWN"
          VM_STATE[:error]
        else
          VM_STATE[:active]
        end
      when "STOPPED" || "SUSPENDED"
        VM_STATE[:paused]
      when "DONE" || "POWEROFF" || "UNDEPLOYED"
        VM_STATE[:deleted]
      when "FAILED" || "CLONING_FAILURE"
        VM_STATE[:error]
      else
        VM_STATE[:unknown]
      end

      info = "#{POLL_ATTRIBUTE[:state]}=#{state} "

      if state != VM_STATE[:active]
        return info
      end

      monitoring = vm_hash['VM']['MONITORING']

      if (!monitoring.nil?)
        info << vm.template_like_str('MONITORING', true).gsub("\n", " ").gsub('"', '').gsub(/\[ */, "[").gsub(/, */,",").gsub(/ *\]/, "]").gsub(/STATE=./,"")
      end

      return info
    rescue
      # Unkown state if exception occurs retrieving information from
      # an instance
      "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:unknown]} "
    end
  end

  # Returns the value of the xml specified by the name or the default
  # one if it does not exist
  # +xml+: REXML Document, containing one hybrid information
  # +name+: String, xpath expression to retrieve the value
  # +block+: Block, block to be applied to the value before returning it
  def one_value(xml, name, &block)
    value = value_from_xml(xml, name) || @defaults[name]
    if block_given? && value
      block.call(value)
    else
      value
    end
  end

  def value_from_xml(xml, name)
    if xml
      element = xml.elements[name]
      element.text.strip if element && element.text
    end
  end

  # Load the default values that will be used to create a new instance, if
  # not provided in the template. These values are defined in the
  # ONE_DRIVER_DEFAULT file
  def load_default_template_values
    @defaults = Hash.new

    if File.exists?(ONE_DRIVER_DEFAULT)
      fd  = File.new(ONE_DRIVER_DEFAULT)
      xml = REXML::Document.new fd
      fd.close()

      return if !xml || !xml.root

      xml.elements.each("/TEMPLATE/PUBLIC_CLOUD/*") do |e|
        @defaults[e.name] = e.text
      end
    end
  end

  # Retrive the vm object for the remote opennebula
  def get_remote_vm(deploy_id)
    begin
      match = deploy_id.match( /#{DEPLOY_ID_PREFIX}(.*)/ )

      if (match.nil?)
        raise "Deploy ID #{deploy_id} was not created with this driver"
      end

      id = match[1]

      return OpenNebula::VirtualMachine.new_with_id(id, @client)
    rescue => e
      STDERR.puts e.message
      exit(-1)
    end
  end

  # Build template for importation
  def vm_to_import(vm)
    cpu  = vm['TEMPLATE/CPU']
    vcpu = vm['TEMPLATE/VCPU']
    mem  = vm['TEMPLATE/MEMORY']

    template_id = vm['TEMPLATE/TEMPLATE_ID']

    deploy_id = "#{DEPLOY_ID_PREFIX}#{vm.id()}"

    str = "NAME   = \"Instance from #{vm.name()}\"\n"\
    "CPU    = \"#{cpu}\"\n"\
    "VCPU   = \"#{1}\"\n"\
    "MEMORY = \"#{mem}\"\n"\
    "HYPERVISOR = \"opennebula\"\n"\
    "PUBLIC_CLOUD = [\n"\
    "  TYPE  =\"opennebula\",\n"\
    "  TEMPLATE_ID   =\"#{template_id}\"\n"\
    "]\n"\
    "IMPORT_VM_ID    = \"#{deploy_id}\"\n"\
    "SCHED_REQUIREMENTS=\"NAME=\\\"#{@host_name}\\\"\"\n"\
    "DESCRIPTION = \"Instance imported from a remote OpenNebula, from VM instance"\
    " #{vm.id()}\"\n"

    str
  end

  # TODO move this method to a OneGate library. See ec2_driver.rb
  def generate_onegate_token(xml)
    # Create the OneGate token string
    vmid_str  = xml["ID"]
    stime_str = xml["STIME"]
    str_to_encrypt = "#{vmid_str}:#{stime_str}"

    user_id = xml['TEMPLATE/CREATED_BY']

    if user_id.nil?
      STDERR.puts {"VMID:#{vmid} CREATED_BY not present" \
      " in the VM TEMPLATE"}
      return nil
    end

    user = OpenNebula::User.new_with_id(user_id,
      OpenNebula::Client.new)
    rc   = user.info

    if OpenNebula.is_error?(rc)
      STDERR.puts {"VMID:#{vmid} user.info" \
      " error: #{rc.message}"}
      return nil
    end

    token_password = user['TEMPLATE/TOKEN_PASSWORD']

    if token_password.nil?
      STDERR.puts {"VMID:#{vmid} TOKEN_PASSWORD not present"\
      " in the USER:#{user_id} TEMPLATE"}
      return nil
    end

    cipher = OpenSSL::Cipher::Cipher.new("aes-256-cbc")
    cipher.encrypt
    cipher.key = token_password
    onegate_token = cipher.update(str_to_encrypt)
    onegate_token << cipher.final

    onegate_token_64 = Base64.encode64(onegate_token).chop
  end
end
