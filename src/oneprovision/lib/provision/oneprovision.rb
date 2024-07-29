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

require 'provision/ansible'
require 'provision/driver'
require 'provision/provision'
require 'provision/provision_config'
require 'provision/provision_pool'
require 'provision/resources'
require 'provision/utils'

require 'base64'
require 'logger'
require 'singleton'

module OneProvision

    # Singleton OneProvision Logger
    class OneProvisionLogger

        include Singleton

        attr_reader :logger

        # Class constructor
        def initialize
            @logger = Logger.new(STDERR)
        end

        # Gets the logger
        #
        # @param options [Key-Value Object] CLI options
        def self.get_logger(options)
            format = '%Y-%m-%d %H:%M:%S'

            instance.logger.formatter = proc do |severity, datetime, _p, msg|
                if options[:json]
                    "{ \"timestamp\": \"#{datetime}\", " \
                    " \"severity\": \"#{severity}\", " \
                    " \"message\": \"#{Base64.strict_encode64(msg)}\"}\n"
                elsif options[:xml]
                    "<TIMESTAMP>#{datetime}</TIMESTAMP>" \
                    "<SEVERITY>#{severity}</SEVERITY>" \
                    "<MESSAGE>#{Base64.strict_encode64(msg)}</MESSAGE>\n"
                else
                    "#{datetime.strftime(format)} #{severity.ljust(5)} " \
                    ": #{msg}\n"
                end
            end

            if options.key? :debug
                instance.logger.level = Logger::DEBUG
            elsif options.key? :verbose
                instance.logger.level = Logger::INFO
            else
                instance.logger.level = Logger::UNKNOWN
            end
        end

        # Shows a debug message
        #
        # @param msg [String] Message to show
        def self.debug(msg)
            instance.logger.debug(msg)
        end

        # Shows an error message
        #
        # @param msg [String] Message to show
        def self.error(msg)
            instance.logger.error(msg)
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

        # Gets Terraform log level
        def self.tf_log
            if instance.logger.level == 0
                'DEBUG'
            else
                'INFO'
            end
        end

    end

    # Singleton running mode
    class Mode

        include Singleton

        attr_reader :run_mode

        # Class constructor
        def initialize
            @run_mode = {}
        end

        # Gets running mode
        #
        # @param options [Key-Value Object] CLI options
        def self.get_run_mode(options)
            if options.key? :batch
                instance.run_mode[:mode] = :batch
            else
                instance.run_mode[:mode] = RUN_MODE_DEFAULT
            end

            instance.run_mode[:fail_modes] = []

            if options.key? :fail_modes
                instance.run_mode[:fail_modes] << options[:fail_modes]
            end

            options.each do |key, _|
                next unless key =~ /^fail_/

                next if key =~ /sleep/ || key =~ /modes/

                instance.run_mode[:fail_modes] << key.to_s.split('_')[1].to_sym
            end

            if instance.run_mode[:fail_modes].empty?
                instance.run_mode[:fail_modes] << FAIL_CHOICE_DEFAULT
            end

            instance.run_mode[:fail_modes].flatten!

            if options.key? :fail_sleep
                instance.run_mode[:fail_sleep] = options[:fail_sleep]
            end

            if options[:fail_retry]
                instance.run_mode[:max_retries] = Integer(options[:fail_retry])
            else
                instance.run_mode[:max_retries] = MAX_RETRIES_DEFAULT
            end

            instance.run_mode[:cleanup] = CLEANUP_DEFAULT
        end

        # Gets cleanup value
        #
        # @return [Boolean] Cleanup
        def self.cleanup
            instance.run_mode[:cleanup]
        end

        # Gets fail choice value
        #
        # @return [Sym] Choice value
        def self.fail_choice
            instance.run_mode[:fail_modes][0]
        end

        # Gets time between fail modes
        #
        # @return [Integer] Time in seconds
        def self.fail_sleep
            instance.run_mode[:fail_sleep]
        end

        # Gets next fail choice value
        #
        # @return [Sym] Choice value
        def self.next_fail_choice
            instance.run_mode[:fail_modes].shift
        end

        # Gets max retries value
        #
        # @return [Integer] Maximun retries
        def self.max_retries
            instance.run_mode[:max_retries]
        end

        # Gets mode value
        #
        # @return [Sym] Mode value
        def self.mode
            instance.run_mode[:mode]
        end

        # Sets cleanup value
        #
        # @param value [Boolean] New cleanup value
        def self.new_cleanup(value)
            instance.run_mode[:cleanup] = value
        end

    end

    # Singleton options
    class Options

        include Singleton

        attr_reader :run_options

        # Class constructor
        def initialize
            @run_options = {}
        end

        # Gets options
        #
        # @param options [Key-Value Object] CLI Options
        def self.get_run_options(options)
            if options.key? :ping_timeout
                instance.run_options[:ping_timeout] = options[:ping_timeout]
            else
                instance.run_options[:ping_timeout] = PING_TIMEOUT_DEFAULT
            end

            if options.key? :ping_retries
                instance.run_options[:ping_retries] = options[:ping_retries]
            else
                instance.run_options[:ping_retries] = PING_RETRIES_DEFAULT
            end

            if options.key? :threads
                instance.run_options[:threads] = options[:threads]
            else
                instance.run_options[:threads] = THREADS_DEFAULT
            end
        end

        # Gets ping retries value
        #
        # @return [Integer] Ping retries value
        def self.ping_retries
            instance.run_options[:ping_retries]
        end

        # Gets ping timeout value
        #
        # @return [Integer] Ping timeout value
        def self.ping_timeout
            instance.run_options[:ping_timeout]
        end

        # Gets number of threads
        #
        # @return [Integer] Number of threads
        def self.threads
            instance.run_options[:threads]
        end

    end

    # Singleton virtual objects options
    class ObjectOptions

        include Singleton

        attr_reader :obj_opts

        # Class constructor
        def initialize
            @obj_opts = {}
        end

        # Gets options
        #
        # @param options [Key-Value Object] CLI Options
        def self.get_obj_options(options)
            if options.key? :wait_ready
                instance.obj_opts[:wait_ready] = true
            else
                instance.obj_opts[:wait_ready] = false
            end

            if options.key? :wait_timeout
                instance.obj_opts[:wait_timeout] = options[:wait_timeout]
            else
                instance.obj_opts[:wait_timeout] = WAIT_TIMEOUT_DEFAULT
            end
        end

        # Get wait and timeout
        #
        # @param meta [Hash] Meta information from object
        #
        # @return [boolean, integer] [wait, timeout]
        def self.get_wait(meta)
            if meta
                wait    = meta['wait']
                timeout = meta['wait_timeout']
            end

            case wait
            when false
                [wait, nil]
            when true
                if timeout
                    [wait, timeout]
                else
                    [wait, instance.obj_opts[:wait_timeout]]
                end
            else
                [instance.obj_opts[:wait_ready],
                 instance.obj_opts[:wait_timeout]]
            end
        end

    end

end
