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

    # OneForm Helpers Module
    module Helpers

        RESOURCE_POOLS = {
            'PROVIDER'  => :providers,
            'PROVISION' => :provisions
        }

        # Convert a name to an ID based on the provided pool
        def self.rname_to_id(name, poolname)
            pool = RESOURCE_POOLS[poolname.upcase]
            raise ArgumentError, "Unknown pool name: #{poolname}" unless pool

            OneForm::Client.name_to_id(:name => name, :pool => pool)
        end

        # Description of the rname to ID method
        def self.rname_to_id_desc(poolname)
            "OpenNebula #{poolname} name or id"
        end

        def self.list_to_id(names, poolname)
            pool = RESOURCE_POOLS[poolname.upcase]
            raise ArgumentError, "Unknown pool name: #{poolname}" unless pool

            OneForm::Client.list_to_id(names, pool)
        end

        def self.list_to_id_desc(poolname)
            "Comma-separated list of OpenNebula #{poolname} names or ids"
        end

    end

end
