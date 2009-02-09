
require 'OpenNebulaDriver'
require 'CommandManager'

class TestDriver < OpenNebulaDriver
    def initialize(num)
        super(num, true)
        
        register_action(:SLEEP_LOCAL,method("my_sleep_ssh"))
        register_action(:SLEEP_SSH,method("my_sleep_ssh"))
        
    end

    def my_sleep_local(timeout, num)
        log(num,"Sleeping #{timeout} seconds")
        
        command=LocalCommand.new("sleep #{timeout}", log_method(num))
        command.run
        
        log(num,"Done with #{num}")

        send_message("SLEEP",RESULT[:success],num.to_s)
    end

    def my_sleep_ssh(host, timeout, num)
        log(num,"Sleeping #{timeout} seconds (remote)")
        
        command=SSHCommand.new("sleep #{timeout}", host, log_method(num))
        command.run
        
        log(num,"Done with #{num}")

        send_message("SLEEP",RESULT[:success],num.to_s)
    end
end


sd = TestDriver.new(15)
sd.start_driver
