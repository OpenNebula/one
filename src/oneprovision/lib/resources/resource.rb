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
#--------------------------------------------------------------------------- #

module OneProvision

    # Represents the ONE object and pool
    class Resource

        # Default timeout to wait until object is ready in sync mode
        DEFAULT_TIMEOUT = 60

        # @one  ONE object
        # @pool ONE pool
        attr_reader :one, :pool

        # Creates ONE and Pool objects
        def initialize
            @client = OpenNebula::Client.new
        end

        # Create operation is implemented in childs
        def create
            raise 'Operation not implemented'
        end

        # Gets all resources or just provision resources
        #
        # @param id [Integer]  ID of the provision
        #
        # @return [Array] with provision resource if id!=nil
        #                 with all resources if if==nil
        def get(id = nil)
            Utils.exception(@pool.info_all)

            if id
                @pool.select do |resource|
                    resource['TEMPLATE/PROVISION/PROVISION_ID'] == id
                end
            else
                @pool.reject do |resource|
                    resource['TEMPLATE/PROVISION/PROVISION_ID'].nil?
                end
            end
        end

        # Change owner and group
        #
        # @param user  [Integer] UID
        # @param group [Integer] GID
        def chown(user, group)
            user  ||= 0
            group ||= 0

            @one.chown(user, group)
        end

        # Change object permissions
        #
        # @param octet [String] Permissions in octet format
        def chmod(octet)
            @one.chmod_octet(octet.to_s)
        end

        # Deletes the ONE object
        def delete
            @one.info
            @one.delete
        end

        # Factory to return new object
        #
        # @param type [String] Object type
        def self.object(type)
            type = type.downcase.delete_suffix('s').to_sym

            case type
            when :cluster
                Cluster.new
            when :datastore
                Datastore.new
            when :host
                Host.new
            when :image
                Image.new
            when :vnet || :network
                Vnet.new
            else
                nil
            end
        end

        protected

        # Add provision information to object
        #
        # @param template [Hash] Current object template
        # @param info     [Hash] Information to add in provision section
        def add_provision_info(template, info)
            template['provision'] = {} unless template['provision']

            info.each do |key, value|
                template['provision'][key] = value
            end
        end

        # Add just provision ID
        #
        # @param template     [Hash]   Current object template
        # @param provision_id [String] Provision ID
        def add_provision_id(template, provision_id)
            template['provision'] = {} unless template['provision']

            template['provision']['provision_id'] = provision_id
        end

        # Wait until object reaches state
        #
        # @param state   [String]  State to wait
        # @param timeout [Integer] Timeout to wait
        def wait_state(state, timeout)
            t_start   = Time.now
            timeout ||= DEFAULT_TIMEOUT

            while Time.now - t_start < timeout
                @one.info

                break if @one.state_str == state

                sleep 1
            end
        end

    end

end
