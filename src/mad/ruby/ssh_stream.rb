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

require 'CommandManager'
require 'open3'
require 'scripts_common'

class SshStream
    attr_reader :stream_out, :stream_err, :stdin
    attr_reader :out, :err

    attr_accessor :forward

    #
    #
    EOF_ERR = "EOF_ERR"
    EOF_OUT = "EOF_OUT"
    RC_STR  = "ExitCode: "
    SSH_RC_STR  = "ExitSSHCode: "

    EOF_CMD = "echo \"#{RC_STR}$? #{EOF_ERR}\" 1>&2; echo \"#{EOF_OUT}\""
    SSH_CMD = "ssh"
    #
    #
    #
    def initialize(host, shell = "bash", timeout = nil)
        @host       = host
        @shell      = shell
        @timeout    = timeout
        @forward    = false
    end

    def opened?
        defined?(@stdin)
    end

    def alive?
        @alive == true
    end

    def open
        @stdin, @stdout, @stderr, @wait_thr = Open3::popen3(
            "#{ssh_cmd} #{@host} #{@shell} -s ; echo #{SSH_RC_STR} $? 1>&2",
            :pgroup => true
        )

        @stream_out = ""
        @stream_err = ""

        @out = ""
        @err = ""

        @alive = true
    end

    def close
        return if !@alive

        begin
            @stdin.puts "\nexit"
        rescue #rescue from EPIPE if ssh command exited already
        end

        @stdin.close  if not @stdin.closed?
        @stdout.close if not @stdout.closed?
        @stderr.close if not @stderr.closed?

        @alive = false
    end

    def kill(pid)
        # executed processes now have its own process group to be able
        # to kill all children
        pgid = Process.getpgid(pid)

        # Kill all processes belonging to process group
        Process.kill("HUP", pgid * -1)
    end

    def exec(command)
        return if ! @alive

        @out = ""
        @err = ""

        begin
            cmd="(#{command}); #{EOF_CMD}"

            sliced=cmd.scan(/.{1,100}/)

            sliced.each do |slice|
                @stdin.write slice
                @stdin.flush
            end

            @stdin.write "\n"
            @stdin.flush
        rescue

        end
    end

    def wait_for_command(timeout = nil)
        @timeout = timeout if timeout

        done_out = false
        done_err = false
        time_start = Time.now.to_i

        code = -1

        while not (done_out and done_err ) and @alive
            rc, rw, re= IO.select([@stdout, @stderr],[],[], 1)

            if rc
                rc.each { |fd|
                    begin
                        c = fd.read_nonblock(100)
                        next if !c
                    rescue #rescue from EOF if ssh command finishes and
                           # closes fds
                        next
                    end

                    if fd == @stdout
                        @out << c
                        done_out = true if @out.slice!("#{EOF_OUT}\n")
                    else
                        @err << c

                        tmp = @err.scan(/^#{SSH_RC_STR}(\d+)$/)

                        if tmp[0]
                            message = "Error connecting to #{@host}"
                            code    = tmp[0][0].to_i

                            @err << message

                            @alive = false
                            break
                        end

                        tmp = @err.scan(/^#{RC_STR}(\d*) #{EOF_ERR}\n/)

                        if tmp[0]
                            code     = tmp[0][0].to_i
                            done_err = true

                            @err.slice!(" #{EOF_ERR}\n")
                        end
                    end
                }
            end

            if @timeout && Time.now.to_i - time_start > @timeout
                @err << "\nTimeout Error"
                self.close
                self.kill(@wait_thr.pid)

                break
            end
        end

        @stream_out << @out
        @stream_err << @err

        return code
    end

    def exec_and_wait(command)
        exec(command)
        wait_for_command
    end

    private

    def ssh_cmd
        if @forward
            SSH_CMD + ' -o ForwardAgent=yes -o ControlMaster=no -o ControlPath=none'
        else
            SSH_CMD
        end
    end
end


class SshStreamCommand < RemotesCommand
    def initialize(host, remote_dir, logger=nil, stdin=nil, shell='bash', timeout=nil)
        super('true', host, logger, stdin, timeout)

        @remote_dir = remote_dir
        @stream     = SshStream.new(host, shell, timeout)
    end

    def run(command, stdin=nil, base_cmd = nil, timeout = nil)
        @timeout = timeout if timeout

        @stream.open unless @stream.opened?

        if base_cmd #Check if base command is on remote host
            chk_cmd  = "if [ ! -x \"#{base_cmd.match(/\S*/)[0]}\" ]; \
                          then exit #{MAGIC_RC} 1>&2; \
                        fi"

            if @stream.exec_and_wait(chk_cmd) == MAGIC_RC
                RemotesCommand.update_remotes(@host, @remote_dir, @logger)
            end
        end

        @stream.exec(command)
        @stream.stdin.write(stdin) if stdin

        @code = @stream.wait_for_command(@timeout)

        @stdout = @stream.out
        @stderr = @stream.err

        if @code != 0
            log("Command execution fail (exit code: #{@code}): #{command}")
        end

        log(@stderr)

        return self
    end

    def close
        @stream.close
    end

    def set_forward(forward)
        @stream.forward = forward
    end
end


if $0 == __FILE__

    ssh=SshStream.new('localhost')

    ssh.open

    ssh.exec("date | tee /tmp/test.javi")
    code=ssh.wait_for_command

    puts "Code: #{code}"
    puts "output: #{ssh.out}"

    ssh.exec "cat << EOT | cat"
    ssh.stdin.puts "blah blah\nmas blah\nrequeteblah"
    ssh.stdin.puts "EOT"

    code=ssh.wait_for_command

    puts "Code: #{code}"
    puts "output: #{ssh.out}"

    code=ssh.exec_and_wait("whoami")

    puts "Code: #{code}"
    puts "output: #{ssh.out}"

    code=ssh.exec_and_wait("touch /etc/pepe.txt")

    puts "Code: #{code}"
    puts "output: #{ssh.out}"
    puts "output err: #{ssh.err}"

    ssh.close

    cssh = SshStreamCommand.new('no_host',
                                '/tmp',
                                lambda { |e| STDOUT.puts "error: #{e}" },
                                nil)
    cssh.run('whoami')
end
