
require 'CommandManager'
require 'open3'

class SshStream
    attr_reader :stream_out, :stream_err, :stdin
    attr_reader :out, :err

    #
    #
    EOF_ERR = "EOF_ERR"
    EOF_OUT = "EOF_OUT"
    RC_STR  = "ExitCode: "

    EOF_CMD = "echo \"#{RC_STR}$?#{EOF_ERR}\" 1>&2; echo \"#{EOF_OUT}\""
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
        @stdin, @stdout, @stderr=Open3::popen3("#{SSH_CMD} #{@host} bash -s")

        @stream_out = ""
        @stream_err = ""

        @out = ""
        @err = ""
    end

    def close
        @stdin.puts "\nexit"

        @stdin.close  if not @stdin.closed?
        @stdout.close if not @stdout.closed?
        @stderr.close if not @stderr.closed?
    end

    def exec(command)
        @out = ""
        @err = ""

        begin
            @stdin.write "(#{command}); #{EOF_CMD}\n"
            @stdin.flush
        rescue

        end
    end

    def wait_for_command
        done_out = false
        done_err = false

        code = -1

        while not (done_out and done_err)
            rc, rw, = IO.select([@stdout, @stderr],[],[])

            rc.each { |fd|
                c = fd.read_nonblock(80)

                if !c
                    done = true
                    break
                end

                if fd == @stdout
                    @out << c
                    done_out = true if @out.slice!("#{EOF_OUT}\n")
                else
                    @err << c

                    tmp = @err.scan(/^#{RC_STR}(\d*)#{EOF_ERR}\n/)

                    if tmp[0]
                        code     = tmp[0][0].to_i
                        done_err = true

                        @err.slice!("#{EOF_ERR}\n")
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

        return @code
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

end



