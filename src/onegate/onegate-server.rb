#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    LOG_LOCATION      = '/var/log/one'
    VAR_LOCATION      = '/var/lib/one'
    ETC_LOCATION      = '/etc/one'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    VAR_LOCATION      = ONE_LOCATION + '/var'
    LOG_LOCATION      = ONE_LOCATION + '/var'
    ETC_LOCATION      = ONE_LOCATION + '/etc'
end

ONEGATE_AUTH       = VAR_LOCATION + "/.one/onegate_auth"
ONEGATE_LOG        = LOG_LOCATION + "/onegate.log"
CONFIGURATION_FILE = ETC_LOCATION + "/onegate-server.conf"

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << RUBY_LIB_LOCATION + '/cloud'

require 'rubygems'
require 'sinatra'
require 'yaml'
require 'json'
require 'set'
require 'syslog/logger'

require 'CloudAuth'
require 'CloudServer'

require 'opennebula'
require 'opennebula/oneflow_client'

USER_AGENT = 'GATE'

# Attrs that cannot be modified when updating a VM template
# If this parameter is not defined in onegate-server.conf
# this constant will be used
RESTRICTED_ATTRS = [
    'SCHED_REQUIREMENTS',
    'SERVICE_ID',
    'ROLE_NAME'
]

# Actions that cannot be triggered on a VM
# If this parameter is not defined in onegate-server.conf
# this constant will be used
RESTRICTED_ACTIONS = [
    'reboot'
]

# Attrs of the Virtual Network template that will be retrieved
# with onegate vnet | get /vnet/:id requests.
VNET_TEMPLATE_ATTRIBUTES = %w[NETWORK_ADDRESS NETWORK_MASK GATEWAY GATEWAY6 DNS
                              GUEST_MTU SEARCH_DOMAIN METRIC IP6_METRIC]

include OpenNebula

begin
    $conf = YAML.load_file(CONFIGURATION_FILE)
    CloudServer.print_configuration($conf)
rescue Exception => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

set :bind, $conf[:host]
set :port, $conf[:port]

set :config, $conf

include CloudLogger

if $conf[:log]
    $conf[:debug_level] = $conf[:log][:level] || 2
else
    $conf[:debug_level] ||= 2
end

if $conf[:log] && $conf[:log][:system] == 'syslog'
    logger = Syslog::Logger.new('onegate')
else
    logger = enable_logging(ONEGATE_LOG, $conf[:debug_level].to_i)
end

begin
    ENV["ONE_CIPHER_AUTH"] = ONEGATE_AUTH
    $cloud_auth = CloudAuth.new($conf, logger)
rescue => e
    logger.error { "Error initializing authentication system" }
    logger.error { e.message }
    exit(-1)
end

set :cloud_auth, $cloud_auth

before do
    content_type 'application/json', :charset => 'utf-8'
end

