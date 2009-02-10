

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    ETC_LOCATION="/etc/one/"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require 'OpenNebulaDriver'
require 'CommandManager'
require 'TMScript'


class TransferManager < OpenNebulaDriver

    def initialize(plugin, num)
        super(num, true)
        
        @plugin=plugin
        
        # register actions
        register_action(:TRANSFER, method("action_transfer"))
    end
    
    def action_transfer(number, script_file)
        script_text=""
        
        log(number, script_file)
        
        if File.exist?(script_file)
            open(script_file) {|f|
                script_text=f.read
            }
        
            script=TMScript.new(script_text, log_method(number))
            res=script.execute(@plugin)
        
            if res[0]
                send_message("TRANSFER", "SUCCESS", number)
            else
                send_message("TRANSFER", "FAILURE", number, res[1])
            end
        else
            send_message("TRANSFER", "FAILURE", number, 
                "Transfer file not found: #{script_file}")
        end
    end

end

tm_conf=ARGV[0]

if !tm_conf
    puts "You need to specify config file."
    exit(-1)
end

tm_conf=ETC_LOCATION+tm_conf if tm_conf[0] != ?/

plugin=TMPlugin.new(tm_conf)

tm=TransferManager.new(plugin, 15)
tm.start_driver




