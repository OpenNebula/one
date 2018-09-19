#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

#
# LXD Container abstraction
#
class Container

    attr_reader :name, :status, :status_code, :config_expanded, :devices_expanded
    attr_accessor :devices, :config, :info

    CONTAINERS = 'containers'
    OPERATIONS = 'operations'

    # Error format, always have type: error, the rest is variable
    # {
    #     "type": "error",
    #     "error": "Failure",
    #     "error_code": 400,
    #     "metadata": {} # More details about the error
    # }

    # Creates the container object in memory.
    # Can be later created in LXD using create method
    def initialize(info, client)
        @client = client
        @info = info
        @name = @info['name']
        set_attr
    end

    class << self

        # Returns specific container, by its name
        # Params:
        # +name+:: container name
        def get(name, client)
            if exist(name, client)
                info = client.get("#{CONTAINERS}/#{name}")['metadata']
                Container.new(info, client)
            else
                OpenNebula.log_info("Container #{name} already exists")
            end
        rescue LXDError => exception
            raise exception
        end

        # Returns an array of container objects
        def get_all(client)
            # array of container names
            container_names = client.get(CONTAINERS)['metadata']
            containers = []
            container_names.each do |name|
                name = name.split('/').last
                containers.push(get(name, client))
            end
            containers
        end

        # Returns boolean indicating if the container exists(true) or not (false)
        def exist(name, client)
            client.get("#{CONTAINERS}/#{name}")
            true
        rescue LXDError => exception
            raise exception if exception.body['error_code'] != 404
        end

    end

    # Create a container without a base image
    def create(wait: true, timeout: '')
        @info['source'] = { 'type' => 'none' }
        wait?(@client.post(CONTAINERS, @info), wait, timeout)
    end

    # Delete container
    def delete(wait: true, timeout: '')
        wait?(@client.delete("#{CONTAINERS}/#{@name}"), wait, timeout)
    end

    # Updates the container in LXD server with the new configuration
    def update(wait: true, timeout: '')
        wait?(@client.put("#{CONTAINERS}/#{@name}", @info), wait, timeout)
    end

    # Status Control

    def start(options = {})
        change_state(__method__, options)
    end

    def stop(options = {})
        change_state(__method__, options)
    end

    def restart(options = {})
        change_state(__method__, options)
    end

    def freeze(options = {})
        change_state(__method__, options)
    end

    def unfreeze(options = {})
        change_state(__method__, options)
    end

    private

    # Updates container attr from @info
    def set_attr
        # TODO: make this variables, somehow pointers to @info,
        # TODO: to avoid calling this method
        @status = @info['status']
        @status_code = @info['status_code']
        @config = @info['config']
        @config_expanded = info['expanded_config']
        @devices = @info['devices']
        @devices_expanded = info['expanded_devices']
    end

    # Syncs the container in LXD with the container object in memory
    def update_local
        @info = @client.get("#{CONTAINERS}/#{@name}")['metadata']
        set_attr
    end

    # Waits for an operation to be completed
    def wait(response, timeout)
        operation_id = response['operation'].split('/').last
        timeout = timeout.to_s if timeout.is_a? Integer
        timeout = "?timeout=#{timeout}" unless timeout == ''
        operation = @client.get("#{OPERATIONS}/#{operation_id}/wait#{timeout}")
        update_local
        operation
    end

    # Waits or no for response depending on wait value
    def wait?(response, timeout, wait)
        if wait == false
            wait(response, timeout)
        else
            response
        end
    end

    # Performs an action on the container that changes the execution status.
    # Accepts optional args
    def change_state(action, options)
        options.update({ :action => action })
        timeout = options[:timeout]
        timeout ||= ''
        response = @client.put("#{CONTAINERS}/#{@name}/state", options)
        wait?(response, options[:wait], timeout)
    end

end
