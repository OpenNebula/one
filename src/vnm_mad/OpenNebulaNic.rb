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

# This class represents the NICS of a VM
class Nics < Array
    def initialize(hypervisor)
        case hypervisor
        when "kvm"
            @nicClass = NicKVM
        when "xen"
            @nicClass = NicXen
        end
    end

    def new_nic
        @nicClass.new
    end

    # finds nics that match 'args'
    # 'args' can be a Hash, or an array
    #  args example:
    #       {:mac => "02:00:C0:A8:01:01", :bridge => "br0"}
    #       :mac,  "02:00:C0:A8:01:01"
    #  key values may also be an array:
    #       {:mac => "02:00:C0:A8:01:01", :bridge => ["br0","br1"]}
    def get(*args)
        if args.length == 2
            dict = Hash.new
            dict[args[0]] = args[1]
        elsif args.length == 1
            dict = args[0]
        else
            return nil
        end

        matching = Array.new
        self.each do |e|
            e_filter = Hash.new
            dict.each_key{|k| e_filter[k] = e[k]}
            if compare(e_filter,dict)
                matching << e
            end
        end

        if matching.empty?
            nil
        else
            matching
        end
    end

    def compare(hash1, hash2)
        #hash1 has a single value per key
        #hash2 may contain an array of values
        hash1.each do |k,v|
            return false if !hash2[k]
            v2 = hash2[k]
            if hash2[k].kind_of?(Array)
                return false if !v2.include? v
            else
                return false if v != v2
            end
        end
        true
    end
end


# A NIC using KVM. This class implements functions to get the physical interface 
# that the NIC is using 
class NicKVM < Hash
    def initialize
        @vm_info = Hash.new

        super(nil)
    end

    def get_info(vm)
        deploy_id = vm['DEPLOY_ID']

        if deploy_id
            @vm_info[:dumpxml] = `#{COMMANDS[:virsh]} dumpxml #{deploy_id} 2>/dev/null`
            @vm_info.each_key{|k| @vm_info[k] = nil if @vm_info[k].to_s.strip.empty?}
        end
    end

    def get_tap
        dumpxml = @vm_info[:dumpxml]

        if dumpxml
            dumpxml_root = REXML::Document.new(dumpxml).root

            xpath = "devices/interface[@type='bridge']/"
            xpath << "mac[@address='#{self[:mac]}']/../target"
            tap = dumpxml_root.elements[xpath]

            if tap
                self[:tap] = tap.attributes['dev']
            end
        end
        self
    end
end


# A NIC using Xen. This class implements functions to get the physical interface 
# that the NIC is using 
class NicXen < Hash
    def initialize
        @vm_info = Hash.new

        super(nil)
    end

    def get_info(vm)
        deploy_id = vm['DEPLOY_ID']

        if deploy_id
            @vm_info[:domid]    =`#{COMMANDS[:xm]} domid #{deploy_id}`.strip
            @vm_info[:networks] =`#{COMMANDS[:xm]} network-list #{deploy_id}`
            @vm_info.each_key{|k| @vm_info[k] = nil if @vm_info[k].to_s.strip.empty?}
        end

        @vm_info
    end

    def get_tap
        domid = @vm_info[:domid]

        if domid
            networks = @vm_info[:networks].split("\n")[1..-1]
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
