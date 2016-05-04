# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

require 'uri'
require 'cloud/CloudClient'

include CloudCLI

module Role
    # Actions that can be performed on the VMs of a given Role
    SCHEDULE_ACTIONS = [
        'shutdown',
        'shutdown-hard',
        'undeploy',
        'undeploy-hard',
        'hold',
        'release',
        'stop',
        'suspend',
        'resume',
        'delete',
        'delete-recreate',
        'reboot',
        'reboot-hard',
        'poweroff',
        'poweroff-hard',
        'snapshot-create'
    ]

    STATE = {
        'PENDING'            => 0,
        'DEPLOYING'          => 1,
        'RUNNING'            => 2,
        'UNDEPLOYING'        => 3,
        'WARNING'            => 4,
        'DONE'               => 5,
        'FAILED_UNDEPLOYING' => 6,
        'FAILED_DEPLOYING'   => 7,
        'SCALING'            => 8,
        'FAILED_SCALING'     => 9,
        'COOLDOWN'           => 10
    }

    STATE_STR = [
        'PENDING',
        'DEPLOYING',
        'RUNNING',
        'UNDEPLOYING',
        'WARNING',
        'DONE',
        'FAILED_UNDEPLOYING',
        'FAILED_DEPLOYING',
        'SCALING',
        'FAILED_SCALING',
        'COOLDOWN'
    ]

    # Returns the string representation of the role state
    # @param [String] state String number representing the state
    # @return the state string
    def self.state_str(state_number)
        return STATE_STR[state_number.to_i]
    end
end

module Service

    STATE = {
        'PENDING'            => 0,
        'DEPLOYING'          => 1,
        'RUNNING'            => 2,
        'UNDEPLOYING'        => 3,
        'WARNING'            => 4,
        'DONE'               => 5,
        'FAILED_UNDEPLOYING' => 6,
        'FAILED_DEPLOYING'   => 7,
        'SCALING'            => 8,
        'FAILED_SCALING'     => 9,
        'COOLDOWN'           => 10
    }

    STATE_STR = [
        'PENDING',
        'DEPLOYING',
        'RUNNING',
        'UNDEPLOYING',
        'WARNING',
        'DONE',
        'FAILED_UNDEPLOYING',
        'FAILED_DEPLOYING',
        'SCALING',
        'FAILED_SCALING',
        'COOLDOWN'
    ]

    # Returns the string representation of the service state
    # @param [String] state String number representing the state
    # @return the state string
    def self.state_str(state_number)
        return STATE_STR[state_number.to_i]
    end

    # Build a json specifying an action
    # @param [String] perform action to be performed (i.e: shutdowm)
    # @param [Hash, nil] params contains the params for the action
    # @return [String] json representing the action
    def self.build_json_action(perform, params=nil)
        body = Hash.new
        body['perform'] = perform
        body['params']  = params if params

        action = Hash.new
        action['action'] = body

        JSON.pretty_generate action
    end

    # CLI options

    DEFAULT_OPTIONS = [
        ENDPOINT = {
            :name => "server",
            :short => "-s url",
            :large => "--server url",
            :format => String,
            :description => "Service endpoint"
        },
        USERNAME={
            :name => "username",
            :short => "-u name",
            :large => "--username name",
            :format => String,
            :description => "User name"
        },
        PASSWORD={
            :name => "password",
            :short => "-p pass",
            :large => "--password pass",
            :format => String,
            :description => "User password"
        }
    ]

    JSON_FORMAT = {
        :name => "json",
        :short => "-j",
        :large => "--json",
        :description => "Print the resource in JSON"
    }

    TOP = {
        :name => "top",
        :short => "-t",
        :large => "--top",
        :description => "Top for the command"
    }

    PERIOD = {
        :name => "period",
        :short => "-p x",
        :large => "--period x",
        :format => Integer,
        :description => "Seconds between each group of actions"
    }

    NUMBER = {
        :name => "number",
        :short => "-n x",
        :large => "--number x",
        :format => Integer,
        :description => "Number of VMs to apply the action to each period"
    }

    FORCE = {
        :name => "force",
        :short => "-f",
        :large => "--force",
        :description => "Force the new cardinality even if it is outside the limits"
    }

    # Format helpers

