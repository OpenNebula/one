#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    ETC_LOCATION="/etc/one/"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
end

$: << RUBY_LIB_LOCATION


require 'scripts_common'
require 'OpenNebulaDriver'
require 'getoptlong'
require 'shellwords'

# IPAM Manager driver 
class IPAMDriver < OpenNebulaDriver

    # IPAM Driver Protocol constants
    ACTION = {
        :get_used_addr => "GET_USED_ADDR",
        :get_free_addr_range => "GET_FREE_ADDR_RANGE",
        :register_addr_range => "REGISTER_ADDR_RANGE",
        :free_addr => "FREE_ADDR"
    }

    # Init the driver
    def initialize(ipam_type, options={})
        @options={
            :concurrency   => 1,
            :threaded      => false,
            :retries       => 0,
            :local_actions => {
                ACTION[:get_used_addr]       => nil,
                ACTION[:get_free_addr_range] => nil,
                ACTION[:register_addr_range] => nil,
                ACTION[:free_addr]           => nil
            }
        }.merge!(options)
        
        super("ipam/", @options)

        if ipam_type == nil
            @types = Dir["#{@local_scripts_path}/*/"].map do |d|
                d.split('/')[-1]
            end
        elsif ipam_type.class == String
            @types = [ipam_type]
        else
            @types = ipam_type
        end

        register_action(ACTION[:get_used_addr].to_sym, method("get_used_addr"))
        register_action(ACTION[:get_free_addr_range].to_sym, method("get_free_addr_range"))
        register_action(ACTION[:register_addr_range].to_sym, method("register_addr_range"))
        register_action(ACTION[:free_addr].to_sym, method("free_addr"))
    end
  
    def get_used_addr(id, ipam, type, subnet, addr_start, size)
        return if not is_available?(ipam, id, :get_used_addr)

        path = File.join(@local_scripts_path, ipam)

        cmd  = File.join(path, ACTION[:get_used_addr].downcase)
        cmd << " " \
            << type << " " \
            << subnet << " " \
            << addr_start << " " \
            << size << " "

        rc = LocalCommand.run(cmd, log_method(id))

        result, info = get_info_from_execution(rc)

        send_message(ACTION[:get_used_addr], result, id, info)
    end

    def get_free_addr_range(id, ipam, type, subnet, addr_start, size, rsize) 
        return if not is_available?(ipam, id, :get_free_addr_range) 

        path = File.join(@local_scripts_path, ipam)

        cmd  = File.join(path, ACTION[:get_free_addr_range].downcase)
        cmd << " " \
            << type << " " \
            << subnet << " " \
            << addr_start << " " \
            << size << " " \
            << rsize << " "

        rc = LocalCommand.run(cmd, log_method(id))

        result, info = get_info_from_execution(rc)

        send_message(ACTION[:get_free_addr_range], result, id, info)
    end

    def register_addr_range(id, ipam, type, subnet, addr_start, size)
        return if not is_available?(ipam, id, :register_addr_range) 

        path = File.join(@local_scripts_path, ipam)

        cmd  = File.join(path, ACTION[:register_addr_range].downcase)
        cmd << " " \
            << type << " " \
            << subnet << " " \
            << addr_start << " " \
            << size << " "

        rc = LocalCommand.run(cmd, log_method(id))

        result, info = get_info_from_execution(rc)

        send_message(ACTION[:register_addr_range], result, id, info)
    end
    
    def free_addr(id, ipam, type, subnet, addr)
        return if not is_available?(ipam, id, :free_addr) 

        path = File.join(@local_scripts_path, ipam)

        cmd  = File.join(path, ACTION[:free_addr].downcase)
        cmd << " " \
            << type << " " \
            << subnet << " " \
            << addr << " "

        rc = LocalCommand.run(cmd, log_method(id))

        result, info = get_info_from_execution(rc)

        send_message(ACTION[:free_addr], result, id, info)
    end

    def is_available?(ipam, id, action)
        if @types.include?(ipam)
            return true
        else
            send_message(ACTION[action], RESULT[:failure], id,
                "IPAM driver '#{ipam}' not available")
            return false
        end
    end

end

# IPAM Driver Main program
opts = GetoptLong.new(
    [ '--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--ipam-types', '-i', GetoptLong::REQUIRED_ARGUMENT ],
)

i_types = nil
threads = 1

begin
    opts.each do |opt, arg|
        case opt
            when '--ipam-types'
                i_types = arg.split(',').map {|a| a.strip }
            when '--threads'
                threads = arg.to_i
        end
    end
rescue Exception => e
    exit(-1)
end

ipam_driver = IPAMDriver.new(i_types, :concurrency => threads)
ipam_driver.start_driver

