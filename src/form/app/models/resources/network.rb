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

        # OpenNebula virtual network embedded in a provision
        class Network < Resource

            TYPE                = 'network'
            SUFFIX              = true
            ASSOCIATED_TYPES    = [:vm]

            def pre_create!
                address_ranges = template[:ar]
                return unless address_ranges.is_a?(Array)

                address_ranges.reject! do |address_range|
                    address_range[:size].to_i.zero?
                end
            end

            def elastic?
                template[:vn_mad] == 'elastic'
            end

            # Returns the current address ranges from OpenNebula
            # @param client [OpenNebula::Client] OpenNebula client
            def address_ranges(client)
                vn_id = id
                raise 'Virtual network ID is missing' unless vn_id

                vn = ODS::OneHelper::VirtualNetwork.body(client, vn_id)
                raise vn.message if OpenNebula.is_error?(vn)

                ranges = vn&.dig(:ar_pool, :ar)
                ranges.is_a?(Array) ? ranges.compact : [ranges].compact
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error getting ARs from vnet #{vn_id}: #{e.message}"
                )
            end

            # Adds an address range in OpenNebula
            # @param client [OpenNebula::Client] OpenNebula client
            # @param address_range [Hash] Address range definition
            def add_ar(client, address_range)
                vn_id = id
                raise 'Virtual network ID is missing' unless vn_id

                rc = ODS::OneHelper::VirtualNetwork.add_ar(
                    client,
                    vn_id,
                    { :AR => address_range }
                )
                raise rc.message if OpenNebula.is_error?(rc)

                rc
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error adding AR to vnet #{vn_id}: #{e.message}"
                )
            end

            # Removes an address range from OpenNebula
            # @param client [OpenNebula::Client] OpenNebula client
            # @param ar_id [Integer, String] OpenNebula address range ID
            def remove_ar(client, ar_id)
                vn_id = id
                raise 'Virtual network ID is missing' unless vn_id

                ranges = address_ranges(client)
                return ranges if OpenNebula.is_error?(ranges)

                return true unless ranges.any? {|ar| ar[:ar_id].to_i == ar_id.to_i }

                rc = ODS::OneHelper::VirtualNetwork.remove_ar(client, vn_id, ar_id)
                raise rc.message if OpenNebula.is_error?(rc)

                rc
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Error removing AR #{ar_id} from vnet #{vn_id}: #{e.message}"
                )
            end

        end

    end

end
