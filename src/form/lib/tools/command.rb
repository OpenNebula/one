# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

module OneForm

    # Base class for command execution for drivers
    module Command

        # Runs a command
        #
        # @param cmd [String] Command to run
        # @param logger [Logger] to log stdout and stderr command streams
        # @param success_cb [lambda] executed if command was success
        # @param failure_cb [lambda] executed if command failed
        def run(cmd, logger, success_cb, failure_cb)
            stdin, stdout, stderr, wait_thr = Open3.popen3(cmd)

            stdout_thr = Thread.new do
                while (line = stdout.gets)
                    line.strip!
                    logger.debug(line) unless line.empty?
                end if logger
            end

            stderr_thr = Thread.new do
                while (line = stderr.gets)
                    line.strip!
                    logger.error(line) unless line.empty?
                end if logger
            end

            Thread.new do
                exit_status = wait_thr.value

                stdout_thr.join
                stderr_thr.join

                stdin.close
                stdout.close
                stderr.close

                if exit_status.success?
                    success_cb&.call
                else
                    failure_cb&.call
                end
            end
        rescue StandardError => e
            logger.error(Marshal.dump(e))
        end

        # Runs a given block asynchronously
        #
        # @param logger [Logger] Logger for error handling
        # @param success_cb [Proc] executed if block is successful
        # @param failure_cb [Proc] executed if block fails
        def run_block(logger, success_cb, failure_cb, &block)
            Thread.new do
                begin
                    block.call
                    success_cb&.call
                rescue StandardError => e
                    logger.error(e.message)
                    failure_cb&.call
                end
            end
        end

        # Run a block in a directory context with cleanup
        #
        # @param [String] dir the directory path
        def within_dir(dir)
            begin
                pwd = Dir.pwd
                Dir.chdir dir
                yield
            ensure
                Dir.chdir pwd
            end
        end

    end

end
