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
    # TODO: could do better
    ABSENT = { 'error' => 'not found', 'error_code' => 404, 'type' => 'error' }

    # Creates the container object in memory.
    # Can be later created in LXD using create method
    def initialize(info, client)
        @client = client
        @info = info
        @name = info['name']
        set_attr
    end

    class << self

        # Returns specific container, by its name
        # Params:
        # +name+:: container name
        def get(name, client)
            if exist(name, client)
                # config is stored in metadata key
                info = client.get("#{CONTAINERS}/#{name}")['metadata']
                Container.new(info, client)
            else
                err = "ERROR: getting container \"#{name}\" \n#{ABSENT}"
                raise Exception, err
                # raise err
            end
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
            # TODO: output could be another error in case of unexpected behaviour
            client.get("#{CONTAINERS}/#{name}") != ABSENT
        end

    end

    # Create a container without a base image
    def create
        @info['source'] = { 'type' => 'none' }
        @client.post(CONTAINERS, @info)
        sleep 2 # TODO: implement dealing with async operations
        update_local
        set_attr
    end

    # Delete container
    def delete
        @client.delete("#{CONTAINERS}/#{@name}")
    end

    # Updates the container in LXD server with the new configuration
    def update
        @client.put("#{CONTAINERS}/#{@name}", @info)
        update_local
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

    # Syncs the container in LXD with the container object in memory
    def update_local
        @info = @client.get("#{CONTAINERS}/#{@name}")['metadata']
        set_attr
    end

    # Updates container attr from @info
    def set_attr
        @status = @info['status']
        @status_code = @info['status_code']
        @config = info['config']
        @config_expanded = info['expanded_config']
        @devices = info['devices']
        @devices_expanded = info['expanded_devices']
    end

    # Performs an action on the container that changes the execution status.
    # Accepts optional args
    def change_state(action, options)
        options.update({ :action => action })
        @client.put("#{CONTAINERS}/#{@name}/state", options)
        sleep 2 # TODO: implement dealing with async operations
        update_local
    end

end
