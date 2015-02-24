#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
    REMOTES_LOCATION="/var/lib/one/remotes"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
    REMOTES_LOCATION=ONE_LOCATION+"/var/remotes/"
end

$: << RUBY_LIB_LOCATION

require 'OpenNebulaDriver'
require 'getoptlong'


# The SSH Information Manager Driver
class InformationManagerDriver < OpenNebulaDriver

    # Init the driver
    def initialize(hypervisor, options)
        @options={
            :threaded => true
        }.merge!(options)

        super('im', @options)

        @hypervisor = hypervisor

        # register actions
        register_action(:MONITOR, method("action_monitor"))
        register_action(:STOPMONITOR, method("stop_monitor"))

        # collectd port
        @collectd_port = 4124
        begin
            im_collectd = @config["IM_MAD"].select{|e| e.match(/collectd/)}[0]
            @collectd_port = im_collectd.match(/-p (\d+)/)[1]
        rescue
        end

        # monitor_push_interval
        @monitor_push_interval = 20
        begin
            im_collectd = @config["IM_MAD"].select{|e| e.match(/collectd/)}[0]
            @monitor_push_interval = im_collectd.match(/-i (\d+)/)[1].to_i
        rescue
        end
    end

    # Execute the run_probes in the remote host
    def action_monitor(number, host, ds_location, do_update)

        if !action_is_local?(:MONITOR)
            if do_update == "1" || @options[:force_copy]
                # Use SCP to sync:
                sync_cmd = "scp -r #{@local_scripts_base_path}/. " \
                    "#{host}:#{@remote_scripts_base_path}"

                # Use rsync to sync:
                # sync_cmd = "rsync -Laz #{REMOTES_LOCATION}
                #   #{host}:#{@remote_dir}"
                cmd=LocalCommand.run(sync_cmd, log_method(number))

                if cmd.code!=0
                    send_message('MONITOR', RESULT[:failure], number,
                        'Could not update remotes')
                    return
                end
            end
        end

        args = "#{@hypervisor} #{ds_location} #{@collectd_port}"
        args << " #{@monitor_push_interval}"
        do_action(args, number, host,:MONITOR, :script_name => 'run_probes',
                  :base64 => true)
    end

    def stop_monitor(number, host)
        do_action("#{@hypervisor}", number, host,
                :STOPMONITOR, :script_name => 'stop_probes', :base64 => true)
    end
end


# Information Manager main program

opts = GetoptLong.new(
    [ '--retries',    '-r', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--local',      '-l', GetoptLong::NO_ARGUMENT ],
    [ '--force-copy', '-c', GetoptLong::NO_ARGUMENT ]
)

hypervisor      = ''
retries         = 0
threads         = 15
local_actions   = {}
force_copy      = false

begin
    opts.each do |opt, arg|
        case opt
            when '--retries'
                retries = arg.to_i
            when '--threads'
                threads = arg.to_i
            when '--local'
                local_actions={ 'MONITOR' => nil }
            when '--force-copy'
                force_copy=true
        end
    end
rescue Exception => e
    exit(-1)
end

if ARGV.length >= 1
    hypervisor = ARGV.shift
end

im = InformationManagerDriver.new(hypervisor,
    :concurrency => threads,
    :retries => retries,
    :local_actions => local_actions,
    :force_copy => force_copy)

im.start_driver
