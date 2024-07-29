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

require 'provision_element'
require 'provision/oneprovision'

require 'provider/provider'
require 'provider/provider_pool'

require 'terraform/terraform'

# OneProvision module
module OneProvision

    PING_TIMEOUT_DEFAULT  = 20
    PING_RETRIES_DEFAULT  = 30
    MAX_RETRIES_DEFAULT   = 3
    RUN_MODE_DEFAULT      = :interactive
    FAIL_CHOICE_DEFAULT   = :quit
    DEFAULT_FAIL_MODES    = [:cleanup, :retry, :skip, :quit]
    CLEANUP_DEFAULT       = false
    THREADS_DEFAULT       = 3
    WAIT_TIMEOUT_DEFAULT  = 60

end
