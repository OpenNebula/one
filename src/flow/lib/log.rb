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

    class << self

        # This class handles logging for each service and for the service server
        # Log.info("SERVER", "It works"), it will be written in the main log
        # Log.info("LCM", "Service 3 started", 3), it will be written in a
        #   specific log for service number 3

        LOG_COMP = 'LOG'

        DEBUG_LEVEL = [
            Logger::ERROR, # 0
            Logger::WARN,  # 1
            Logger::INFO,  # 2
            Logger::DEBUG  # 3
        ]

        # LOG_LOCATION = '/var/log/one'

        @log_level = Logger::DEBUG

        # Mon Feb 27 06:02:30 2012 [Clo] [E]: Error message example
        MSG_FORMAT  = %(%s [%s]: [%s] %s\n)

        # Mon Feb 27 06:02:30 2012
        DATE_FORMAT = '%a %b %d %H:%M:%S %Y'

        # Message to be used in CloudLogger
        CLOUD_LOGGER_MSG = %([%s] %s)

        # Sets the server logger
        # @param [CloudLogger::CloudLogger, Logger] logger
        def logger=(logger)
            @@logger = logger
        end

        # Sets the logger type
        # @param type [String]
        #
        #   - file: log into log files
        #   - syslog: log into syslog
        def type=(type)
            @@type = type
        end

        # Sets the log level
        # @param [Integer] log_level (0:ERROR, 1:WARN, 2:INFO, 3:DEBUG)
        def level=(log_level)
            @@log_level = DEBUG_LEVEL[log_level]
        end

        # Writes a info message to the log. If a service_id is specified the
        #   message will be written to the service log, otherwise the server log
        #   will be used.
        # @param [String] component
        # @param [String] message
        # @param [String] service_id
        #
        # @example
        #   Mon Feb 27 06:02:30 2012 [<component>] [I]: <message>
        def info(component, message, service_id = nil)
            if service_id
                add(Logger::INFO, component, message, service_id)
            else
                @@logger.info(format(CLOUD_LOGGER_MSG, component, message))
            end
        end

        # Writes a debug message to the log. If a service_id is specified the
        #   message will be written to the service log, otherwise the server log
        #   will be used.
        # @param [String] component
        # @param [String] message
        # @param [String] service_id
        #
        # @example
        #   Mon Feb 27 06:02:30 2012 [<component>] [D]: <message>
        def debug(component, message, service_id = nil)
            if service_id
                add(Logger::DEBUG, component, message, service_id)
            else
                @@logger.debug(format(CLOUD_LOGGER_MSG, component, message))
            end
        end

        # Writes a error message to the log. If a service_id is specified the
        #   message will be written to the service log, otherwise the server log
        #   will be used.
        # @param [String] component
        # @param [String] message
        # @param [String] service_id
        #
        # @example
        #   Mon Feb 27 06:02:30 2012 [<component>] [E]: <message>
        def error(component, message, service_id = nil)
            if service_id
                add(Logger::ERROR, component, message, service_id)
            else
                @@logger.error(format(CLOUD_LOGGER_MSG, component, message))
            end
        end

        # Writes a warn message to the log. If a service_id is specified the
        #   message will be written to the service log, otherwise the server log
        #   will be used.
        # @param [String] component
        # @param [String] message
        # @param [String] service_id
        #
        # @example
        #   Mon Feb 27 06:02:30 2012 [<component>] [W]: <message>
        def warn(component, message, service_id = nil)
            if service_id
                add(Logger::WARN, component, message, service_id)
            else
                @@logger.warn(format(CLOUD_LOGGER_MSG, component, message))
            end
        end

        private

        def add(severity, component, message, service_id)
            if severity < @@log_level
                return true
            end

            begin
                file = "#{LOG_LOCATION}/oneflow/#{service_id}.log"
                msg  = format(
                    MSG_FORMAT,
                    Time.now.strftime(DATE_FORMAT),
                    Logger::SEV_LABEL[severity][0..0],
                    component,
                    message
                )

                case @@type
                when 'syslog'
                    @@logger.info(msg)
                else
                    File.open(file, 'a') {|f| f << msg }
                end
            rescue Errno::ENOENT
                FileUtils.mkdir("#{LOG_LOCATION}/oneflow/")

                File.open(file, 'a') {|f| f << msg }
            rescue StandardError => e
                message = 'Could not log into ' \
                          "#{LOG_LOCATION}/oneflow/#{service_id}.log: " \
                          "#{e.message}"

                error LOG_COMP, message
            end
        end

    end

end
# rubocop:enable Style/ClassVars