#    def self.rname_to_id(name, poolname, options)
    def self.rname_to_id(name, poolname)
        return 0, name.to_i if name.match(/^[0123456789]+$/)

        client = Service::Client.new()

        resource_path = case poolname
        when "SERVICE"          then "/service"
        when "SERVICE TEMPLATE" then "/service_template"
        end

        response = client.get(resource_path)

        if CloudClient::is_error?(response)
            return -1, "OpenNebula #{poolname} name not found," <<
                       " use the ID instead"
        end

        pool = JSON.parse(response.body)
        name_to_id(name, pool, poolname)
    end

    def self.rname_to_id_desc(poolname)
        "OpenNebula #{poolname} name or id"
    end

    def self.name_to_id(name, pool, ename)
        if pool['DOCUMENT_POOL']['DOCUMENT'].nil?
            return -1, "#{ename} named #{name} not found."
        end

        objects = pool['DOCUMENT_POOL']['DOCUMENT'].select {|object| object['NAME'] == name }

        if objects.length>0
            if objects.length>1
                return -1, "There are multiple #{ename}s with name #{name}."
            else
                result = objects.first['ID']
            end
        else
            return -1, "#{ename} named #{name} not found."
        end

        return 0, result
    end

    def self.list_to_id(names, poolname)

        client = Service::Client.new()

        resource_path = case poolname
        when "SERVICE"          then "/service"
        when "SERVICE TEMPLATE" then "/service_template"
        end

        response = client.get(resource_path)

        if CloudClient::is_error?(response)
            return -1, "OpenNebula #{poolname} name not found," <<
                       " use the ID instead"
        end

        pool = JSON.parse(response.body)

        result = names.split(',').collect { |name|
            if name.match(/^[0123456789]+$/)
                name.to_i
            else
                rc = name_to_id(name, pool, poolname)

                if rc.first == -1
                    return rc[0], rc[1]
                end

                rc[1]
            end
        }

        return 0, result
    end

    def self.list_to_id_desc(poolname)
        "Comma-separated list of OpenNebula #{poolname} names or ids"
    end

    # Perform an action on several resources
    # @param [Array] ids resources ids
    # @param [Block] block action to be performed
    # @return [Integer] exit_code
    def self.perform_actions(ids, &block)
        exit_code = 0

        ids.each do |id|
            response = block.call(id)

            if CloudClient::is_error?(response)
                puts response.to_s
                exit_code = response.code.to_i
            end
        end

        exit_code
    end

    class Client
        def initialize(opts={})
            @username = opts[:username] || ENV['ONEFLOW_USER']
            @password = opts[:password] || ENV['ONEFLOW_PASSWORD']

            url = opts[:url] || ENV['ONEFLOW_URL'] || 'http://localhost:2474'

            if @username.nil? && @password.nil?
                if ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and File.file?(ENV["ONE_AUTH"])
                    one_auth = File.read(ENV["ONE_AUTH"])
                elsif ENV["HOME"] and File.file?(ENV["HOME"]+"/.one/one_auth")
                    one_auth = File.read(ENV["HOME"]+"/.one/one_auth")
                elsif File.file?("/var/lib/one/.one/one_auth")
                    one_auth = File.read("/var/lib/one/.one/one_auth")
                else
                    raise "ONE_AUTH file not present"
                end

                one_auth = one_auth.rstrip

                @username, @password = one_auth.split(':')
            end

            @uri = URI.parse(url)

            @user_agent = "OpenNebula #{CloudClient::VERSION} " <<
                "(#{opts[:user_agent]||"Ruby"})"

            @host = nil
            @port = nil

            if ENV['http_proxy']
                uri_proxy  = URI.parse(ENV['http_proxy'])
                @host = uri_proxy.host
                @port = uri_proxy.port
            end
        end

        def get(path)
            req = Net::HTTP::Proxy(@host, @port)::Get.new(path)

            do_request(req)
        end

        def delete(path)
            req =Net::HTTP::Proxy(@host, @port)::Delete.new(path)

            do_request(req)
        end

        def post(path, body)
            req = Net::HTTP::Proxy(@host, @port)::Post.new(path)
            req.body = body

            do_request(req)
        end

        def put(path, body)
            req = Net::HTTP::Proxy(@host, @port)::Put.new(path)
            req.body = body

            do_request(req)
        end

        def login
            req = Net::HTTP::Proxy(@host, @port)::Post.new('/login')

            do_request(req)
        end

        def logout
            req = Net::HTTP::Proxy(@host, @port)::Post.new('/logout')

            do_request(req)
        end

        private

        def do_request(req)
            req.basic_auth @username, @password

            req['User-Agent'] = @user_agent

            res = CloudClient::http_start(@uri, @timeout) do |http|
                http.request(req)
            end

            res
        end
    end
end