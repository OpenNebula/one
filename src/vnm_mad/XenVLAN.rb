# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

module OpenNebulaVLANXen
    def new_nic(hypervisor)
        NicXen.new(hypervisor)
    end

    def get_info
        vminfo = Hash.new
        deploy_id = @vm['DEPLOY_ID']
        if deploy_id
            vminfo[:domid]    =`#{COMMANDS[:xm]} domid #{deploy_id}`.strip
            vminfo[:networks] =`#{COMMANDS[:xm]} network-list #{deploy_id}`
            vminfo.each_key{|k| vminfo[k] = nil if vminfo[k].to_s.strip.empty?}
        end
        vminfo
    end
end

class NicXen < Hash
    def initialize(hash=nil)
        super(nil)
    end

    def get_tap(vm)
        domid = vm.vm_info[:domid]
        if domid
            networks = vm.vm_info[:networks].split("\n")[1..-1]
            networks.each do |net|
                n = net.split

                iface_id  = n[0]
                iface_mac = n[2]

                if iface_mac == self[:mac]
                    self[:tap] = "vif#{domid}.#{iface_id}"
                    break
                end
            end
        end
        self
    end
end
