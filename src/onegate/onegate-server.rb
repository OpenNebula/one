#!/usr/bin/env ruby
# -*- coding: utf-8 -*-

# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    LOG_LOCATION = "/var/log/one"
    VAR_LOCATION = "/var/lib/one"
    ETC_LOCATION = "/etc/one"
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
    VAR_LOCATION = ONE_LOCATION + "/var"
    LOG_LOCATION = ONE_LOCATION + "/var"
    ETC_LOCATION = ONE_LOCATION + "/etc"
    RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby"
end

ONEGATE_AUTH = VAR_LOCATION + "/.one/onegate_auth"

ONEGATE_LOG = LOG_LOCATION + "/onegate.log"
CONFIGURATION_FILE = ETC_LOCATION + "/onegate-server.conf"

$: << RUBY_LIB_LOCATION
$: << RUBY_LIB_LOCATION+'/cloud'

require 'rubygems'
require 'sinatra'
require 'yaml'
require 'json'

require 'CloudAuth'
require 'CloudServer'

require 'opennebula'
require 'opennebula/oneflow_client'

USER_AGENT = 'GATE'
RESOURCE_PATH = "/service"

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
logger = enable_logging(ONEGATE_LOG, $conf[:debug_level].to_i)

begin
    ENV["ONE_CIPHER_AUTH"] = ONEGATE_AUTH
    $cloud_auth = CloudAuth.new($conf, logger)
rescue => e
    logger.error { "Error initializing authentication system" }
    logger.error { e.message }
    exit(-1)
end

set :cloud_auth, $cloud_auth

$flow_client = Service::Client.new(:user_agent => USER_AGENT)

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
            return $cloud_auth.client(result)
        end
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

    def get_service(vm)
        vm_id = vm["ID"]

        service_id = vm['USER_TEMPLATE/SERVICE_ID']

        if service_id.nil? || !service_id.match(/^\d+$/)
            error_msg = "VMID:#{vm_id} Empty or invalid SERVICE_ID"
            logger.error {error_msg}
            halt 400, error_msg
        end

        service = $flow_client.get("#{RESOURCE_PATH}/#{service_id}")

        if CloudClient::is_error?(service)
            error_msg = "VMID:#{vm_id} Service #{service_id} not found"
            logger.error {error_msg}
            halt 404, error_msg
        end

        service.body
    end
end

NIC_VALID_KEYS = %w(IP IP6_LINK IP6_SITE IP6_GLOBAL NETWORK MAC)

USER_TEMPLATE_INVALID_KEYS = %w(
    SCHED_MESSAGE
)

def build_vm_hash(vm_hash)
    nics = []
    vm_hash["TEMPLATE"]["NIC"].each do |nic|
        nics << nic.select{|k,v| NIC_VALID_KEYS.include?(k)}
    end

    {
        "VM" => {
            "NAME"          => vm_hash["NAME"],
            "ID"            => vm_hash["ID"],
            "USER_TEMPLATE" => vm_hash["USER_TEMPLATE"].select {|k,v|
                                    !USER_TEMPLATE_INVALID_KEYS.include?(k)
                                },
            "TEMPLATE"  => {
                "NIC" => nics
            }
        }
    }
end

def build_service_hash(service_hash)
    roles = service_hash["DOCUMENT"]["TEMPLATE"]["BODY"]["roles"]

    if roles.nil?
        return nil
    end

    service_info = {
        "name"  => service_hash["DOCUMENT"]["NAME"],
        "id"    => service_hash["DOCUMENT"]["ID"],
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
                vm_info      = vm["vm_info"]["VM"]
                vm_running   = vm["running"]

                role_info["nodes"] << {
                    "deploy_id" => vm_deploy_id,
                    "running"   => vm["running"],
                    "vm_info"   => build_vm_hash(vm_info)
                }
            end
        end

        service_info["roles"] << role_info
    end

    {
        "SERVICE" => service_info
    }
end

get '/' do
    client = authenticate(request.env, params)
    halt 401, "Not authorized" if client.nil?

    protocol = request.env["rack.url_scheme"]
    host     = request.env["HTTP_HOST"]

    base_uri = "#{protocol}://#{host}"

    response = {
        "vm_info"      => "#{base_uri}/vm",
        "service_info" => "#{base_uri}/service"
    }

    [200, response.to_json]
end

put '/vm' do
    client = authenticate(request.env, params)

    halt 401, "Not authorized" if client.nil?

    vm_id = request.env['HTTP_X_ONEGATE_VMID'].to_i

    vm = get_vm(vm_id, client)

    rc = vm.update(request.body.read, true)

    if OpenNebula.is_error?(rc)
        logger.error {"VMID:#{vm_id} vm.update error: #{rc.message}"}
        halt 500, rc.message
    end

    [200, ""]
end

get '/vm' do
    client = authenticate(request.env, params)

    halt 401, "Not authorized" if client.nil?

    vm_id = request.env['HTTP_X_ONEGATE_VMID'].to_i

    vm = get_vm(vm_id, client)

    response = build_vm_hash(vm.to_hash["VM"])

    [200, response.to_json]
end

get '/service' do
    client = authenticate(request.env, params)

    halt 401, "Not authorized" if client.nil?

    vm_id = request.env['HTTP_X_ONEGATE_VMID'].to_i

    vm = get_vm(vm_id, client)

    service = get_service(vm)

    service_hash = JSON.parse(service)

    response = build_service_hash(service_hash) rescue nil

    if response.nil?
        error_msg = "VMID:#{vm_id} Service #{service_id} is empty."
        logger.error {error_msg}
        halt 400, error_msg
    end

    service_vm_ids = response["SERVICE"]["roles"].collect do |r|
                        r["nodes"].collect{|n| n["deploy_id"]}
                     end.flatten

    # Check that the user has not spoofed the Service_ID
    if service_vm_ids.empty? || !service_vm_ids.include?(vm_id)
        error_msg = "VMID:#{vm_id} Service #{service_id} does not contain VM."
        logger.error {error_msg}
        halt 400, error_msg
    end

    [200, response.to_json]
end