helpers do
    def authenticate(env, params)
        begin
            result = $cloud_auth.auth(env, params)
        rescue Exception => e
            logger.error { "Unauthorized login attempt #{e.message}" }
            halt 401, "Not authorized"
        end

        if result.nil?
            logger.info { "Unauthorized login attempt" }
            halt 401, "Not authorized"
        else
            client = $cloud_auth.client(result)
            if client.nil?
                logger.info { "Unauthorized login attempt" }
                halt 401, "Not authorized"
            end

            return  client
        end
    end

    def flow_client(client)
        split_array = client.one_auth.split(':')

        Service::Client.new(
                :url        => settings.config[:oneflow_server],
                :user_agent => USER_AGENT,
                :username   => split_array.shift,
                :password   => split_array.join(':'))
    end

    def get_vm(vm_id, client)
        vm = VirtualMachine.new_with_id(vm_id, client)
        rc = vm.info

        if OpenNebula.is_error?(rc)
            logger.error {"VMID:#{vm_id} vm.info error: #{rc.message}"}
            halt 404, rc.message
        end

        vm
    end

    # Retrieve the VM id from the header of the request and return
    # an OpenNebula VirtualMachine object
    def get_source_vm(request_env, client)
        vm_id = request_env['HTTP_X_ONEGATE_VMID'].to_i
        get_vm(vm_id, client)
    end

    def get_requested_vm(requested_vm_id, request_env, client)
        source_vm = get_source_vm(request_env, client)

        return source_vm if Integer(source_vm['ID']) == requested_vm_id

        if !source_vm['USER_TEMPLATE/SERVICE_ID'].nil?
            service_id = source_vm['USER_TEMPLATE/SERVICE_ID']
            check_vm_in_service(requested_vm_id, service_id, client)
            get_vm(requested_vm_id, client)
        elsif !source_vm['TEMPLATE/VROUTER_ID'].nil?
            vrouter_id = source_vm['TEMPLATE/VROUTER_ID']
            vrouter_hash = get_vrouter(vrouter_id, client).to_hash
            check_vm_in_vrouter(requested_vm_id, vrouter_hash, source_vm)
            get_vm(requested_vm_id, client)
        else
            error_msg = 'This VM does not belong to any Virtual Router or '\
                        'Service, so it cannot retrieve information '\
                        'from other VMs'
            logger.error {error_msg}
            halt 400, error_msg
        end
    end

    # Perform the action provided in the body of the request on the
    # given VM. If error trigger a halt
    def perform_action(vm, body)
        action_hash = parse_json(body, 'action')
        if OpenNebula.is_error?(action_hash)
            halt 400, action_hash.message
        end

        check_restricted_actions(action_hash['perform'])
        rc = case action_hash['perform']
             when "deploy"       then vm.deploy(action_hash['params'])
             when "hold"         then vm.hold
             when "livemigrate"  then vm.migrate(action_hash['params'], true)
             when "migrate"      then vm.migrate(action_hash['params'], false)
             when "resume"       then vm.resume
             when "release"      then vm.release
             when "stop"         then vm.stop
             when "suspend"      then vm.suspend
             when "saveas"       then vm.save_as(action_hash['params'])
             when "snapshot_create"       then vm.snapshot_create(action_hash['params'])
             when "snapshot_revert"       then vm.snapshot_revert(action_hash['params'])
             when "snapshot_delete"       then vm.snapshot_delete(action_hash['params'])
             when "terminate"    then vm.terminate(action_hash['params'])
             when "reboot"       then vm.reboot(action_hash['params'])
             when "poweroff"     then vm.poweroff(action_hash['params'])
             when "chown"        then vm.chown(action_hash['params'])
             when "chmod"        then vm.chmod_octet(action_hash['params'])
             when "resize"       then vm.resize(action_hash['params'])
             when "attachdisk"   then vm.disk_attach(action_hash['params'])
             when "detachdisk"   then vm.disk_detach(action_hash['params'])
             when "attachnic"    then vm.nic_attach(action_hash['params'])
             when "detachnic"    then vm.nic_detach(action_hash['params'])
             when "rename"       then vm.rename(action_hash['params'])
             when "undeploy"     then vm.undeploy(action_hash['params'])
             when "resched"      then vm.resched
             when "unresched"    then vm.unresched
             when "recover"      then vm.recover(action_hash['params'])
             # Compatibility with 4.x
             when "delete"       then vm.terminate(true)
             when "shutdown"     then vm.terminate(action_hash['params'])
             else
                 error_msg = "#{action_hash['perform']} action not " <<
                     " available for this resource"
                 OpenNebula::Error.new(error_msg)
             end

         if OpenNebula.is_error?(rc)
             halt 500, rc.message
         end
    end

    def get_service(service_id, client)
        if service_id.nil? || !service_id.match(/^\d+$/)
            error_msg = "Empty or invalid SERVICE_ID"
            logger.error {error_msg}
            halt 400, error_msg
        end

        service = flow_client(client).get("/service/#{service_id}")

        if CloudClient::is_error?(service)
            error_msg = "Service #{service_id} not found"
            logger.error {error_msg}
            halt 404, error_msg
        end

        service.body
    end

    def get_vrouter(vrouter_id, client)
        begin
            vrouter_id = Integer(vrouter_id)
        rescue TypeError
            error_msg = 'Empty or invalid VROUTER_ID'
            logger.error {error_msg}
            halt 400, error_msg
        end

        vrouter = VirtualRouter.new_with_id(vrouter_id, client)
        rc = vrouter.info

        if OpenNebula.is_error?(rc)
            error_msg = "Virtual router #{vrouter_id} not found"
            logger.error {error_msg}
            halt 404, error_msg
        end

        vrouter
    end

    def get_vnet(vnet_id, client)
        begin
            vnet_id = Integer(vnet_id)
        rescue TypeError
            error_msg = 'Empty or invalid VNET_ID'
            logger.error {error_msg}
            halt 400, error_msg
        end

        vnet = VirtualNetwork.new_with_id(vnet_id, client)
        rc = vnet.info

        if OpenNebula.is_error?(rc)
            error_msg = "Virtual network #{vnet_id} not found"
            logger.error {error_msg}
            halt 404, error_msg
        end

        vnet
    end

    def parse_json(json_str, root_element)
        begin
            hash = JSON.parse(json_str)
        rescue Exception => e
            return OpenNebula::Error.new(e.message)
        end

        if hash.has_key?(root_element)
            return hash[root_element]
        else
            return OpenNebula::Error.new("Error parsing JSON: Wrong resource type")
        end
    end

    # Attrs that cannot be modified when updating a VM template
    def check_restricted_attrs(data, error)
        data.split("\n").each{ |key_value|
            parts = key_value.split('=')
            if parts[0] && get_restricted_attrs.include?(parts[0].upcase)
                error_msg = "Attribute (#{parts[0]}) #{error}"
                logger.error {error_msg}
                halt 403, error_msg
            end
        }
        request.body.rewind
    end

    def get_restricted_attrs
        $conf[:restricted_attrs] || RESTRICTED_ATTRS
    end

    # Actions that cannot be performed on a VM
    def check_restricted_actions(action)
        if action && get_restricted_actions.include?(action.downcase)
            error_msg = "Action (#{action}) is not allowed on this resource"
            logger.error {error_msg}
            halt 403, error_msg
        end
    end

    def get_restricted_actions
        $conf[:restricted_actions] || RESTRICTED_ACTIONS
    end

    def check_permissions(resource, action)
        permissions = settings.config[:permissions]
        unless permissions && permissions[resource] && permissions[resource][action]
            error_msg = "Action (#{action}) on resource (#{resource}) not supported"
            logger.error {error_msg}
            halt 403, error_msg
        end
    end

    def get_vnet_template_attributes
        $conf[:vnet_template_attributes] || VNET_TEMPLATE_ATTRIBUTES
    end

    # Check if the source VM is part of a service and if the requested
    # VM is part of the same Service as the source VM.
    #
    # If true the service hash is returned
    # If false a halt is triggered
    #
    def check_vm_in_service(requested_vm_id, service_id, client, extended = false)
        service = get_service(service_id, client)

        service_hash = JSON.parse(service)

        response = build_service_hash(service_hash, client, extended) rescue nil
        if response.nil?
            error_msg = "Service #{service_id} is empty."
            logger.error {error_msg}
            halt 400, error_msg
        end

        # Check that the user has not spoofed the Service_ID
        service_vm_ids = response["SERVICE"]["roles"].collect do |r|
            r["nodes"].collect{|n| n["deploy_id"]}
        end.flatten rescue []

        if service_vm_ids.empty? || !service_vm_ids.include?(requested_vm_id.to_i)
            error_msg = "Service #{service_id} does not contain VM #{requested_vm_id}."
            logger.error {error_msg}
            halt 400, error_msg
        end

        return response
    end

    # Check if the source VM is part of a virtual router and if the
    # requested VM is part of the same virtual router as the source VM.
    # If false a halt is triggered
    #
    # @param requested_vm_id [Integer]
    # @param vrouter_hash [Hash]
    # @param source_vm [OpenNebula::VirtualMachine]
    #
    def check_vm_in_vrouter(requested_vm_id, vrouter_hash, source_vm)
        # Check that the user has not spoofed the VROUTER_ID
        vrouter_vm_ids = Array(vrouter_hash['VROUTER']['VMS']['ID']).map! do |vm|
            Integer(vm)
        end

        if !vrouter_vm_ids.include?(requested_vm_id) ||
           !vrouter_vm_ids.include?(source_vm.id)

            error_msg = "Virtual Router #{vrouter_hash['VROUTER']['ID']} does "\
                        "not contain VM #{requested_vm_id}."
            logger.error {error_msg}
            halt 400, error_msg
        end
    end

    # Check if the requested VNET can be accessed from the curren VROUTER.
    # If false a halt is triggered.
    #
    # @param req_vnet [OpenNebula::VirtualNetwork]
    # @param vrouter_hash [Hash]
    # @param client [OpenNebula::Client]
    #
    def check_vnet_in_vrouter(req_vnet, vrouter_hash, client)
        valid_vnets = Set[]

        # Get VR nics
        nics = vrouter_hash['VROUTER']['TEMPLATE']['NIC']

        if !nics.is_a?(Array)
            nics = [nics]
        end

        # Get only one nic if multiple nic in same network
        nics.uniq! {|n| n['NETWORK_ID'] }

        have_access = false
        nics.each do |nic|
            # Get nic VNET
            nic_vnet = get_vnet(nic['NETWORK_ID'], client)

            # Provide access to nic's VNET
            valid_vnets.add(Integer(nic['NETWORK_ID']))
            # Provide access to nic's VNET parent (if exists)
            if !nic_vnet['PARENT_NETWORK_ID'].nil? &&
               !nic_vnet['PARENT_NETWORK_ID'].empty?
                valid_vnets.add(Integer(nic_vnet['PARENT_NETWORK_ID']))
            end
            # Provide access to nic's VNET childs
            xpath = '//LEASE/VNET'
            childs = nic_vnet.retrieve_xmlelements(xpath)

            childs.each do |c|
                valid_vnets.add(Integer(c.text))
            end
            # Provide access to VNETs with same parent as NIC network
            if !valid_vnets.include?(req_vnet.id)
                # Get requested vnet parent
                if !req_vnet['PARENT_NETWORK_ID'].empty?
                    req_parent = Integer(req_vnet['PARENT_NETWORK_ID'])
                end

                next unless valid_vnets.include?(req_parent)
            end

            have_access = true
            break
        end

        return if have_access

        error_msg = "Virtual Network #{req_vnet.id} cannot be retrieved"\
                    " from Virtual router #{vrouter_hash['VROUTER']['ID']}."
        logger.error {error_msg}
        halt 400, error_msg
    end

    # Escape data from user
    def escape_attr(attr)
        ret  = ''
        attr = attr.split('')

        # Boolean to indicate that section is being escaped
        escape = false

        # KEY=value with spaces -> KEY=\"value with spaces\"
        # KEY=[KEY2=value with spaces] -> KEY=[KEY2=\"value with spaces\"]
        attr.each_with_index do |s, idx|
            if s == '=' && escape
                ret << s
                next
            end

            if s == '=' && attr[idx + 1] != '[' && attr[idx + 1] != "\""
                ret << "=\""

                escape = true
            elsif s == ',' && attr[idx - 1] != "\""
                ret << "\","
            elsif s == '[' && attr[idx - 1] != '=' && attr[idx - 1] != "\""
                ret << "\"["
            elsif s == ']' && attr[idx - 1] != '=' && attr[idx - 1] != "\""
                ret << "\"]"

                escape = false
            elsif s == '\\' && attr[idx - 1] != "\""
                ret << "\"\\"

                escape = false
            elsif s == "\n" && attr[idx - 1] != "\""
                ret << "\"\n"

                escape = false
            else
                ret << s
            end
        end

        # Replace escaped \n by no scaped one
        ret.gsub!("\\n", "\n")

        if escape && ret[-1] != ']' && ret[-1] != "\""
            ret.insert(ret.size, "\"")
        end

        ret
    end

    # Update VM user template
    #
    # @param object [OpenNebula::VirtualMachine] VM to update
    # @param params [Object]                     HTTP request parameters
    def update(object, params)
        attr = params[:data]
        type = params[:type]

        if type.nil?
            type = 1
        else
            type = type.to_i
        end

        attr = request.body.read if attr.nil?

        # Escape attr
        # ###########
        attr = escape_attr(attr)

        if type == 1
            error = "cannot be modified"
        else
            error = "cannot be deleted"
        end

        check_restricted_attrs(attr, error)

        rc = object.info

        if OpenNebula.is_error?(rc)
            logger.error {"VMID:#{object['ID']} vm.update error: #{rc.message}"}
            halt 500, rc.message
        end

        if type == 1
            rc = object.update(attr, true)
        else
            rc = object.delete_element("USER_TEMPLATE/#{attr}")
        end

        if OpenNebula.is_error?(rc)
            logger.error {"VMID:#{object['ID']} vm.update error: #{rc.message}"}
            halt 500, rc.message
        end

        if rc && rc.empty? && type == 2
            logger.error {"VMID:#{object['ID']} vm.update error: " \
                        'attribute not found'}
            halt 500, 'attribute not found'
        end

        rc = object.update(object.user_template_str) if type == 2

        if OpenNebula.is_error?(rc)
            logger.error {"VMID:#{object['ID']} vm.update error: #{rc.message}"}
            halt 500, rc.message
        end
    end
