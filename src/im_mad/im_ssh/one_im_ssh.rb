#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

ONE_LOCATION=ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
    ETC_LOCATION="/etc/one/"
    PROBE_LOCATION="/usr/lib/one/im_probes/"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
    ETC_LOCATION=ONE_LOCATION+"/etc/"
    PROBE_LOCATION=ONE_LOCATION+"/lib/im_probes/"
end

$: << RUBY_LIB_LOCATION

require 'pp'

require 'one_mad'
#require 'open3'
require 'digest/md5'
require 'fileutils'
require 'thread'
require 'one_ssh'

DEBUG_LEVEL=ENV["ONE_MAD_DEBUG"]

##
#  Debug constants
##
ERROR, DEBUG=[0,1]



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
        super(script)
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
            script=PROBE_LOCATION+script if script[0] != ?/
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
        
        if DEBUG_LEVEL and !DEBUG_LEVEL.empty? 
            set_logger(STDERR,DEBUG_LEVEL)
        end

        if sensors
            @sensors=sensors
        else
            @sensors=SensorList.new
        end
        
        init_actions
    end

    def action_init(args)
        STDOUT.puts "INIT SUCCESS"
        STDOUT.flush
        log("INIT SUCCESS",DEBUG)
    end
    
    def action_monitor(args)
        action=PollAction.new(args[1], args[2], @sensors)
        action.callback=lambda {|actions,number|
            result=get_result(actions, number)
            STDOUT.puts result
            STDOUT.flush
            log(result,DEBUG)
        }
        send_ssh_action(action)
    end
    
    def get_result(actions, number)
        good_results=actions.select{|s| s.ok? }
        
        if good_results.length>0
            "MONITOR SUCCESS " + number.to_s + " " + 
                good_results.collect{|s| s.value }.join(',')
        else
            bad_results=actions.select{|s| !s.ok? && s.value }
            err_text="Unknown error"
            err_text=bad_results[0].value.to_s if bad_results.length>0
            "MONITOR FAILURE " + number.to_s + " " + err_text
        end
    end
end


sensors=SensorList.new
im_conf=ARGV[0]

if !im_conf
    puts "You need to specify config file."
    exit(-1)
end

im_conf=ETC_LOCATION+im_conf if im_conf[0] != ?/
sensors.load_sensors(im_conf)

im=IM.new(sensors)

im.loop

