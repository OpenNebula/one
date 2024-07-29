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

require 'logger'
require 'singleton'

# Singleton OneCfg Logger
# VH-TODO: CLI logger and file logger, we might want to log on both
# VH-TODO: Support different verbose levels for different loggers, e.g. on CLI
# we log based on user preference -d/-D, but into log we can log on specified
# level (e.g., debug) always
module OneCfg

    module Common

        # CLI logger
        class CliLogger

            include Singleton

            attr_reader :logger
            attr_accessor :custom_level

            # Class constructor
            def initialize
                @logger       = Logger.new(STDERR)
                @logger.level = Logger::WARN
                @custom_level = Logger::UNKNOWN
            end

            # Gets the logger
            #
            # @param options [Key-Value Object] CLI options
            def self.get_logger(options)
                instance.logger.formatter = proc do |severity, _d, _p, msg|
                    "#{severity.ljust(5)} : #{msg}\n"
                end

                if options.key? :debug
                    instance.logger.level = Logger::DEBUG
                elsif options.key? :verbose
                    instance.logger.level = Logger::INFO
                elsif options.key? :ddebug
                    instance.logger.level = Logger::DEBUG
                    instance.custom_level = :ddebug
                elsif options.key? :dddebug
                    instance.logger.level = Logger::DEBUG
                    instance.custom_level = :dddebug
                else
                    instance.logger.level = Logger::WARN
                end
            end

            # Shows a debug message
            #
            # @param msg [String] Message to show
            def self.debug(msg)
                instance.logger.debug(msg)
            end

            # Shows a debug-debug message
            #
            # @param msg [String] Message to show
            def self.ddebug(msg)
                return unless \
                    [:ddebug, :dddebug].include?(instance.custom_level)

                instance.logger.debug(msg) # TODO
            end

            # Shows a debug-debug-debug message
            #
            # @param msg [String] Message to show
            def self.dddebug(msg)
                return unless instance.custom_level == :dddebug

                instance.logger.debug(msg) # TODO
            end

            # Shows an error message
            #
            # @param msg [String] Message to show
            def self.error(msg)
                instance.logger.error(msg)
            end

            # Shows an fatal error message
            #
            # @param msg [String] Message to show
            def self.fatal(msg)
                instance.logger.fatal(msg)
            end

            # Shows an info message
            #
            # @param msg [String] Message to show
            def self.info(msg)
                instance.logger.info(msg)
            end

            # Shows a warning message
            #
            # @param msg [String] Message to show
            def self.warn(msg)
                instance.logger.warn(msg)
            end

            # Shows an unknown message
            #
            # @param msg [String] Message to show
            def self.unknown(msg)
                instance.logger.unknown(msg)
            end

        end

    end

end