end

NIC_VALID_KEYS = %w(IP IP6_LINK IP6_SITE IP6_GLOBAL NETWORK MAC NAME PARENT EXTERNAL EXTERNAL_IP)
USER_TEMPLATE_INVALID_KEYS = %w(SCHED_MESSAGE)

def build_vm_hash(vm_hash)
    nics = []

    if vm_hash["TEMPLATE"]["NIC"]
        [vm_hash["TEMPLATE"]["NIC"]].flatten.each do |nic|
            nics << Hash[nic.select{|k,v| NIC_VALID_KEYS.include?(k)}]
        end
    end

    alias_nics = []

    if vm_hash["TEMPLATE"]["NIC_ALIAS"]
        [vm_hash["TEMPLATE"]["NIC_ALIAS"]].flatten.each do |nic|
            alias_nics << Hash[nic.select{|k,v| NIC_VALID_KEYS.include?(k)}]
        end
    end

    OpenNebula::VirtualMachine::EXTERNAL_IP_ATTRS.each do |attr|
        external_ip = vm_hash["MONITORING"][attr]

        if !external_ip.nil? && !nics.include?(external_ip)
            nics.push({'IP' => external_ip})
        end
    end

    {
        "VM" => {
            "NAME"          => vm_hash["NAME"],
            "ID"            => vm_hash["ID"],
            "STATE"         => vm_hash["STATE"],
            "LCM_STATE"     => vm_hash["LCM_STATE"],
            "USER_TEMPLATE" => Hash[vm_hash["USER_TEMPLATE"].select {|k,v|
                                    !USER_TEMPLATE_INVALID_KEYS.include?(k)
                                }],
            "TEMPLATE"  => {
                "NIC" => nics,
                "NIC_ALIAS" => alias_nics
            }
        }
    }
