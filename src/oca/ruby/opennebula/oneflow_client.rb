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

require 'uri'
require 'ipaddress'
require 'cloud/CloudClient'

include CloudCLI

module Role

    # Actions that can be performed on the VMs of a given Role
    SCHEDULE_ACTIONS = [
        'terminate',
        'terminate-hard',
        'undeploy',
        'undeploy-hard',
        'hold',
        'release',
        'stop',
        'suspend',
        'resume',
        'reboot',
        'reboot-hard',
        'poweroff',
        'poweroff-hard',
        'snapshot-create',
        'snapshot-revert',
        'snapshot-delete',
        'disk-snapshot-create',
        'disk-snapshot-revert',
        'disk-snapshot-delete'
    ]

    STATE = {
        'PENDING'                 => 0,
        'DEPLOYING'               => 1,
        'RUNNING'                 => 2,
        'UNDEPLOYING'             => 3,
        'WARNING'                 => 4,
        'DONE'                    => 5,
        'FAILED_UNDEPLOYING'      => 6,
        'FAILED_DEPLOYING'        => 7,
        'SCALING'                 => 8,
        'FAILED_SCALING'          => 9,
        'COOLDOWN'                => 10,
        'HOLD'                    => 11
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
        'COOLDOWN',
        'HOLD'
    ]

    # Returns the string representation of the role state
    # @param [String] state String number representing the state
    # @return the state string
    def self.state_str(state_number)
        STATE_STR[state_number.to_i]
    end

end

