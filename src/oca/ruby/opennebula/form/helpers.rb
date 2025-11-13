# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

    # OneForm Helpers Module
    module Helpers

        RESOURCE_PATHS = {
            'PROVIDER TEMPLATE'  => '/provider-templates',
            'PROVISION TEMPLATE' => '/provision-templates',
            'PROVIDER'           => '/providers',
            'PROVISION'          => '/provisions'
        }

        # Convert a name to an ID based on the provided pool
        def self.rname_to_id(name, poolname)
            return 0, name.to_i if name.match(/^[0123456789]+$/)

            client        = OneForm::Client.new
            resource_path = RESOURCE_PATHS[poolname.upcase]

            raise ArgumentError, "Unknown pool name: #{poolname}" unless resource_path

            response = client.get(resource_path)

            if CloudClient.is_error?(response)
                return -1, "OpenNebula #{poolname} name not found," <<
                            ' use the ID instead'
            end

            pool = JSON.parse(response.body)
            name_to_id(name, pool, poolname)
        end

        # Description of the rname to ID method
        def self.rname_to_id_desc(poolname)
            "OpenNebula #{poolname} name or id"
        end

        def self.list_to_id(names, poolname)
            client        = OneForm::Client.new
            resource_path = RESOURCE_PATHS[poolname.upcase]

            raise ArgumentError, "Unknown pool name: #{poolname}" unless resource_path

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

        # Convert a name to an ID based on the provided pool
        def name_to_id(name, pool, ename)
            if pool['DOCUMENT_POOL']['DOCUMENT'].nil?
                return -1, "#{ename} named #{name} not found."
            end

            objects = pool['DOCUMENT_POOL']['DOCUMENT'].select {|object| object['NAME'] == name }

            return -1, "#{ename} named #{name} not found." unless objects.empty?
            return -1, "There are multiple #{ename}s with name #{name}." if objects.length>1

            result = objects.first['ID']

            [0, result]
        end

    end

end