end

def build_service_hash(service_hash, client = nil, extended = false)
    roles = service_hash["DOCUMENT"]["TEMPLATE"]["BODY"]["roles"]

    if roles.nil?
        return nil
    end

    service_info = {
        "name"  => service_hash["DOCUMENT"]["NAME"],
        "id"    => service_hash["DOCUMENT"]["ID"],
        "state" => service_hash["DOCUMENT"]["TEMPLATE"]["BODY"]["state"],
        "roles" => []
    }

    roles.each do |role|
        role_info = {
            "name"        => role["name"],
            "cardinality" => role["cardinality"],
            "state"       => role["state"],
            "nodes"       => []
        }

        if (nodes = role["nodes"])
            nodes.each do |vm|
                vm_deploy_id = vm["deploy_id"].to_i
                if extended
                    vm_info = get_vm(vm_deploy_id, client).to_hash
                else
                    vm_info = vm["vm_info"]
                end

                vm_running = vm["running"]

                role_info["nodes"] << {
                    "deploy_id" => vm_deploy_id,
                    "running"   => vm["running"],
                    "vm_info"   => vm_info
                }
            end
        end

        service_info["roles"] << role_info
    end

    {
        "SERVICE" => service_info
    }
end

def build_vrouter_hash(vrouter_hash, _client = nil, _extended = false)
    vrouter = {
        'VROUTER' => {
            'NAME'      => vrouter_hash['VROUTER']['NAME'],
            'ID'        => vrouter_hash['VROUTER']['ID'],
            'VMS'       => vrouter_hash['VROUTER']['VMS'],
            'TEMPLATE'  => vrouter_hash['VROUTER']['TEMPLATE']
        }
    }

    # Manage special cases (arrays)
    if !vrouter['VROUTER']['TEMPLATE']['NIC'].is_a?(Array)
        if vrouter['VROUTER']['TEMPLATE']['NIC'].nil?
            vrouter['VROUTER']['TEMPLATE']['NIC'] = []
        else
            vrouter['VROUTER']['TEMPLATE']['NIC'] = [
                vrouter['VROUTER']['TEMPLATE']['NIC']
            ]
        end
    end

    if !vrouter_hash['VROUTER']['VMS']['ID'].is_a?(Array)
        if vrouter_hash['VROUTER']['VMS']['ID'].nil?
            vrouter_hash['VROUTER']['VMS']['ID'] = []
        else
            vrouter_hash['VROUTER']['VMS']['ID'] = [
                vrouter_hash['VROUTER']['VMS']['ID']
            ]
        end
    end

    vrouter
