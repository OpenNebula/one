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

class Container

    attr_reader :name
    attr_accessor :devices, :config

    CONTAINERS = 'containers'
    OPERATIONS = 'operations'

    def initialize(info, client)
        @client = client
        @info = info
        @name = info['name']
        @config = info['config']
        @devices = info['devices']
    end

    class << self

        # Returns specific container, by its name
        # Params:
        # +name+:: container name
        def get(name, client)
            info = client.get("#{CONTAINERS}/#{name}")['metadata'] # config is stored in metadata key
            Container.new(info, client)
        end

        # Returns an array of containers objects
        def get_containers(client)
            container_names = client.get(CONTAINERS)['metadata'] # array of container names
            containers = []
            container_names.each do |name|
                name = name.split('/').last
                containers.push(get(name, client))
            end
            containers
        end

    end

    # # Returns boolean indicating if the container exists(true) or not (false)
    # def exist(container)
    #     if container.key?('error') && container['error'] == 'not found'
    #         false
    #     elsif container.key?('metadata') && container['metadata'].key?('name')
    #         true
    #     end
    # end

    # # Create a new empty container
    # def create(name)
    #     data = { 'name' => name, 'source' => { 'type' => 'none' } }
    #     @client.post(CONTAINERS, data)
    # end

    # def change_state(name, action)
    #     put(CONTAINERS + name + '/state', { :action => action })
    # end

    # def start(name)
    #     JSON
    #         .change_state(name, { :action => 'start' })
    # end

    # def stop(name)
    #     change_state(name, { :action => 'stop' })
    # end

    # def restart(name)
    #     change_state(name, { :action => 'restart' })
    # end

    # # Client.containers.get(container) or .create(container)
    # def freeze(name)
    #     change_state(name, { :action => 'freeze' })
    # end

    # def unfreeze(name)
    #     change_state(name, { :action => 'unfreeze' })
    # end

    # def delete(sock, uri)
    #     request = Net::HTTP::Delete.new("/1.0/#{uri}", initheader = { 'Host' => 'localhost' })
    #     request.exec(sock, '1.1', "/1.0/#{uri}")
    #     request
    # end

    # def update(sock, uri)
    #     request = Net::HTTP::Patch.new("/1.0/#{uri}", initheader = { 'Host' => 'localhost' })

    #     request.body = JSON.dump(
    #         { :config => {
    #             'limits.cpu' => '4'
    #         } }
    #     )

    #     request.exec(sock, '1.1', "/1.0/#{uri}")
    #     request
    # end

end
