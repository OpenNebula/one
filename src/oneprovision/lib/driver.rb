# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

module OneProvision

    # Driver
    module Driver

        class << self

            # Mutex to synchronize console output
            # rubocop:disable Style/ClassVars
            @@mutex = Mutex.new
            # rubocop:enable Style/ClassVars

            # Retry the operation in case of failure
            #
            # @param text    [String]    Operation
            # @param cleanup [Boolean]   True if the operation can be cleaned up
            # @param block   [Ruby Code] Block of code to execute
            def retry_loop(text, cleanup = Mode.cleanup)
                retries = 0

                begin
                    yield
                rescue OneProvisionLoopException => e
                    STDERR.puts "ERROR: #{text}\n#{e.text}"

                    retries += 1

                    if retries > Mode.max_retries && Mode.mode == :batch
                        exit(-1)
                    end

                    choice = Mode.fail_choice

                    if Mode.mode == :interactive
                        begin
                            @@mutex.synchronize do
                                cli = HighLine.new($stdin, $stderr)

                                choice = cli.choose do |menu|
                                    menu.prompt = 'Choose failover method:'
                                    menu.choices(:quit, :retry, :skip)
                                    menu.choices(:cleanup) if cleanup
                                    menu.default = choice
                                end
                            end
                        rescue EOFError
                            STDERR.puts choice
                        rescue Interrupt => e
                            exit(-1)
                        end
                    end

                    if choice == :retry
                        retry
                    elsif choice == :quit
                        exit(-1)
                    elsif choice == :skip
                        return
                    elsif choice == :cleanup
                        raise OneProvisionCleanupException if cleanup

                        Utils.fail('Cleanup unsupported for this operation')
                    end

                    exit(-1)
                end
            end

            # Runs commands
            #
            # @param cmd   [Array]       Command and arguments to execute
            # @param block [Ruby Code]
            #
            # @return      [Array]       Output, Error and Value returned
            def run(*cmd, &_block)
                OneProvisionLogger.debug("Command run: #{cmd.join(' ')}")

                rtn = nil

                begin
                    if Hash == cmd.last
                        opts = cmd.pop.dup
                    else
                        opts = {}
                    end

                    stdin_data = opts.delete(:stdin_data) || ''
                    binmode = opts.delete(:binmode)

                    Open3.popen3(*cmd, opts) do |i, o, e, t|
                        if binmode
                            i.binmode
                            o.binmode
                            e.binmode
                        end

                        out_reader = Thread.new { o.read }
                        err_reader = Thread.new { e.read }

                        begin
                            i.write stdin_data
                        rescue Errno::EPIPE => e
                            raise OneProvisionLoopException, e.text
                        end

                        begin
                            i.close
                        rescue IOError => e
                            raise OneProvisionLoopException, e.text
                        end

                        rtn = [out_reader.value, err_reader.value, t.value]
                    end

                    @@mutex.synchronize do
                        if rtn
                            if !rtn[0].empty?
                                OneProvisionLogger.debug('Command STDOUT: ' \
                                                "#{rtn[0].strip}")
                            end

                            if !rtn[1].empty?
                                OneProvisionLogger.debug('Command STDERR: ' \
                                                "#{rtn[1].strip}")
                            end

                            if rtn[2].success?
                                OneProvisionLogger.debug('Command succeeded')
                            else
                                OneProvisionLogger.warn('Command FAILED ' \
                                               "(code=#{rtn[2].exitstatus}): " \
                                               "#{cmd.join(' ')}")
                            end
                        else
                            OneProvisionLogger
                                .error('Command failed on unknown error')
                        end
                    end
                rescue Interrupt
                    Utils.fail('Command interrupted')
                rescue StandardError => e
                    OneProvisionLogger.error("Command exception: #{e.message}")
                end

                rtn
            end

            # Executes an action in the host
            #
            # @param pm_mad [String]           Provision Manager Driver
            # @param action [String]           Action to executue
            # @param args   [Array]            Arguments for the driver
            # @param host   [OpenNebula::Host] Host where execute the action
            #
            # @return       [String]           Output of the commmand
            def pm_driver_action(pm_mad, action, args, host = nil)
                cmd = ["#{REMOTES_LOCATION}/pm/#{pm_mad}/#{action}"]

                args.each do |arg|
                    cmd << arg
                end

                # action always gets host ID/name
                # if host defined, same as for VMs:
                # https://github.com/OpenNebula/one/blob/d95b883e38a2cee8ca9230b0dbef58ce3b8d6d6c/src/mad/ruby/OpenNebulaDriver.rb#L95
                @@mutex.synchronize do
                    unless host.nil?
                        cmd << host.id
                        cmd << host.name
                    end
                end

                unless File.executable? cmd[0]
                    OneProvisionLogger.error('Command not found or ' \
                                    "not executable #{cmd[0]}")
                    Utils.fail('Driver action script not executable')
                end

                o = nil

                retry_loop "Driver action '#{cmd[0]}' failed" do
                    o, e, s = run(cmd.join(' '))

                    unless s && s.success?
                        err = Utils.get_error_message(e)

                        text = err.lines[0].strip if err
                        text = 'Unknown error' if text == '-'

                        raise OneProvisionLoopException, text
                    end
                end

                o
            end

            # TODO: handle exceptions?
            #
            # Writes content to file
            #
            # @param name    [String] Name of the file
            # @param content [String] Content of the file
            def write_file_log(name, content)
                @@mutex.synchronize do
                    OneProvisionLogger.debug("Creating #{name}:\n" + content)
                end

                f = File.new(name, 'w')
                f.write(content)
                f.close
            end

        end

    end

end
