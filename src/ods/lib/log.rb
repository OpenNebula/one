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

module OpenNebula

    module DocumentServer

        # Logging class
        class Log

            # <date> [<level>] message
            MSG_FORMAT  = %(%s [%s] %s\n)

            # Mon Feb 27 06:02:30 2012
            DATE_FORMAT = '%a %b %d %H:%M:%S %Y'

            DEBUG_LEVEL = {
                0 => Logger::ERROR,
                1 => Logger::WARN,
                2 => Logger::INFO,
                3 => Logger::DEBUG
            }

            LOG_MESSAGES = [:debug, :info, :error, :warn]

            def self.instance(conf = nil)
                @instance ||= begin
                    if conf
                        level = DEBUG_LEVEL[conf[:level]] || Logger::DEBUG
                        new(
                            :type  => conf[:system] || 'file',
                            :name  => ODS_NAME,
                            :path  => LOG_LOCATION,
                            :level => level
                        )
                    else
                        new(:name => ODS_NAME)
                    end
                end
            end

            def self.debug?
                DEBUG_LEVEL[SERVER_CONF[:log][:level]] == Logger::DEBUG
            end

            def initialize(opts = {})
                @name = opts[:name].downcase
                @path = File.join(opts[:path], "#{@name}.log")
                @type = opts[:type]

                @logger = case @type
                          when 'syslog'
                              Syslog::Logger.new(@name)
                          when 'file'
                              Logger.new(@path)
                          when 'stderr'
                              Logger.new(STDERR)
                          else
                              raise 'Unknown log facility'
                          end

                @logger.level = opts[:level] || Logger::INFO

                @logger.formatter = proc do |severity, datetime, _progname, msg|
                    format(
                        MSG_FORMAT,
                        datetime.strftime(DATE_FORMAT),
                        severity[0..0],
                        msg
                    )
                end
            end

            LOG_MESSAGES.each do |command|
                define_method(command) do |component, msg, resource_id = nil|
                    formatted_msg = "[#{component}]: #{msg}"

                    if resource_id
                        log_to_resource(command, formatted_msg, resource_id)
                    else
                        @logger.send(command, formatted_msg)
                    end
                end

                define_singleton_method(command) do |component, msg, resource_id = nil|
                    Log.instance.send(command, component, msg, resource_id)
                end
            end

            def write(msg)
                info('MAIN', msg.to_s.chop)
            end

            private

            # Writes the log entry to the resource-specific log file (<id>.log)
            # instead of the main application log
            def log_to_resource(command, formatted_msg, resource_id)
                return unless @type == 'file'

                file = resource_log_file(resource_id)

                begin
                    FileUtils.mkdir_p(File.dirname(file))

                    sev_i = Logger.const_get(command.to_s.upcase)
                    sev_s = Logger::SEV_LABEL[sev_i] || sev_i.to_s

                    msg = @logger.formatter.call(
                        sev_s,
                        Time.now,
                        nil,
                        formatted_msg
                    )

                    File.open(file, 'a') {|f| f << msg }
                rescue StandardError => e
                    @logger.error("[LOG]: Could not log resource #{resource_id}: #{e.message}")
                end
            end

            def resource_log_file(resource_id)
                File.join(LOG_LOCATION, @name, "#{resource_id}.log")
            end

        end
        # rubocop:enable Style/ClassVars

    end

end
