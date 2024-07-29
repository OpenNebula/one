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
            # @param provision [Provision] Provision information
            # @param cleanup [Boolean]   True if the operation can be cleaned up
            # @param block   [Ruby Code] Block of code to execute
            def retry_loop(text, provision = nil, cleanup = Mode.cleanup)
                retries = 0

                begin
                    yield
                rescue OneProvisionLoopException => e
                    STDERR.puts "ERROR: #{text}\n#{e.text}"

                    retries += 1
                    choice   = Mode.fail_choice
                    seconds  = Mode.fail_sleep

                    if retries > Mode.max_retries && Mode.mode == :batch
                        retries = 0
                        choice  = Mode.next_fail_choice

                        sleep(seconds) if seconds && choice
                    end

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
                            if provision
                                provision.state = Provision::STATE['ERROR']
                                provision.update
                            end

                            exit(-1)
                        end
                    end

                    if provision
                        provision.state = Provision::STATE['ERROR']
                        provision.update
                    end

                    case choice
                    when :retry
                        sleep(seconds) if seconds

                        retry
                    when :quit
                        exit(-1)
                    when :skip
                        return :skip
                    when :cleanup
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
            def run((*cmd), out = false)
                OneProvisionLogger.debug("Command run: #{cmd.join(' ')}")

                rtn = nil

                begin
                    if cmd.last == Hash
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

                        out_reader = Thread.new { streamer(o, out) }
                        err_reader = Thread.new { streamer(e, out) }

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

                        rtn = [out_reader.value.strip,
                               err_reader.value,
                               t.value]
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

            # Print lines until empty
            #
            # @param str       [String]  Line to print
            # @param logstdout [Boolean] True to print the line
            def streamer(str, logstdout)
                full = ''

                str.each do |l|
                    next if l.empty? || l == "\n"

                    full << l

                    next unless logstdout

                    print l
                    $stdout.flush
                end

                full
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

            # Execute action with Terraform
            #
            # @param provision [Provision] Provision information
            # @param action    [String]    Action to perform
            # @param tf        [Hash]      Terraform :state and :conf
            def tf_action(provision, action, tf = {})
                Terraform.p_load

                provider  = provision.provider
                terraform = Terraform.singleton(provider, tf)

                terraform.generate_deployment_file(provision)
                terraform.send(action, provision)
            end

        end

    end

end
