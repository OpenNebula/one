module SystemMock

    def execute_cmd(cmd)
        if $capture_commands
            $capture_commands.each do |regex, output|
                if cmd.match(regex)
                    Kernel.send(:`,":;exit 0")
                    return output
                end
            end
        end
        Kernel.send(:`,cmd)
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