end

VNET_ATTRIBUTES = %w[ID NAME USED_LEASES VROUTERS PARENT_NETWORK_ID AR_POOL]

def process_vnet(vnet_hash)
    template = {}

    get_vnet_template_attributes.each do |key|
        value = vnet_hash['VNET']['TEMPLATE'][key]
        template[key] = value unless value.nil?
    end

    vnet = {}
    VNET_ATTRIBUTES.each do |key|
        vnet[key] = vnet_hash['VNET'][key]
    end

    vnet['TEMPLATE'] = template

    # Manage special cases (arrays)
    if !vnet['AR_POOL']['AR'].is_a?(Array)
        if vnet['AR_POOL']['AR'].nil?
            vnet['AR_POOL']['AR'] = []
        else
            vnet['AR_POOL']['AR'] = [vnet['AR_POOL']['AR']]
        end
    end

    vnet['AR_POOL']['AR'].each do |ar|
        if !ar['LEASES']['LEASE'].is_a?(Array)
            if ar['LEASES']['LEASE'].nil?
                ar['LEASES']['LEASE'] = []
            else
                ar['LEASES']['LEASE'] = [ar['LEASES']['LEASE']]
            end
        end
    end

    if !vnet['VROUTERS']['ID'].is_a?(Array)
        if vnet['VROUTERS']['ID'].nil?
            !vnet['VROUTERS']['ID'] = []
        else
            vnet['VROUTERS']['ID'] = [vnet['VROUTERS']['ID']]
        end
    end

    vnet
