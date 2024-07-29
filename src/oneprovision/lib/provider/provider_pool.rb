# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula/document_pool_json'

module OneProvision

    # ProviderPool class
    class ProviderPool < OpenNebula::DocumentPoolJSON

        DOCUMENT_TYPE = 102

        def initialize(client, user_id = -2)
            super(client, user_id)
        end

        def factory(element_xml)
            provider = OneProvision::Provider.new(element_xml, @client)
            provider.info(true)
            provider.load_body
            provider
        end

    end

end
