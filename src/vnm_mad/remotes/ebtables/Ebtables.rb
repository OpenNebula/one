# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'vnmmad'

# Class to implement VLANs using ebtables
class EbtablesVLAN < VNMMAD::NoVLANDriver

    DRIVER = 'ebtables'
    XPATH_FILTER = "TEMPLATE/NIC[VN_MAD='ebtables']"

    def initialize(vm, xpath_filter = nil, deploy_id = nil)
        @locking = true

        xpath_filter ||= XPATH_FILTER
        super(vm, xpath_filter, deploy_id)
    end

    def ebtables(rule)
        OpenNebula.exec_and_log("#{command(:ebtables)} -A #{rule}")
    end

    # Activates ebtables rules
    #
    def activate
        if VNMMAD.pre_action?
            super()
            return 0
        end

        lock

        process do |nic|
            tap = nic[:tap]
            if tap
                iface_mac = nic[:mac]

                mac     = iface_mac.split(':')
                mac[-1] = '00'

                net_mac = mac.join(':')

                in_rule="FORWARD -s ! #{net_mac}/ff:ff:ff:ff:ff:00 " <<
                        "-o #{tap} -j DROP"
                out_rule="FORWARD -s ! #{iface_mac} -i #{tap} -j DROP"

                ebtables(in_rule) if nic[:filter_mac_spoofing] =~ /yes/i
                ebtables(out_rule)
            end
        end

        unlock

        0
    end

    def deactivate
        # NIC_ALIAS are  not processed, skip
        return 0 if @vm['TEMPLATE/NIC_ALIAS[ATTACH="YES"]/NIC_ID']

        lock

        attach_nic_id = @vm['TEMPLATE/NIC[ATTACH="YES"]/NIC_ID']

        process do |nic|
            if attach_nic_id && attach_nic_id != nic[:nic_id]
                next
            end

            mac = nic[:mac]

            # remove 0-padding
            mac = mac.split(':').collect {|e| e.hex.to_s(16) }.join(':')

            tap = ''
            rules.each do |rule|
                if (m = rule.match(/#{mac} -i (\w+)/))
                    tap = m[1]
                    break
                end
            end
            remove_rules(tap)
        end

        unlock

        super

        0
    end

    def rules
        `#{command(:ebtables)} -L FORWARD`.split("\n")[3..-1]
    end

    def remove_rules(tap)
        rules.each do |rule|
            if rule.match(tap)
                remove_rule(rule)
            end
        end
    end

    def remove_rule(rule)
        OpenNebula.exec_and_log("#{command(:ebtables)} -D FORWARD #{rule}")
    end

end