end

def build_vnet_hash(vnet, client, extended)
    # if extended flag is not set
    if extended.nil? || extended.downcase != 'true'
        vnet = vnet.to_hash
        vnet['VNET'] = process_vnet(vnet)

        return vnet
    end

    vm_pool = VirtualMachinePool.new(client)

    # get VMs that are using the VNET
    vms = ''
    vnet.retrieve_xmlelements('//LEASE/VM').each do |vm|
        vms << ',' unless vms.empty?
        vms << vm.text
    end

    vnet = vnet.to_hash
    vnet['VNET'] = process_vnet(vnet)

    rc = vm_pool.info_set(vms, true)
    if OpenNebula.is_error?(rc)
        logger.error {"vmpool.info error: #{rc.message}"}
        halt 404, rc.message
    end

    # Get ARs array
    ars = vnet['VNET']['AR_POOL']['AR']
    # rubocop:disable Style/ArrayCoercion
    ars = [ars] unless ars.is_a?(Array)

    ars.each do |ar|
        leases = ar['LEASES']['LEASE']

        next if leases.nil?

        leases = [leases] unless leases.is_a?(Array)
        # rubocop:enable Style/ArrayCoercion

        leases.each do |lease|
            next if lease['VM'].nil? || Integer(lease['VM']) < 0

            # Get the corresponding VM from pool
            xpath = "/VM_POOL/VM[ID=#{lease['VM']}]"
            vm = vm_pool.retrieve_xmlelements(xpath)[0]

            # Get corresponding NIC from VM (MAC should be unique)
            xpath = "./TEMPLATE/NIC[MAC=\"#{lease['MAC']}\"]"
            nic = vm.retrieve_xmlelements(xpath)[0]

            if nic.nil?
                xpath = "./TEMPLATE/NIC_ALIAS[MAC=\"#{lease['MAC']}\"]"
                nic = vm.retrieve_xmlelements(xpath)[0]

                # get parent network
                xpath = "./TEMPLATE/NIC[NIC_ID=\"#{nic['PARENT_ID']}\"]/NETWORK_ID"
                parent_id = vm.retrieve_xmlelements(xpath)[0].text

                # Get ALIAS extended info
                lease['PARENT']            = nic['PARENT']
                lease['PARENT_NETWORK_ID'] = parent_id
                lease['EXTERNAL'] = !nic['EXTERNAL'].nil? &&
                                    nic['EXTERNAL'].downcase == 'yes'
            end

            # Get extended info
            lease['NIC_NAME'] = nic['NAME']

            xpath = "./TEMPLATE/CONTEXT/BACKEND"
            backend = vm.retrieve_xmlelements(xpath)[0]

            if !backend.nil? && backend.text.downcase == 'yes'
                lease['BACKEND'] = 'YES'

                xpath = "./USER_TEMPLATE/*[starts-with(local-name(), 'ONEGATE_')]"
                vm.retrieve_xmlelements(xpath).each do |item|
                    lease[item.name] = item.text
                end
            end
        end
    end

    vnet
