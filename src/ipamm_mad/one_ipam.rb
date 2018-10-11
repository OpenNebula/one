#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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
require 'rexml/document'
require 'getoptlong'
require 'shellwords'

# IPAM Manager driver
class IPAMDriver < OpenNebulaDriver
    # IPAM Driver Protocol constants
    ACTION = {
        :register_address_range   => "REGISTER_ADDRESS_RANGE",
        :unregister_address_range => "UNREGISTER_ADDRESS_RANGE",
        :allocate_address         => "ALLOCATE_ADDRESS",
        :get_address              => "GET_ADDRESS",
        :free_address             => "FREE_ADDRESS"
    }

    # Init the driver
    def initialize(ipam_type, options={})
        @options={
            :concurrency   => 1,
            :threaded      => false,
            :retries       => 0,
            :local_actions => {
                ACTION[:register_address_range]   => nil,
                ACTION[:unregister_address_range] => nil,
                ACTION[:allocate_address]         => nil,
                ACTION[:get_address]              => nil,
                ACTION[:free_address]             => nil
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

        register_action(ACTION[:register_address_range].to_sym,
            method("register_address_range"))

        register_action(ACTION[:unregister_address_range].to_sym,
            method("unregister_address_range"))

        register_action(ACTION[:allocate_address].to_sym,
            method("allocate_address"))

        register_action(ACTION[:get_address].to_sym, method("get_address"))

        register_action(ACTION[:free_address].to_sym, method("free_address"))
    end

    def register_address_range(id, drv_message)
        do_ipam_action(id, :register_address_range, drv_message)
    end

    def unregister_address_range(id, drv_message)
        do_ipam_action(id, :unregister_address_range, drv_message)
    end

    def allocate_address(id, drv_message)
        do_ipam_action(id, :allocate_address, drv_message)
    end

    def get_address(id, drv_message)
        do_ipam_action(id, :get_address, drv_message)
    end

    def free_address(id, drv_message)
        do_ipam_action(id, :free_address, drv_message)
    end
    private

    def do_ipam_action(id, action, arguments)
        begin
            message = Base64.decode64(arguments)
            xml_doc = REXML::Document.new(message)

            xml_doc.root
            ipam = xml_doc.elements['IPAM_DRIVER_ACTION_DATA/AR/IPAM_MAD'].text.strip
            raise if ipam.empty?
        rescue
            send_message(ACTION[action], RESULT[:failure], id,
                "Cannot perform #{action}, cannot find ipman driver")
            return
        end

        return if not is_available?(ipam, id, action)

        path = File.join(@local_scripts_path, ipam)
        cmd  = File.join(path, ACTION[action].downcase)
        cmd << " " << arguments

        rc = LocalCommand.run(cmd, log_method(id))

        result, info = get_info_from_execution(rc)

        info = Base64::encode64(info).strip.delete("\n")

        send_message(ACTION[action], result, id, info)
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

################################################################################
# IPAM Driver Main program
################################################################################
opts = GetoptLong.new(
    [ '--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--ipam-types', '-i', GetoptLong::REQUIRED_ARGUMENT ],
    [ '--timeout',    '-w', GetoptLong::OPTIONAL_ARGUMENT ]
)

i_types = nil
threads = 1
timeout = nil

begin
    opts.each do |opt, arg|
        case opt
            when '--ipam-types'
                i_types = arg.split(',').map {|a| a.strip }
            when '--threads'
                threads = arg.to_i
            when '--timeout'
                timeout = arg.to_i
        end
    end
rescue Exception => e
    exit(-1)
end

ipam_driver = IPAMDriver.new(i_types,
                             :concurrency   => threads,
                             :timeout       => timeout)
ipam_driver.start_driver

