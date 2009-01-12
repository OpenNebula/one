#!/usr/bin/env ruby

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'pp'
require 'one_mad'

################
# EC2 IM MAD #
################

class IM < ONEMad

    def initialize(sensors=nil)
        super(3, 4)
    end
        
    def action_init(args)
        STDOUT.puts "INIT SUCCESS"
        STDOUT.flush
    end
    
    def action_monitor(args)
        totalmemory=0;
        totalcpu=0;

        if(ENV["SMALL_INSTANCES"].to_i)
            totalmemory=totalmemory + 1048576 * 1.7 *  ENV["SMALL_INSTANCES"].to_i
            totalcpu = totalcpu + 100 * ENV["SMALL_INSTANCES"].to_i
        end

        if(ENV["LARGE_INSTANCES"].to_i)
            totalmemory=totalmemory + 1048576 * 7.5 *  ENV["LARGE_INSTANCES"].to_i
            totalcpu = totalcpu + 400 * ENV["LARGE_INSTANCES"].to_i
        end

        if(ENV["EXTRALARGE_INSTANCES"].to_i)
            totalmemory=totalmemory + 1048576 * 15 *  ENV["EXTRALARGE_INSTANCES"].to_i
            totalcpu = totalcpu + 800 * ENV["EXTRALARGE_INSTANCES"].to_i
        end

        STDOUT.puts "MONITOR SUCCESS " + args[1].to_s + 
                    "HOSTNAME=#{args[2]},TOTALMEMORY=#{totalmemory},TOTALCPU=#{totalcpu},CPUSPEED=1000,FREEMEMORY=#{totalmemory},FREECPU=#{totalcpu}"
        STDOUT.flush
    end
    
end

im=IM.new(nil)
im.loop