end

get '/' do
    client = authenticate(request.env, params)

    if $conf[:ssl_server]
        base_uri = $conf[:ssl_server]
    else
        protocol = request.env["rack.url_scheme"]
        host     = request.env["HTTP_HOST"]
        base_uri = "#{protocol}://#{host}"
    end

    response = {
        "vm_info"      => "#{base_uri}/vm",
        "service_info" => "#{base_uri}/service"
    }

    [200, response.to_json]
end

put '/vm' do
    check_permissions(:vm, :update)
    client = authenticate(request.env, params)

    source_vm = get_source_vm(request.env, client)

    update(source_vm, params)

    [200, ""]
end

get '/vm' do
    check_permissions(:vm, :show)
    client = authenticate(request.env, params)

    source_vm = get_source_vm(request.env, client)

    response = build_vm_hash(source_vm.to_hash["VM"])
    [200, response.to_json]
end

get '/service' do
    check_permissions(:service, :show)
    client = authenticate(request.env, params)

    source_vm = get_source_vm(request.env, client)
    service_id = source_vm['USER_TEMPLATE/SERVICE_ID']

    response = check_vm_in_service(source_vm['ID'], service_id, client, params['extended'])
    [200, response.to_json]
end

get '/vrouter' do
    check_permissions(:vrouter, :show)
    client = authenticate(request.env, params)

    source_vm    = get_source_vm(request.env, client)
    vrouter_id   = source_vm['TEMPLATE/VROUTER_ID']
    vrouter_hash = get_vrouter(vrouter_id, client).to_hash

    check_vm_in_vrouter(Integer(source_vm['ID']), vrouter_hash, source_vm)

    response = build_vrouter_hash(vrouter_hash, client, params['extended']) rescue nil
    if response.nil?
        error_msg = "Virtual router #{vrouter_id} is empty."
        logger.error {error_msg}
        halt 400, error_msg
    end

    [200, response.to_json]
