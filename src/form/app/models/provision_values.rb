# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OneForm

    class Provision

        # Represents the desired state of the provision
        class Values < Hash

            class << self

                # Builds provision values from their serialized representation
                # @param body [Hash] Serialized provision user input values
                def json_create(body)
                    return body if body.is_a?(self)

                    new(body)
                end

            end

            # Builds the values hash from the persisted user input values
            # @param body [Hash] Provision user input values
            def initialize(body)
                raise ArgumentError, 'Provision values must be a hash' unless body.is_a?(Hash)

                super()
                update(body)
            end

            # Returns the requested number of cloud hosts
            def hosts
                self[:oneform_hosts].to_i
            end

            # Updates the requested number of cloud hosts
            # @param count [Integer, String] Requested cloud host count
            def hosts=(count)
                self[:oneform_hosts] = count.to_i
            end

            # Checks whether the provision uses manually managed on-premises hosts
            def onprem?
                key?(:oneform_onprem_hosts)
            end

            # Returns the manually managed on-premises host addresses
            def onprem_hosts
                return [] unless onprem?

                self[:oneform_onprem_hosts] ||= []
            end

            # Adds a manually managed on-premises host address
            # @param host [String] Host address
            def add_onprem_host(host)
                return unless onprem?
                return if onprem_hosts.include?(host)

                onprem_hosts << host
            end

            # Removes a manually managed on-premises host address
            # @param host [String] Host address
            def remove_onprem_host(host)
                return unless onprem?

                onprem_hosts.reject! {|address| address == host }
            end

            # Returns the requested number of public IP addresses
            def public_ips
                self[:oneform_public_ips].to_i
            end

            # Updates the requested number of public IP addresses
            # @param count [Integer, String] Requested public IP count
            def public_ips=(count)
                self[:oneform_public_ips] = count.to_i
            end

            # Returns the custom provision tags
            def tags
                self[:oneform_tags] || {}
            end

        end

    end

end
