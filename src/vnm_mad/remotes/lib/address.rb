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

module VNMMAD

# The address module provides basic functions to manage IP addresses
module Address

    # This methods translates an address range to a set of IPv4 networks
    # in CIDR notation
    #   @param ip_start [String] First IP of the range in dot notation
    #   @param size [String] The number of IPs in the range
    #
    #   @return [Array<String>] The networks in CIDR
    def self.to_nets(ip_start, size)
        nets = Array.new
        ip_i = IPv4.to_i(ip_start)

        # Find the largest address block (look for the first 1-bit)
        lblock = 0

        lblock += 1 while (ip_i[lblock] == 0 && lblock < 32 )

        # Allocate whole blocks till the size fits
        while ( size >= 2**lblock )
            nets << "#{IPv4.to_s(ip_i)}/#{32-lblock}"

            ip_i += 2**lblock
            size -= 2**lblock

            lblock += 1 while (ip_i[lblock] == 0 && lblock < 32 )
        end

        # Fit remaining address blocks
        32.downto(0) { |i|
            next if size[i] == 0

            nets << "#{IPv4.to_s(ip_i)}/#{32-i}"

            ip_i += 2**i
        }

        return nets 
    end

    # This implementation module includes IPv4 management functions
    # It MUST NOT be used in other VNMAD classes
    module IPv4
        # Returns the binary equivalent of a IP address
        #  @param ip [String] IP in dot notation
        #  @return [Fixnum] IP as an integer
        def self.to_i(ip)
            ip.split(".").inject(0) {|t,e| (t << 8) + e.to_i }
        end

        # Returns the string equivalent  of a IP address 
        #  @param ip [Fixnum] IP as an integer
        #  @return [String] IP in dot notation
        def self.to_s(ip)
            ip = 3.downto(0).collect {|s| (ip >> 8*s) & 0xff }.join('.')
        end
    end
end 

end
