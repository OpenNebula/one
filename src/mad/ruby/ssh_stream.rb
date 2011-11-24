# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
    def initialize(host)
        @host = host
    end

    def opened?
        defined?(@stdin)
    end

    def open
        @stdin, @stdout, @stderr=Open3::popen3("#{SSH_CMD} #{@host} bash -s ; echo #{SSH_RC_STR} $? 1>&2")

        @stream_out = ""
        @stream_err = ""

        @out = ""
        @err = ""
    end

    def close
        begin
            @stdin.puts "\nexit"
        rescue #rescue from EPIPE if ssh command exited already
        end

        @stdin.close  if not @stdin.closed?
        @stdout.close if not @stdout.closed?
        @stderr.close if not @stderr.closed?
    end

    def exec(command)
        @out = ""
        @err = ""

        begin
            cmd="(#{command}); #{EOF_CMD}\n"

            sliced=cmd.scan(/.{1,100}/)

            sliced.each do |slice|
                @stdin.write slice
                @stdin.flush
            end

            @stdin.puts
            @stdin.flush
        rescue

        end
    end

    def wait_for_command
        done_out = false
        done_err = false

        code = -1

        while not (done_out and done_err)
            rc, rw, re= IO.select([@stdout, @stderr],[],[])

            rc.each { |fd|
                begin
                    c = fd.read_nonblock(50)
                    next if !c
                rescue #rescue from EOF if ssh command finishes and closes fds
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

                        @err << OpenNebula.format_error_message(message)

                        done_out = true
                        done_err = true
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

        @stream_out << @out
        @stream_err << @err

        return code
    end

    def exec_and_wait(command)
        exec(command)
        wait_for_command
    end
end


class SshStreamCommand < GenericCommand
    def initialize(host, logger=nil, stdin=nil)
        @host=host
        super('true', logger, stdin)

        @stream = SshStream.new(host)
        @stream.open
    end

    def run(command, stdin=nil)
        @stream.open unless @stream.opened?

        @stream.exec(command)
        @stream.stdin.write(stdin) if stdin

        @code = @stream.wait_for_command

        @stdout = @stream.out
        @stderr = @stream.err

        if @code != 0
            log("Command execution fail: #{command}")
        end

        log(@stderr)

        return self
    end
end


if $0 == __FILE__

    ssh=SshStream.new('localhost')

    ssh.open

    ssh.exec("date | tee /tmp/test.javi")
    code=ssh.wait_for_command

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

    cssh = SshStreamCommand.new('no_host',lambda { |e| STDOUT.puts "error: #{e}" }, nil)
    cssh.run('whoami')
end
