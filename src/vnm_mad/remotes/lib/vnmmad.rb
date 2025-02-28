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

$LOAD_PATH << File.dirname(__FILE__)
$LOAD_PATH << File.join(File.dirname(__FILE__), '..')

require 'rexml/document'
require 'base64'
require 'yaml'

require 'command'
require 'vm'
require 'nic'
require 'vf'
require 'address'
require 'security_groups'
require 'security_groups_iptables'
require 'vnm_driver'
require 'sg_driver'
require 'vlan'
require 'no_vlan'
require 'tproxy'

require 'CommandManager'
require 'DriverLogger'

Dir[File.expand_path('vnmmad-load.d', File.dirname(__FILE__)) + '/*.rb'].sort.each {|f| require f }

include OpenNebula

begin
    NAME = File.join(File.dirname(__FILE__), '../etc/vnm/OpenNebulaNetwork.conf')
    CONF = YAML.load_file(NAME)
rescue StandardError
    # Default configuration values
    CONF = {
        :arp_cache_poisoning  => true,
        :vxlan_mc             => '239.0.0.0',
        :vxlan_ttl            => '16',
        :vxlan_mtu            => '1500',
        :validate_vlan_id     => false,
        :vlan_mtu             => '1500',
        :ipset_maxelem        => '65536',
        :keep_empty_bridge    => false,
        :datastore_location   => '/var/lib/one/datastores',
        :tproxy_debug_level   => 2, # 0 = ERROR, 1 = WARNING, 2 = INFO, 3 = DEBUG
        :tproxy_process_owner => 'oneadmin',
        :tproxy               => []
    }
end

# Set PATH
ENV['PATH'] = "#{ENV['PATH']}:/bin:/sbin:/usr/bin"
