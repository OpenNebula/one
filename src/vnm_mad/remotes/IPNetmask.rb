# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

################################################################################
# IP and NETMASK Library
################################################################################

class IP
    include Comparable
    attr_accessor :ip

    def initialize(ip)
        @ip = ip
    end

    def to_s
        @ip
    end

    def to_i
        @ip.split(".").inject(0) {|t,e| (t << 8) + e.to_i }
    end

    def to_hex
        "0x" + to_i.to_s(16).rjust(8, '0')
    end

    def to_bin
        "0b" + to_i.to_s(2).rjust(16, '0')
    end

    def to_hex_groups(p="")
        to_i.to_s(16).rjust(8, '0').scan(/.{2}/).collect{|e| p+e}.join('.')
    end

    def to_bin_groups(p="")
        to_i.to_s(2).rjust(16, '0').scan(/.{8}/).collect{|e| p+e}.join('.')
    end

    def self.from_i(i)
        ip = 3.downto(0).collect {|s| (i >> 8*s) & 0xff }.join('.')
        self.new(ip)
    end

    def &(another_ip)
        IP.from_i(self.to_i & another_ip.to_i)
    end

    def +(size)
        IP.from_i(self.to_i + size)
    end

    def -(e)
        if e.instance_of? Fixnum
            IP.from_i(self.to_i - e)
        else
            e.to_i - self.to_i
        end
    end

    def <=>(another_ip)
        self.to_i <=> another_ip.to_i
    end
end

class Netmask < IP
    def self.from_cidr(cidr)
        self.from_i(0xffffffff ^ 2**(32-cidr)-1)
    end

    def to_cidr
        32 - Math.log((to_i ^ 0xffffffff) + 1, 2).to_i
    end
end

class Net
    attr_accessor :ip, :netmask

    def initialize(ip, netmask = nil)
        if netmask
            @ip, @netmask = ip, netmask
        else
            ip, netmask = ip.split('/')
            @ip         = IP.new(ip)
            @netmask    = Netmask.from_cidr(netmask.to_i) if netmask
        end

        @network_address = network_address
        @last_address    = last_address
    end

    def network_address
        IP.from_i(@ip.to_i & @netmask.to_i)
    end

    def last_address
        IP.from_i(@ip.to_i | (@netmask.to_i ^ 0xffffffff))
    end

    def info
        s = ""
        s << @network_address.to_s.ljust(15)
        s << " /"
        s << @netmask.to_cidr.to_s.rjust(2)
        s << " "
        s << @network_address.to_s.ljust(15)
        s << " "
        s << last_address.to_s.ljust(15)

        s
    end

    def to_s
        "#{@network_address}/#{@netmask.to_cidr}"
    end

    def next_net
        next_ip = IP.from_i(last_address.to_i + 1)
        Net.new(next_ip, @netmask)
    end

    def between?(ip_start, ip_end)
        network_address >= ip_start && last_address <= ip_end
    end
end

class Range
    def initialize(ip_start, size)
        @ip_start = IP.new(ip_start)
        @ip_end   = @ip_start + size
    end

    def get_nets
        self.class.get_nets(@ip_start, @ip_end)
    end

    def largest_subnet
        self.class.largest_subnet(@ip_start, @ip_end)
    end

    def self.get_nets(ip_start, ip_end)
        nets = []

        net_m = largest_subnet(ip_start, ip_end)

        # left scraps
        if ip_start < net_m.network_address
            nets.concat get_nets(ip_start, net_m.network_address - 1)
        end

        nets << net_m

        # right scraps
        if net_m.last_address < ip_end
            nets.concat get_nets(net_m.last_address + 1, ip_end)
        end

        nets
    end

    def self.largest_subnet(ip_start, ip_end)
        size = ip_start - ip_end

        # start with the largest subnet
        if size > 0
            cidr = 32 - Math.log(size, 2).floor
        else
            cidr = 32
        end

        fits = false

        while !fits
            net = Net.new(ip_start, Netmask.from_cidr(cidr))
            net = net.next_net if ip_start > net.network_address

            cidr += 1
            break if cidr > 32

            fits = net.between?(ip_start, ip_end)
        end

        net
    end
end
