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

require 'ipaddr'

module VNMMAD

module VNMNetwork

    # This methods translates an address range to a set of IPv4 networks
    # in CIDR notation
    #   @param ip_start [String] First IP of the range in dot notation
    #   @param size [Fixnum] The number of IPs in the range
    #
    #   @return [Array<String>] The networks in CIDR
    def self.to_nets(ip_start, size)
        nets = Array.new

        begin
            ipaddr = IPAddr.new ip_start
        rescue
            return
        end

        ip_i = ipaddr.to_i

        if ipaddr.ipv4?
            ip_length = 32
        elsif ipaddr.ipv6?
            ip_length = 128
        else
            return
        end

        # Find the largest address block (look for the first 1-bit)
        lblock = 0

        lblock += 1 while (ip_i[lblock] == 0 && lblock < ip_length )

        # Allocate whole blocks till the size fits
        while ( size >= 2**lblock )
            nets << "#{IPAddr.new(ip_i, ipaddr.family).to_s}/#{ip_length-lblock}"

            ip_i += 2**lblock
            size -= 2**lblock

            lblock += 1 while (ip_i[lblock] == 0 && lblock < ip_length )
        end

        # Fit remaining address blocks
        ip_length.downto(0) { |i|
            next if size[i] == 0

            nets << "#{IPAddr.new(ip_i, ipaddr.family).to_s}/#{ip_length-i}"

            ip_i += 2**i
        }

        return nets
    end

end

end