module Service

    STATE = {
        'PENDING'                 => 0,
        'DEPLOYING'               => 1,
        'RUNNING'                 => 2,
        'UNDEPLOYING'             => 3,
        'WARNING'                 => 4,
        'DONE'                    => 5,
        'FAILED_UNDEPLOYING'      => 6,
        'FAILED_DEPLOYING'        => 7,
        'SCALING'                 => 8,
        'FAILED_SCALING'          => 9,
        'COOLDOWN'                => 10,
        'DEPLOYING_NETS'          => 11,
        'UNDEPLOYING_NETS'        => 12,
        'FAILED_DEPLOYING_NETS'   => 13,
        'FAILED_UNDEPLOYING_NETS' => 14,
        'HOLD'                    => 15
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
        'COOLDOWN',
        'DEPLOYING_NETS',
        'UNDEPLOYING_NETS',
        'FAILED_DEPLOYING_NETS',
        'FAILED_UNDEPLOYING_NETS',
        'HOLD'
    ]

    # Returns the string representation of the service state
    # @param [String] state String number representing the state
    # @return the state string
    def self.state_str(state_number)
        STATE_STR[state_number.to_i]
    end

    # Build a json specifying an action
    # @param [String] perform action to be performed (e.g.: shutdown)
    # @param [Hash, nil] params contains the params for the action
    # @return [String] json representing the action
    def self.build_json_action(perform, params = nil)
        body = {}
        body['perform'] = perform
        body['params']  = params if params

        action = {}
        action['action'] = body

        JSON.pretty_generate action
    end

    # CLI options

    DEFAULT_OPTIONS = [
        ENDPOINT = {
            :name => 'server',
            :short => '-s url',
            :large => '--server url',
            :format => String,
            :description => 'Service endpoint'
        },
        USERNAME={
            :name => 'username',
            :short => '-u name',
            :large => '--username name',
            :format => String,
            :description => 'User name'
        },
        PASSWORD={
            :name => 'password',
            :short => '-p pass',
            :large => '--password pass',
            :format => String,
            :description => 'User password'
        }
    ]

    JSON_FORMAT = {
        :name => 'json',
        :short => '-j',
        :large => '--json',
        :description => 'Print the resource in JSON'
    }

    TOP = {
        :name => 'top',
        :short => '-t',
        :large => '--top',
        :description => 'Top for the command'
    }

    PERIOD = {
        :name => 'period',
        :short => '-p x',
        :large => '--period x',
        :format => Integer,
        :description => 'Seconds between each group of actions'
    }

    NUMBER = {
        :name => 'number',
        :short => '-n x',
        :large => '--number x',
        :format => Integer,
        :description => 'Number of VMs to apply the action to each period'
    }

    FORCE = {
        :name => 'force',
        :short => '-f',
        :large => '--force',
        :description => 'Force the new cardinality even if it is outside the limits'
    }

    # Format helpers

    #    def self.rname_to_id(name, poolname, options)
    def self.rname_to_id(name, poolname)
        return 0, name.to_i if name.match(/^[0123456789]+$/)

        client = Service::Client.new

        resource_path = case poolname
                        when 'SERVICE'          then '/service'
                        when 'SERVICE TEMPLATE' then '/service_template'
                        end

        response = client.get(resource_path)

        if CloudClient.is_error?(response)
            return -1, "OpenNebula #{poolname} name not found," <<
                       ' use the ID instead'
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

        return -1, "#{ename} named #{name} not found." unless objects.length>0
        return -1, "There are multiple #{ename}s with name #{name}." if objects.length>1

        result = objects.first['ID']

        [0, result]
    end

    def self.list_to_id(names, poolname)
        client = Service::Client.new

        resource_path = case poolname
                        when 'SERVICE'          then '/service'
                        when 'SERVICE TEMPLATE' then '/service_template'
                        end

        response = client.get(resource_path)

        if CloudClient.is_error?(response)
            return -1, "OpenNebula #{poolname} name not found," <<
                       ' use the ID instead'
        end

        pool = JSON.parse(response.body)

        result = names.split(',').collect do |name|
            if name.match(/^[0123456789]+$/)
                name.to_i
            else
                rc = name_to_id(name, pool, poolname)

                if rc.first == -1
                    return rc[0], rc[1]
                end

                rc[1]
            end
        end

        [0, result]
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
            response = block.call(id) if block_given?

            if CloudClient.is_error?(response)
                puts response
                exit_code = response.code.to_i
            end
        end

        exit_code
    end

    # Perform an action on a resource
    # @param [Integer] id resource id
    # @param [Block] block action to be performed
    # @return [Integer] exit_code
    def self.perform_action(id, &block)
        exit_code = 0
        response  = block.call(id) if block_given?

        if CloudClient.is_error?(response)
            puts response
            exit_code = response.code.to_i
        end

        exit_code
    end

    #
    # Interface to OneFlow REST API through a Ruby client
    #
    class Client

        #
        # The options are read from ENV and FS if not passed
        #
        # @param [Hash] opts Required configuration to interact with OneFlow
        # @option opts [String] :url Endpoint where OneFlow is running. Defaults to 'http://localhost:2474'
        # @option opts [String] :username OpenNebula user
        # @option opts [String] :password OpenNebula user password
        # @option opts [String] :user_agent Defaults to Ruby. Oneflow will behave accordingly.
        #
        def initialize(opts = {})
            endpoint  = '/.one/oneflow_endpoint'
            @username = opts[:username] || ENV['ONEFLOW_USER']
            @password = opts[:password] || ENV['ONEFLOW_PASSWORD']

            if opts[:url]
                url = opts[:url]
            elsif ENV['ONEFLOW_URL']
                url = ENV['ONEFLOW_URL']
            elsif ENV['HOME'] && File.exist?(ENV['HOME'] + endpoint)
                url = File.read(ENV['HOME'] + endpoint).strip
            elsif File.exist?('/var/lib/one/.one/oneflow_endpoint')
                url = File.read('/var/lib/one/.one/oneflow_endpoint').strip
            else
                url = 'http://localhost:2474'
            end

            if @username.nil? && @password.nil?
                if ENV['ONE_AUTH'] and !ENV['ONE_AUTH'].empty? and File.file?(ENV['ONE_AUTH'])
                    one_auth = File.read(ENV['ONE_AUTH'])
                elsif ENV['HOME'] and File.file?(ENV['HOME']+'/.one/one_auth')
                    one_auth = File.read(ENV['HOME']+'/.one/one_auth')
                elsif File.file?('/var/lib/one/.one/one_auth')
                    one_auth = File.read('/var/lib/one/.one/one_auth')
                else
                    raise 'ONE_AUTH file not present'
                end

                one_auth = one_auth.rstrip

                @username, @password = one_auth.split(':')
            end

            @uri = URI.parse(url)

            @user_agent = "OpenNebula #{CloudClient::VERSION} " <<
                "(#{opts[:user_agent]||'Ruby'})"

            @host = nil
            @port = nil

            return unless ENV['http_proxy']

            uri_proxy = URI.parse(ENV['http_proxy'])
            flag = false

            #  Check if we need to bypass the proxy
            if ENV['no_proxy']
                ENV['no_proxy'].split(',').each do |item|
                    item = item.strip

                    if (IPAddress @uri.host rescue nil).nil?
                        if (IPAddress(item) rescue nil).nil?
                            flag |= (item == @uri.host)
                        end
                    else
                        unless (IPAddress item rescue nil).nil?
                            flag |= IPAddress(item).include? IPAddress(@uri.host)
                        end
                    end
                end
            end

            return if flag

            @host = uri_proxy.host
            @port = uri_proxy.port
        end

        def set_content_type(content_type)
            @content_type = content_type
        end

        def get(path)
            req = Net::HTTP::Proxy(@host, @port)::Get.new(path)

            do_request(req)
        end

        def delete(path, body = nil)
            req = Net::HTTP::Proxy(@host, @port)::Delete.new(path)
            req.body = body if body

            do_request(req)
        end

        def post(path, body)
            req = Net::HTTP::Proxy(@host, @port)::Post.new(path)
            req.body = body

            if path.start_with?('/service_template') && !@content_type.nil?
                req.content_type = @content_type
            end
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

            if !@uri.path.nil?
                req.instance_variable_set(:@path, @uri.path + req.path)
            end

            CloudClient.http_start(@uri, @timeout) do |http|
                http.request(req)
            end
        end

    end

end
