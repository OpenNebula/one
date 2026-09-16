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

        # OpenNebula host embedded in a provision
        class Host < Resource

            TYPE                = 'host'
            SUFFIX              = false
            ASSOCIATED_TYPES    = [:vm]

            def pre_delete!(client)
                rc = ODS::OneHelper::Host.disable(client, id)
                raise rc.message if OpenNebula.is_error?(rc)
            end

            # Activates host monitoring in OpenNebula
            # @param client [OpenNebula::Client] OpenNebula client
            def activate!(client)
                return unless id

                rc = ODS::OneHelper::Host.force_update(client, id)
                raise rc.message if OpenNebula.is_error?(rc)
            end

        end

    end

end
