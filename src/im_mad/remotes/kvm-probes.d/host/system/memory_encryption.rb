#!/usr/bin/env ruby

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

require 'open3'
require 'rexml/document'

cmd = 'virsh -c qemu:///system domcapabilities'
domcapabilities, _e, s = Open3.capture3(cmd)

exit 0 unless s.success?

begin

    domcap_xml = REXML::Document.new(domcapabilities)
    domcap_xml = domcap_xml.root

    features = REXML::XPath.first(domcap_xml, '/domainCapabilities/features')

    memory_encryption = 'NONE'

    if (sev = features.elements['sev'])
        if sev['supported'] == 'yes'
            if (snp = sev.elements['sevsnp']) && snp['supported'] == 'yes'
                memory_encryption = 'SEV-SNP'
            else
                es_guests = sev.elements['maxESGuests'].text
                memory_encryption = es_guests == '0' ? 'SEV' : 'SEV-ES'
            end
        end
    elsif (tdx = features.elements['tdx'])
        memory_encryption = 'TDX' if tdx['supported'] == 'yes'
    end
rescue StandardError
    puts "MEMORY_ENCRYPTION=NONE"
    exit 0
end

puts "MEMORY_ENCRYPTION=#{memory_encryption}"
