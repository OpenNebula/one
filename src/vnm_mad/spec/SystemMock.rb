module SystemMock
    require 'open3'
    def execute_cmd(cmd)
        if $capture_commands
            $capture_commands.each do |regex, output|
                if cmd.match(regex)
                    return output
                end
            end
        end
        Open3.popen3(cmd){|stdin, stdout, stderr| stdout.read}
    end

    def `(cmd)
        log_command(:backtick, cmd)
        execute_cmd(cmd)
    end

    def system(cmd)
        log_command(:system, cmd)
        execute_cmd(cmd)
        nil
    end

    def log_command(facility, msg)
        $collector = Hash.new if !$collector
        $collector[facility] = Array.new if !$collector[facility]
        $collector[facility] << msg
    end
end
