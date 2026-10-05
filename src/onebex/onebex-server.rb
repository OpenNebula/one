#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require_relative 'config/environment'
require_relative 'bex_state'

# --------------------------------------------------------------------------
# OneBEX server state
# --------------------------------------------------------------------------

begin
    module OneBEX

        BEX = BEXState.new

    end

    puts '--------------------------------------'
    puts '     OneBEX Server configuration      '
    puts '--------------------------------------'
    pp OneBEX::BEX.conf
    puts '--------------------------------------'
    puts

    STDOUT.flush
rescue StandardError => e
    STDERR.puts "Error parsing config file #{CONFIGURATION_FILE}: #{e.message}"
    exit 1
end

# --------------------------------------------------------------------------
# Sinatra app
# --------------------------------------------------------------------------

module OneBEX

    # Sinatra application serving the OneBEX API.
    class OneBEXServer < Sinatra::Base

        set :bind, OneBEX::BEX.conf[:host]
        set :port, OneBEX::BEX.conf[:port]
        set :host_authorization, { :permitted_hosts => [] }

        set :bex, OneBEX::BEX
        set :logger, OneBEX::BEX.logger

        set :dump_errors, true
        set :raise_errors, false
        set :show_exceptions, false

        register OneBEX::AppRoutes

    end

end

# --------------------------------------------------------------------------
# Puma startup
#
# Started by DS drivers. Stops when POST /vms/:vm_id/finish is called.
# --------------------------------------------------------------------------

if __FILE__ == $PROGRAM_NAME
    bex = OneBEX::BEX

    user_config = bex.conf[:puma] || {}

    min_threads = user_config[:min_threads] || 1
    max_threads = user_config[:max_threads] || 4

    puma_config = Puma::Configuration.new do |puma|
        puma.app OneBEX::OneBEXServer
        puma.bind "tcp://#{bex.conf[:host]}:#{bex.conf[:port]}"
        puma.threads min_threads.to_i, max_threads.to_i
    end

    bex.puma = Puma::Launcher.new(puma_config)

    begin
        bex.logger.info 'Starting OneBEX server'
        bex.logger.info "OneBEX Puma config: bind=#{bex.conf[:host]}:" \
                 "#{bex.conf[:port]}, threads=#{min_threads}:#{max_threads}"

        bex.puma.run
    rescue StandardError => e
        bex.logger.error "OneBEX failed: #{e.message}"
        bex.logger.error e.backtrace.join("\n") if e.backtrace

        bex.exit_code = 1
    end

    bex.logger.info "OneBEX exiting with code #{bex.exit_code}"

    exit(bex.exit_code)
end
