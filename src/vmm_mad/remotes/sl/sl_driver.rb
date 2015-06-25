#!/bin/bash

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
#--------------------------------------------------------------------------- #

ONE_LOCATION = ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby" if !defined?(RUBY_LIB_LOCATION)
    ETC_LOCATION      = "/etc/one/" if !defined?(ETC_LOCATION)
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby" if !defined?(RUBY_LIB_LOCATION)
    ETC_LOCATION      = ONE_LOCATION + "/etc/" if !defined?(ETC_LOCATION)
end

SL_DRIVER_CONF = "#{ETC_LOCATION}/sl_driver.conf"
SL_DRIVER_DEFAULT = "#{ETC_LOCATION}/sl_driver.default"

# Load SL credentials and needed gems
require 'yaml'
require 'rubygems'
require 'softlayer_api'

$: << RUBY_LIB_LOCATION

require 'CommandManager'
require 'scripts_common'
require 'rexml/document'
require 'VirtualMachineDriver'

# The main class for the SoftLayer driver
class SLDriver
    ACTION          = VirtualMachineDriver::ACTION
    POLL_ATTRIBUTE  = VirtualMachineDriver::POLL_ATTRIBUTE
    VM_STATE        = VirtualMachineDriver::VM_STATE

    # Key that will be used to store the monitoring information in the template
    SL_MONITOR_KEY = "SLDRIVER_MONITOR"

    # SL commands constants
    SL = {
      :run => {
          :cmd => :createObject,        # Create a new SL object
          :args => {
              "HOSTNAME" => {
                  :opt => 'hostname'
              },
              "DOMAIN" => {
                  :opt => 'domain'
              },
              "STARTCPUS" => {
                  :opt => 'startCpus'
              },
              "MAXMEMORY" => {
                  :opt => 'maxMemory'
              },
              "HOURLYBILLING" => {
                  :opt => 'hourlyBillingFlag'
              },
              "LOCALDISK" => {
                  :opt => 'localDiskFlag'
              },
              "DEDICATEDHOST" => {
                  :opt => 'dedicatedAccountHostOnlyFlag'
              },
              "DATACENTER" => {
                  :opt => 'datacenter.name'
              },
              "OPERATINGSYSTEM" => {
                  :opt => 'operatingSystemReferenceCode'
              },
              "BLOCKDEVICETEMPLATE" => {
                  :opt => 'blockDeviceTemplateGroup.globalIdentifier'
              },
              "BLOCKDEVICE" => {
                  :opt => 'blockDevices',
                  :proc => lambda {|str|
                           [{:device=>0, :diskImage=>{:capacity=>str}}]}

              },
              "NETWORKCOMPONENTSMAXSPEED" => {
                  :opt => 'networkComponents.maxSpeed',
              },
              "PRIVATENETWORKONLY" => {
                  :opt => 'privateNetworkOnlyFlag',
                  :proc => lambda {|str| str=="YES"?true:false}
              },
              "PRIMARYNETWORKVLAN" => {
                  :opt => 'primaryNetworkComponent.networkVlan.id'
              },
              "PRIMARYBACKENDNETWORKVLAN" => {
                  :opt => 'primaryBackendNetworkComponent.networkVlan.id'
              },
              "USERDATA" => {
                  :opt => 'userData.value'
              },
              "SSHKEYS" => {
                  :opt => 'sshKeys', # Array of SSH Keys ids
                  :proc => lambda {|str|
                             sshArray = Array.new
                             str.split(",").each { |id|
                                sshArray << {:id=> id}
                             }
                             sshArray
                           }

              },
              "POSTSCRIPT" => {
                  :opt => 'postInstallScriptUri'
              }

          }
      },
      :terminate => {
          :cmd => :deleteObject    # Terminate a Virtual Guest
      },
      :reboot => {
          :cmd => :rebootDefault   # Reboot a Virtual Guest
      },
      :stop => {
          :cmd => :pause           # Stop a Virtual Guest
      },
      :start => {
          :cmd => :resume          # Resume a Virtual Guest
      },
      :poweroff => {
          :cmd => :powerOff        # Powers off a Virtual Guest
      }
    }

    # SoftLayer attributes that will be retrieved in a polling action.
    SL_POLL_ATTRS = [
              :id,
              :hostname,
              :domain,
              :fullyQualifiedDomainName,
              :maxCpu,
              :maxMemory,
              :startCpus,
              :uuid,
              :globalIdentifier,
              :primaryBackendIpAddress,
              :primaryIpAddress
    ]

    # SoftLayer constructor, loads credentials and endpoint
    def initialize(host)
        @host = host

        public_cloud_sl_conf  = YAML::load(File.read(SL_DRIVER_CONF))

        @instance_types = public_cloud_sl_conf['instance_types']

        regions = public_cloud_sl_conf['regions']
        @region = regions[host] || regions["default"]

        client_cred={:username => @region['username'],
                     :api_key  => @region['api_key']}

        client_cred[:endpoint_url]=@region['endpoint'] if @region['endpoint']

        client_cred[:timeout] = public_cloud_sl_conf['timeout'] || 120


        @sl_client = SoftLayer::Client.new(client_cred)
    end

    # DEPLOY action
    def deploy(id, host, xml_text)
        load_default_template_values

        sl_info = get_deployment_info(host, xml_text)

        opts = generate_options(:run, sl_info, {
                :min_count => 1,
                :max_count => 1})

        if !opts[:startCpus] or !opts[:maxMemory]
          instance_type = value_from_xml(sl_info,"INSTANCE_TYPE")
          cpu, mem = instance_type_capacity(instance_type)
          opts[:startCpus] = cpu / 100
          opts[:maxMemory] = mem / 1024
        end

        vg_srvc = @sl_client['Virtual_Guest']

        begin
          vgid = vg_srvc.createObject(opts)['id']
          vg   = vg_srvc.object_with_id(vgid)
        rescue => e
          STDERR.puts(e.message)
          exit(-1)
        end

        begin
          vg.setTags("#{id}")
        rescue => e
          STDERR.puts(e.message)
          exit(-1)
        end

        puts(vgid)
    end

    # Shutdown a SoftLayer instance
    def shutdown(deploy_id)
        sl_action(deploy_id, :terminate)
    end

    # Reboot a SoftLayer instance
    def reboot(deploy_id)
        sl_action(deploy_id, :reboot)
    end

    # Cancel a SoftLayer instance
    def cancel(deploy_id)
        sl_action(deploy_id, :terminate)
    end

    # Stop a SoftLayer instance
    def save(deploy_id)
        sl_action(deploy_id, :stop)
    end

    # Start a SoftLayer instance
    def restore(deploy_id)0
        sl_action(deploy_id, :start)
    end

    # Get info (IP, and state) for a SoftLayer instance
    def poll(id, deploy_id)
        i = get_instance(deploy_id)
        puts parse_poll(i)
    end

    # Get the info of all the SoftLayer instances. A SoftLayer instance must include
    # the OpenNebula VID as the first tag, otherwise it will be ignored
    def monitor_all_vms
        totalmemory = 0
        totalcpu    = 0

        @region['capacity'].each { |name, size|
            cpu, mem = instance_type_capacity(name)

            totalmemory += mem * size.to_i
            totalcpu    += cpu * size.to_i
        }

        host_info =  "HYPERVISOR=SOFTLAYER\n"
        host_info << "PUBLIC_CLOUD=YES\n"
        host_info << "PRIORITY=-1\n"
        host_info << "TOTALMEMORY=#{totalmemory.round}\n"
        host_info << "TOTALCPU=#{totalcpu}\n"
        host_info << "CPUSPEED=1000\n"
        host_info << "HOSTNAME=\"#{@host}\"\n"

        vms = @sl_client['Account'].getVirtualGuests

        vms_info = "VM_POLL=YES\n"

        usedcpu    = 0
        usedmemory = 0

        begin
            vms.each do |i|
                vm   = @sl_client['Virtual_Guest'].object_with_id(i['id'].to_i)
                poll_data = parse_poll(vm)
                # Retrieve Virtual Guest to consult tags

                tags = vm.getTagReferences
                # We know that the first one is the ONE identifier
                one_id=nil
                begin
                  one_id=tags[0]["tag"]["name"]
                rescue
                end
                next if one_id=="one_id"
                vms_info << "VM=[\n"
                vms_info << "  ID=#{one_id || -1},\n"
                vms_info << "  DEPLOY_ID=#{i['id']},\n"
                vms_info << "  POLL=\"#{poll_data[0...-1]}\" ]\n"

                if one_id
                    usedcpu    += i['maxCpu'].to_i * 100
                    usedmemory += i['maxMemory'].to_i * 1024
                end
            end
        rescue => e
            STDERR.puts(e.message)
            exit(-1)
        end

        host_info << "USEDMEMORY=#{usedmemory.round}\n"
        host_info << "USEDCPU=#{usedcpu.round}\n"
        host_info << "FREEMEMORY=#{(totalmemory - usedmemory).round}\n"
        host_info << "FREECPU=#{(totalcpu - usedcpu).round}\n"

        puts host_info
        puts vms_info
    end

