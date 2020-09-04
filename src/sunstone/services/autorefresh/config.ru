# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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

$: << '.'

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    ETC_LOCATION      = '/etc/one'
    SUNSTONE_LOCATION = '/usr/lib/one/sunstone'
else
    ETC_LOCATION      = ONE_LOCATION + '/etc'
    SUNSTONE_LOCATION = ONE_LOCATION + '/lib/sunstone'
end

SUNSTONE_SERVICES = SUNSTONE_LOCATION + '/services'

require SUNSTONE_SERVICES + '/autorefresh/autorefresh-server'

Faye::WebSocket.load_adapter('thin')

run Autorefresh