end

get '/vnet/:id' do
    check_permissions(:vnet, :show_by_id)
    client = authenticate(request.env, params)

    # Check :id is an integer
    vnet_id = begin
        Integer(params[:id])
    rescue ArgumentError
        error_msg = "Invalid id format (ID: #{params[:id]}). "\
                    'ID must be an integer.'
        logger.error { error_msg }
        halt 400, error_msg
    end

    source_vm = get_source_vm(request.env, client)
    vrouter_id = source_vm['TEMPLATE/VROUTER_ID']

    # Check if current VM is a VROUTER
    if vrouter_id.nil? || vrouter_id.empty?
        error_msg = 'Virtual networks information can only be' \
                    ' retrieved from Virtual Routers.'
        logger.error {error_msg}
        halt 400, error_msg
    end

    # Retrieve VROUTER information
    vrouter_hash = get_vrouter(vrouter_id, client).to_hash
    check_vm_in_vrouter(Integer(source_vm['ID']), vrouter_hash, source_vm)

    # Retrieve requested VNET
    req_vnet = get_vnet(Integer(vnet_id), client)
    check_vnet_in_vrouter(req_vnet, vrouter_hash, client)

    response = build_vnet_hash(req_vnet, client, params['extended']) rescue nil

    if response.nil?
        error_msg = "Virtual router #{vrouter_hash['VROUTER']['ID']} is empty."
        logger.error {error_msg}
        halt 400, error_msg
    end

    [200, response.to_json]
end

get '/vms/:id' do
    check_permissions(:vm, :show_by_id)
    client = authenticate(request.env, params)

    requested_vm = get_requested_vm(params[:id].to_i, request.env, client)

    [200, build_vm_hash(requested_vm.to_hash["VM"]).to_json]
end

post '/vms/:id/action' do
    check_permissions(:vm, :action_by_id)
    client = authenticate(request.env, params)

    requested_vm = get_requested_vm(params[:id].to_i, request.env, client)

    perform_action(requested_vm, request.body.read)
    [204, requested_vm.to_json]
end

put '/service/role/:role' do
    check_permissions(:service, :change_cardinality)
    client = authenticate(request.env, params)

    source_vm = get_source_vm(request.env, client)
    service_id = source_vm['USER_TEMPLATE/SERVICE_ID']

    check_vm_in_service(source_vm['ID'], service_id, client)

    cardinality = JSON.parse(request.body.read)["cardinality"]
    body_json = {
          :cardinality => cardinality,
          :role_name => params[:role],
          :force => false
    }.to_json

    action_response = flow_client(client).post(
        "/service/" + service_id + "/scale",
        body_json)

    if CloudClient::is_error?(action_response)
        error_msg = "Error performing action on service #{service_id} role #{params[:role]}"
        logger.error {error_msg}
        logger.error {action_response.message}
        halt 400, error_msg
    end

    [200, ""]
end

put '/vms/:id' do
    check_permissions(:vm, :update_by_id)
    client = authenticate(request.env, params)

    requested_vm = get_requested_vm(params[:id].to_i, request.env, client)

    update(requested_vm, params)

    [200, ""]
end

%w[get head post put delete options patch].each do |method|
    send method, '/*' do
        error_msg = 'OneGate server doesn\'t support this feature'
        logger.error {error_msg}
        halt 400, error_msg
    end
end
