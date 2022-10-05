# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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

    # ServicePool class
    class OpenNebulaServicePool < DocumentPoolJSON

        DOCUMENT_TYPE = 100

        def initialize(client, user_id = -2)
            super(client, user_id)
        end

        def factory(element_xml)
            service = OpenNebula::Service.new(element_xml, @client)
            service.load_body
            service
        end

    end

    # ServicePool class
    class ServicePool < Pool

        # rubocop:disable Style/ClassVars
        @@mutex      = Mutex.new
        @@mutex_hash = {}
        # rubocop:enable Style/ClassVars

        # Class constructor
        #
        # @param [OpenNebula::Client] client the xml-rpc client
        # @param [Integer] user_id the filter flag, see
        #   http://docs.opennebula.io/stable/integration/system_interfaces/api.html
        #
        # @return [DocumentPool] the new object
        def initialize(cloud_auth, client)
            # TODO, what if cloud_auth is nil?
            @cloud_auth = cloud_auth
            @client     = client
            @one_pool   = nil

            if @client
                rc = @client.call('user.info', -1)

                unless OpenNebula.is_error?(rc)
                    info     = Nokogiri::XML(rc)
                    @user_id = Integer(info.xpath('/USER/ID').text)
                end
            end

            super('DOCUMENT_POOL', 'DOCUMENT', @client)
        end

        def client(user_name = nil)
            # If there's a client defined use it
            return @client unless @client.nil?

            # If not, get one via cloud_auth
            if user_name.nil?
                @cloud_auth.client
            else
                @cloud_auth.client(user_name)
            end
        end

        def info
            osp = OpenNebulaServicePool.new(client)
            rc  = osp.info

            @one_pool = osp

            rc
        end

        def info_all
            osp = OpenNebulaServicePool.new(client)
            rc  = osp.info_all

            @one_pool = osp

            rc
        end

        # rubocop:disable Lint/ToJSON
        def to_json
            # rubocop:enable Lint/ToJSON
            @one_pool.to_json
        end

        def each(&block)
            return if @one_pool.nil?

            @one_pool.each(&block)
        end

        # Iterates over pool pages
        # size:: nil => default page size
        #        > 0 => page size
        # state state of objects
        def each_page(size)
            loop_page(size, Service::DOCUMENT_TYPE, false) do |element, page|
                page.each("//#{element}") do |obj|
                    service = Service.new_with_id(obj['ID'], @client)
                    service.info

                    yield(service)
                end

                size
            end
        end

        # Retrieves a Service element from OpenNebula. The Service::info()
        # method is called
        #
        # @param [Integer] service_id Numerical Id of the service to retrieve
        # @yieldparam [Service] this block will have the service's mutex locked.
        #   The mutex will be unlocked after the block execution.
        #
        # @return [Service, OpenNebula::Error] The Service in case of success
        def get(service_id, external_user = nil, &block)
            service_id = service_id.to_i if service_id
            aux_client = nil

            # WARNING!!!
            # No validation will be performed for external_user, the credentials
            # for this user must be validated previously.
            if external_user.nil?
                aux_client = client
            else
                aux_client = client(external_user)
            end

            service = Service.new_with_id(service_id, aux_client)

            if block_given?
                obj_mutex = nil
                entry     = nil

                @@mutex.synchronize do
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
                        @@mutex_hash.delete_if do |_s_id, entry_loop|
                            entry_loop[1] == 0
                        end
                    end
                end

                rc = obj_mutex.synchronize do
                    rc = service.info

                    if OpenNebula.is_error?(rc)
                        return rc
                    end

                    block.call(service, client)
                end

                @@mutex.synchronize do
                    entry[1] = entry[1] - 1
                end

                if OpenNebula.is_error?(rc)
                    return rc
                end
            else
                service.info
            end

            service
        end

    end

end
