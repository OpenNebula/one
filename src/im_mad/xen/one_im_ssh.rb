#!/usr/bin/env ruby

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    puts "ONE_LOCATION not set"
    exit -1
end

$: << ONE_LOCATION+"/lib/ruby"

require 'pp'

require 'one_mad'
#require 'open3'
require 'digest/md5'
require 'fileutils'
require 'thread'
require 'one_ssh'


####################
# SENSOR DEFINTION #
####################

class Sensor < SSHCommand
    attr_accessor :name, :script, :value, :ok, :identifier
    attr_accessor :script_hash

    # Sets remote script directory for all sensors
    def self.set_script_dir(script_dir)
        @@remote_dir=script_dir
    end

    # Constructor, takes the name of the sensor and the script that provides that sensors
    def initialize(name, script)
        @name=name || ""
        @script=script || ""
        @value=nil
        @ok=false

        gen_identifier
        @script_hash=gen_hash
    end
    
    # Runs the sensor in some host
    def run(host=nil)
        if !File.exists? @script
            STDERR.puts("Script file does not exist: "+@script.to_s)
            return
        end
        
        create_remote_dir(host)
        
        if !send_script(host)
            STDERR.puts("Can not send script to remote machine: "+host)
            @value="Can not send script to remote machine: "+host
            return
        end
        
        (stdout, stderr)=execute(host, remote_script) 
        code=get_exit_code(stderr)
        if code==0
            # Splits the output by lines, strips each line and gets only
            # lines that have something
            @value=stdout.split("\n").collect {|v| 
                v2=v.strip
                if v2==""
                    nil
                else
                    v2
                end
            }.compact.join(",")
            
            @ok=true
            if @value.length==0
                @ok=false
                @value=nil
            end
        else
            STDERR.puts("Could not execute remote script in " +
                host + ": "+remote_script)
            @value="Could not execute remote script in " +
                host + ": "+remote_script
        end
    end
    
    def create_remote_dir(host)
        execute(host, "mkdir -p " + @@remote_dir)
    end
    
    # Copies the script to the remote machine
    def send_script(host)
        # TODO: only copy when necessary
        (stdout, stderr)=exec_local_command("scp #{@script} #{host}:#{remote_script}")
        code=get_exit_code(stderr)
        
        code==0
    end
    
    # Returns the path of the script in the remote machine
    def remote_script
        @@remote_dir+"/ne_im-"+identifier
    end
    
    # Generates an unique identifier using name of the sensor and its script
    def gen_identifier
        id=@name+@script
        @identifier=Digest::MD5.hexdigest(id)
    end

    # Generates an MD5 hash of a file
    def gen_hash
        if !File.exists? @script
            STDERR.puts("Script file does not exist: "+@script.to_s)
            return nil
        else
            f=open(@script)
            data=f.read
            f.close
            return Digest::MD5.hexdigest(data)
        end 
    end
    
    def ok?
        @ok
    end
end


#################
# SENSOR LOADER #
#################

class SensorList < SSHCommandList
    def load_sensors(file)
        f=open(file, "r")
        
        f.each_line {|line|
            parse_line(line.strip)
        }
        
        f.close
    end
    
    def set_remote_dir(dir)
        Sensor.set_script_dir(dir)
    end
    
    def parse_line(line)
        # Strip coments
        l=line.gsub(/#.*$/, "")
        case l
        when ""
            return
        when /^REMOTE_DIR=/
            set_remote_dir(l.split("=")[-1].strip)
        when /^[^=]+=[^=]+$/
            (name, script)=l.split("=")
            name.strip!
            script.strip!
            script=ONE_LOCATION+"/"+script if script[0] != ?/
            self<<Sensor.new(name, script)
        else
            STDERR.puts "Malformed line in configuration file: " + line
        end
    end
end


##################
# POLLING ACTION #
##################

class PollAction < SSHAction
    def get_result
        good_results=@actions.select{|s| s.ok? }
        
        if good_results.length>0
            "MONITOR SUCCESS " + @number.to_s + " " + 
                good_results.collect{|s| s.value }.join(',')
        else
            bad_results=@actions.select{|s| !s.ok? && s.value }
            err_text="Unknown error"
            err_text=bad_results[0].value.to_s if bad_results.length>0
            "MONITOR FAILURE " + @number.to_s + " " + err_text
        end
    end
end


##########
# IM MAD #
##########

class IM < ONEMad
    include SSHActionController

    def initialize(sensors=nil)
        super(3, 4)
        
        #log_file=File.open("im.log", "w")
        #set_logger(log_file)
        
        if sensors
            @sensors=sensors
        else
            @sensors=SensorList.new
        end
        
        init_actions
    end
    
    def start_action_thread
        @action_thread=Thread.new {
            while true
                @action_mutex.lock
                done=@actions.select{|a| a.finished }
                @action_mutex.unlock

                if done.length>0
                    done.each{|a|
                        STDOUT.puts a.get_result
                        STDOUT.flush
                    }

                    @action_mutex.lock
                    @actions-=done
                    @action_mutex.unlock
                end
                sleep(1)
            end
        }
    end
    
    def action_init(args)
        STDOUT.puts "INIT SUCCESS"
        STDOUT.flush
    end
    
    def action_monitor(args)
        action=PollAction.new(args[1], args[2], @sensors)
        send_ssh_action(args[1], args[2], action)
    end
    
    #def action_finalize(args)
    #    STDOUT.puts "FINALIZE SUCCESS"
    #    exit 0
    #end
end


sensors=SensorList.new
im_conf=ARGV[0]

if !im_conf
    puts "You need to specify config file."
    exit -1
end

im_conf=ONE_LOCATION+"/"+im_conf if im_conf[0] != ?/
sensors.load_sensors(im_conf)

im=IM.new(sensors)

im.loop

