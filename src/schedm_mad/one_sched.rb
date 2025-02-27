#!/usr/bin/env ruby

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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    ETC_LOCATION      = '/etc/one/'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    ETC_LOCATION      = ONE_LOCATION + '/etc/'
end

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'DriverLogger'
require 'OpenNebulaDriver'
require 'getoptlong'

# require 'shellwords'

# Scheduler Driver. This class executes place and optimize actions of the active
# scheduler
class SchedulerDriver < OpenNebulaDriver

    # Scheduler Driver Protocol constants
    ACTION = {
        :place    => 'PLACE',
        :optimize => 'OPTIMIZE'
    }

    # Init the driver
    def initialize(scheduler, options = {})
        @options={
            :concurrency   => 15,
            :threaded      => false,
            :retries       => 0,
            :local_actions => {
                ACTION[:place]    => nil,
                ACTION[:optimize] => nil
            }
        }.merge!(options)

        super('scheduler', @options)

        @scheduler = scheduler

        path = File.join(@local_scripts_path, @scheduler)

        raise "Scheduler #{scheduler} not avialable" unless File.directory?(path)

        register_action(ACTION[:place].to_sym, method('place'))

        register_action(ACTION[:optimize].to_sym, method('optimize'))
    end

    # Exectutes PLACE action using
    #   /var/lib/one/remotes/sched/one-drs/place <<STDIN
    #       <drv_message>
    #   STDIN
    def place(_id, drv_message)
        cmd = File.join(@local_scripts_path, @scheduler, 'place')
        rc  = LocalCommand.run(cmd, log_method(0, :encode => true), drv_message, nil)

        result, info = get_info_from_execution(rc, :encode => true)

        send_message(ACTION[:place], result, 0, Base64.strict_encode64(info))
    end

    # Exectutes OPTIMIZE action using
    #   /var/lib/one/remotes/sched/one-drs/optimize <cluster_id> <<STDIN
    #       <drv_message>
    #   STDIN
    def optimize(id, drv_message)
        cmd = "#{File.join(@local_scripts_path, @scheduler, 'optimize')} #{id}"

        rc  = LocalCommand.run(cmd, log_method(id, true), drv_message, nil)

        result, info = get_info_from_execution(rc)

        send_message(ACTION[:optimize], result, id, info)
    end

end

################################################################################
# IPAM Driver Main program
################################################################################
opts = GetoptLong.new(
    ['--threads', '-t', GetoptLong::OPTIONAL_ARGUMENT],
    ['--scheduler', '-s', GetoptLong::REQUIRED_ARGUMENT]
)

scheduler = 'rank'
threads   = 1

begin
    opts.each do |opt, arg|
        case opt
        when '--scheduler'
            scheduler = arg
        when '--threads'
            threads = arg.to_i
        end
    end

    SchedulerDriver.new(scheduler, :concurrency => threads).start_driver
rescue StandardError => e
    STDERR.puts "Error starting driver: #{e.message}"
    exit(-1)
end