private

    #Get the associated capacity of the instance_type as cpu (in 100 percent
    #e.g. 800) and memory (in KB)
    def instance_type_capacity(name)
        if  @instance_types[name].nil?
          STDERR.puts("Instance type #{name} not recognized")
          exit(-1)
        end

        return @instance_types[name]['cpu'].to_i * 100 ,
               @instance_types[name]['memory'].to_i * 1024 * 1024
    end

    # Get the SoftLayer section of the template. If more than one SoftLayer
    # section, the DATACENTER element is used and matched with the host
    def get_deployment_info(host, xml_text)
        xml = REXML::Document.new xml_text

        sl              = nil
        all_sl_elements = xml.root.get_elements("//USER_TEMPLATE/PUBLIC_CLOUD")

        all_sl_elements = all_sl_elements.select { |element|
             element.elements["TYPE"].text.downcase.eql? "softlayer"
        }

        # First, let's see if we have an SoftLayer site that matches
        # our desired host name
        all_sl_elements.each { |element|
            cloud_host = element.elements["DATACENTER"]
            type       = element.elements["TYPE"].text

            if cloud_host and cloud_host.text.upcase.eql? host.upcase
                sl = element
            end
        }

        if !sl
            # If we don't find the SoftLayer site, and ONE just
            # knows about one SoftLayer site, let's use that
            if all_sl_elements.size == 1
                sl = all_sl_elements[0]
            else
                STDERR.puts(
                    "Cannot find SoftLayer element in VM template "<<
                    "or ambigous definition of SofLayer templates "<<
                    "(for instance, two SoftLayer sections without " <<
                    "a DATACENTER defined)")
                exit(-1)
            end
        end

        # If DATACENTER not explicitly defined, try to get default, if not
        # try to use hostname as datacenter
        if !sl.elements["DATACENTER"]
          dc=REXML::Element.new("DATACENTER")
          if @defaults["DATACENTER"]
            dc.text=@defaults["DATACENTER"]
          else
            dc.text=host
          end
          sl.elements << dc
        end

        sl
    end

    # Retrieve the VM information from the SoftLayer instance
    def parse_poll(vm)
      begin
        info =  "#{POLL_ATTRIBUTE[:memory]}=0 " \
                "#{POLL_ATTRIBUTE[:cpu]}=0 " \
                "#{POLL_ATTRIBUTE[:nettx]}=0 " \
                "#{POLL_ATTRIBUTE[:netrx]}=0 "

        state = ""

        instance = vm.getObject
        sl_state = vm.getPowerState["name"]

        password_mask = "mask[operatingSystem[passwords]]"
        pass_info     = vm.object_mask(password_mask).getObject

        begin
          user        = pass_info["operatingSystem"]["passwords"][0]["username"]
          pwd         = pass_info["operatingSystem"]["passwords"][0]["password"]
        rescue
        end

        if !instance
            state = VM_STATE[:deleted]
        else
            state = case sl_state.upcase
                            when "RUNNING"
                                VM_STATE[:active]
                            when "PAUSED"
                                VM_STATE[:paused]
                            else
                                VM_STATE[:unknown]
                    end
        end
        info << "#{POLL_ATTRIBUTE[:state]}=#{state} "

        SL_POLL_ATTRS.map { |key|
            value = instance["#{key}"].to_s

            if !value.nil? && !value.empty?
                if value.is_a?(Array)
                    value = value.map {|v|}.join(",")
                end
                info << "SL_#{key.to_s.upcase}=#{value} "
            end
        }

        info << "SL_CRED_USER=#{user} SL_CRED_PASSWORD=#{pwd}" if user and pwd

        info
      rescue
        # Unkown state if exception occurs retrieving information from
        # an instance
        "#{POLL_ATTRIBUTE[:state]}=#{VM_STATE[:unknown]} "
      end
    end

    # Execute a SoftLayer command
    # +deploy_id+: String, VM id in SoftLayer
    # +sl_action+: Symbol, one of the keys of the SL hash constant (i.e :run)
    def sl_action(deploy_id, sl_action)
        i = get_instance(deploy_id)

        begin
            i.send(SL[sl_action][:cmd])
        rescue => e
            STDERR.puts e.message
            exit(-1)
        end
    end

    # Generate the options for the given command from the xml provided in the
    # template. The available options for each command are defined in the 'SL'
    # constant
    def generate_options(action, xml, extra_params={})
        opts = extra_params || {}

        if SL[action][:args]
            SL[action][:args].each {|k,v|
                str = sl_value(xml, k, &v[:proc])

                if str
                  if v[:opt].include? "."
                    opts=create_opts_hash(opts,v[:opt],str)
                  else
                    opts[v[:opt].to_sym] = str
                  end
                end
            }
        end

        opts
    end

    def create_opts_hash(opts,key_schema,value)
      split_keys    = key_schema.split(".")
      new_hash      = {}
      current_hash  = new_hash
      last_hash     = {}

      split_keys.size.times{ |i|
         index = i + 1         # We skip the first key

         if index == split_keys.size # Last iteration
           last_hash[split_keys[index-1].to_sym] = value
           break
         else
           current_hash[split_keys[index].to_sym]={}
           last_hash   =current_hash
           current_hash=current_hash[split_keys[index].to_sym]
         end
      }
      opts[split_keys[0].to_sym] = new_hash

      opts
    end

    # Returns the value of the xml specified by the name or the default
    # one if it does not exist
    # +xml+: REXML Document, containing SoftLayer information
    # +name+: String, xpath expression to retrieve the value
    # +block+: Block, block to be applied to the value before returning it
    def sl_value(xml, name, &block)
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
    # SL_DRIVER_DEFAULT file
    def load_default_template_values
        @defaults = Hash.new

        if File.exists?(SL_DRIVER_DEFAULT)
            fd  = File.new(SL_DRIVER_DEFAULT)
            xml = REXML::Document.new fd
            fd.close()

            return if !xml || !xml.root

            sl = xml.root.elements["SOFTLAYER"]

            return if !sl

            SL.each {|action, hash|
                if hash[:args]
                    hash[:args].each { |key, value|
                        @defaults[key] = value_from_xml(sl, key)
                    }
                end
            }
        end
    end

    # Retrieve the instance from SoftLayer
    def get_instance(id)
        begin
            vg_srvc = @sl_client['Virtual_Guest']
            instance = vg_srvc.object_with_id(id)
            if instance
                return instance
            else
                raise "Instance #{id} does not exist"
            end
        rescue => e
            STDERR.puts e.message
            exit(-1)
        end
    end
end
