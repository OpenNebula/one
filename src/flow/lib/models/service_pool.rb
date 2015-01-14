# -------------------------------------------------------------------------- #
# Copyright 2010-2015, C12G Labs S.L.                                        #
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

module OpenNebula
    class ServicePool < DocumentPoolJSON

        DOCUMENT_TYPE = 100

        @@mutex      = Mutex.new
        @@mutex_hash = Hash.new

        # Class constructor
        #
        # @param [OpenNebula::Client] client the xml-rpc client
        # @param [Integer] user_id the filter flag, see
        #   http://opennebula.org/documentation:rel3.6:api
        #
        # @return [DocumentPool] the new object
        def initialize(client, user_id=-1)
            super(client, user_id)
        end

        def factory(element_xml)
            service = OpenNebula::Service.new(element_xml, @client)
            service.load_body
            service
        end

        # Retrieves a Service element from OpenNebula. The Service::info()
        # method is called
        #
        # @param [Integer] service_id Numerical Id of the service to retrieve
        # @yieldparam [Service] this block will have the service's mutex locked.
        #   The mutex will be unlocked after the block execution.
        #
        # @return [Service, OpenNebula::Error] The Service in case of success
        def get(service_id, &block)
            service_id = service_id.to_i if service_id
            service = Service.new_with_id(service_id, @client)

            rc = service.info

            if OpenNebula.is_error?(rc)
                return rc
            else
                if block_given?
                    obj_mutex = nil
                    entry     = nil

                    @@mutex.synchronize {
                        # entry is an array of [Mutex, waiting]
                        # waiting is the number of threads waiting on this mutex
                        entry = @@mutex_hash[service_id]

                        if entry.nil?
                            entry = [Mutex.new, 0]
                            @@mutex_hash[service_id] = entry
                        end

                        obj_mutex = entry[0]
                        entry[1]  = entry[1] + 1

                        if @@mutex_hash.size > 10000
                            @@mutex_hash.delete_if { |s_id, entry|
                                entry[1] == 0
                            }
                        end
                    }

                    obj_mutex.synchronize {
                        block.call(service)
                    }

                    @@mutex.synchronize {
                        entry[1] = entry[1] - 1
                    }
                end

                return service
            end
        end

    end
end
