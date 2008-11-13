#!/usr/bin/env ruby

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    puts "ONE_LOCATION not set"
    exit(-1)
end

$: << ONE_LOCATION+"/lib/ruby"

require 'pp'
require 'one_mad'
require 'ThreadScheduler'
require 'TMScript'

class TM < ONEMad
    def initialize(plugin)
        @thread_scheduler=ThreadScheduler.new(10)
        @plugin=plugin
        
        # Messages with 3 input elements and 4 output elements:
        #
        # in: TRANSFER 65 /something/var/65/tmscript.0
        # out: TRANSFER 65 FAILURE error message
        super(3,4)
        
        set_logger(STDERR, 1)
    end
    
    def action_init(args)
        STDOUT.puts "INIT SUCCESS"
        STDOUT.flush
        log("INIT SUCCESS",DEBUG)
    end
    
    def action_transfer(args)
        number=args[1]
        script_file=args[2]
        script_text=""
        
        # Create the lambda that will be used to log
        mad_logger=lambda {|message|
            mad_log("TRANSFER", number, message)
        }
        
        open(script_file) {|f|
            script_text=f.read
        }
        
        script=TMScript.new(script_text, mad_logger)
        @thread_scheduler.new_thread {
            res=script.execute(@plugin)
            if res[0]
                send_message("TRANSFER", "SUCCESS", number)
            else
                send_message("TRANSFER", "FAILURE", number, res[1])
            end
        }
    end
    
    def action_finalize(args)
        @thread_scheduler.shutdown
        super(args)
    end
    
end

tm_conf=ARGV[0]

if !tm_conf
    puts "You need to specify config file."
    exit(-1)
end

tm_conf=ONE_LOCATION+"/"+tm_conf if tm_conf[0] != ?/

plugin=TMPlugin.new(tm_conf)

tm=TM.new(plugin)

tm.loop


