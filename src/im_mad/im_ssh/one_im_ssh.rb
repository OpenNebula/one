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
require 'digest/md5'
require 'fileutils'
require 'OpenNebulaDriver'
require 'CommandManager'

DEBUG_LEVEL=ENV["ONE_MAD_DEBUG"]

##
#  Debug constants
##
ERROR, DEBUG=[0,1]

# This class holds the information of a IM probe and the methods
# to copy the script to the remote hosts and run it
class Sensor
    attr_accessor   :remote_dir
    attr_reader     :name, :script
    
    def initialize(name, script)
        @name=name
        @script=script
        
        gen_identifier
    end
    
    def execute(host, log_proc)
        script_text=File.read @script
        scr="'mkdir -p #{remote_dir};cat > #{remote_script};if [ \"x$?\" != \"x0\" ]; then exit 42;fi;chmod +x #{remote_script};#{remote_script}'"
        
        cmd=SSHCommand.run(scr, host, log_proc, script_text)
        case cmd.code
        when 0
            # Splits the output by lines, strips each line and gets only
            # lines that have something
            value=cmd.stdout.split("\n").collect {|v| 
                v2=v.strip
                if v2==""
                    nil
                else
                    v2
                end
            }.compact.join(",")
            
        when 42
            log_proc.call("Can not send script to remote machine: "+host)
            nil
        else
            value="Could not execute remote script in " +
                host + ": "+remote_script
            log_proc.call(value)
            nil
        end
    end

    def execute_old(host, log_proc)
        if send_script(host, log_proc)
            cmd=SSHCommand.run(@script, host, log_proc)
            if cmd.code==0
                # Splits the output by lines, strips each line and gets only
                # lines that have something
                value=cmd.stdout.split("\n").collect {|v| 
                    v2=v.strip
                    if v2==""
                        nil
                    else
                        v2
                    end
                }.compact.join(",")
            else
                value="Could not execute remote script in " +
                    host + ": "+remote_script
                log_proc.call(value)
                nil
            end
        else
            nil
        end
    end
    
private

    def send_script(host, log_proc)
        cmd=LocalCommand.run("scp #{script} #{host}:#{@remote_dir}")
        if cmd.code==0
            true
        else
            log_proc.call("Can not send script to remote machine: "+host)
            false
        end
    end
    
    # Generates an unique identifier using name of the sensor and its script
    def gen_identifier
        id=@name+@script
        @identifier=Digest::MD5.hexdigest(id)
    end
    
    # Returns the path of the script in the remote machine
    def remote_script
        @remote_dir+"/ne_im-"+@identifier
    end
    
end


class SensorList < Array
    def initialize(config_file=nil)
        super(0)
        
        @remote_dir='/tmp/ne_im_scripts'
        
        load_sensors(config_file) if config_file
    end
    
    def execute_sensors(host, log_proc)
        results=Array.new
        self.each {|sensor|
            results<<sensor.execute(host, log_proc)
        }
        results
    end
    
private

    # Load sensors from a configuration file
    def load_sensors(file)
        f=open(file, "r")
    
        f.each_line {|line|
            parse_line(line.strip)
        }
    
        f.close
        
        set_remote_dir(@remote_dir)
    end
    
    # Sets the directory where to put scripts in the remote machine
    def set_remote_dir(dir)
        self.each {|sensor| sensor.remote_dir=dir }
    end

    # Parses one line of the configuration file
    def parse_line(line)
        # Strip coments
        l=line.gsub(/#.*$/, "")
        case l
        when ""
            return
        when /^REMOTE_DIR\s*=/
            @remote_dir=l.split("=")[-1].strip
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


class InformationManager < OpenNebulaDriver

    def initialize(config_file, num)
        super(num, true)
        
        @sensor_list=SensorList.new(config_file)
        
        # register actions
        register_action(:MONITOR, method("action_monitor"))
    end
    
    def action_monitor(number, host)
        results=@sensor_list.execute_sensors(host, log_method(number))
        information=results.select{|res| res && !res.empty? }.join(",")
        if information and !information.empty?
            send_message("MONITOR", RESULT[:success], number, information)
        else
            send_message("MONITOR", RESULT[:failure], number,
                "Could not monitor host #{host}.")
        end
    end

end

im_conf=ARGV[0]

if !im_conf
    puts "You need to specify config file."
    exit(-1)
end

im_conf=ETC_LOCATION+im_conf if im_conf[0] != ?/

im=InformationManager.new(im_conf, 15)
im.start_driver
