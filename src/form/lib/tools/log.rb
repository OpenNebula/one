# rubocop:disable Style/ClassVars
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

# Logging class
class Log

    # <date> [<level>] message
    MSG_FORMAT  = %(%s [%s] %s\n)

    # Mon Feb 27 06:02:30 2012
    DATE_FORMAT = '%a %b %d %H:%M:%S %Y'

    DEBUG_LEVEL = {
        'error' => Logger::ERROR,
        'warn'  => Logger::WARN,
        'info'  => Logger::INFO,
        'debug' => Logger::DEBUG
    }

    def self.instance(opts = {})
        @@instance ||= Log.new(opts)
    end

    def initialize(opts = {})
        @type   = opts[:type]

        @logger = case @type
                  when 'syslog'
                      Syslog::Logger.new(opts[:name])
                  when 'file'
                      Logger.new(opts[:path])
                  when 'stderr'
                      Logger.new(STDERR)
                  else
                      raise 'Unknown log facility'
                  end

        @logger.level = DEBUG_LEVEL[opts[:level]] || 2

        @logger.formatter = proc do |severity, datetime, _progname, msg|
            format(MSG_FORMAT, datetime.strftime(DATE_FORMAT), severity[0..0], msg)
        end
    end

    LOG_MESSAGES = [:debug, :info, :error, :warn]

    LOG_MESSAGES.each do |command|
        define_method(command) do |mod = '', msg|
            msg = "[#{mod}]: #{msg}" unless mod.empty?
            @logger.send(command, msg)
        end
    end

    class << self

        LOG_MESSAGES.each do |command|
            define_method(command) do |mod = '', msg|
                msg = "[#{mod}]: #{msg}" unless mod.empty?
                Log.instance.send(command, msg)
            end
        end

    end

    def write(msg)
        info msg.chop
    end

    def add(severity, message = nil, progname = nil, &block)
        @logger.add(severity, message, progname, &block)
    end

end

# rubocop:enable Style/ClassVars
