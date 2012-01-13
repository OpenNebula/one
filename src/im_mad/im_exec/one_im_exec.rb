#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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
    end

    # Execute the run_probes in the remote host
    def action_monitor(number, host, do_update)
        if !action_is_local?(:MONITOR)
            if do_update == "1"
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
        do_action("#{@hypervisor}", number, host, :MONITOR,
            :script_name => 'run_probes')
    end
end


# Information Manager main program

opts = GetoptLong.new(
    [ '--retries',    '-r', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--local',      '-l', GetoptLong::NO_ARGUMENT ]
)

hypervisor      = ''
retries         = 0
threads         = 15
local_actions   = {}

begin
    opts.each do |opt, arg|
        case opt
            when '--retries'
                retries = arg.to_i
            when '--threads'
                threads = arg.to_i
            when '--local'
                local_actions={ 'MONITOR' => nil }
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
    :local_actions => local_actions)

im.start_driver
