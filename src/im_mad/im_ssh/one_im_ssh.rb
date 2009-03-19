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

#-------------------------------------------------------------------------------
# This class holds the information of a IM probe and the methods to copy the
# script to the remote hosts and run it
#-------------------------------------------------------------------------------
class Sensor

    #---------------------------------------------------------------------------
    # Class constructor init the remote script name and working directory
    #---------------------------------------------------------------------------
    def initialize(name, script, remote_dir)
        id = Digest::MD5.hexdigest("#{name}#{script}")

        @script        = script
        @remote_script = "#{remote_dir}/one_im-#{id}"
        @remote_dir    = remote_dir
    end

    #---------------------------------------------------------------------------
    # Sends the monitor probe script to the remote host and execute it
    #---------------------------------------------------------------------------
    def execute(host, log_proc)
        script_text = File.read @script

        src = "'mkdir -p #{@remote_dir}; cat > #{@remote_script};" \
              " if [ \"x$?\" != \"x0\" ]; then exit -1; fi;" \
              " chmod +x #{@remote_script}; #{@remote_script}'"

        cmd = SSHCommand.run(src, host, log_proc, script_text)

        case cmd.code
        when 0
            # Splits the output by lines, strips each line and gets only
            # lines that have something
            value = cmd.stdout.split("\n").collect {|v|
                v2 = v.strip
                if v2 == ""
                    nil
                else
                    v2
                end
            }.compact.join(",")
        else
            nil
        end
    end
end


#-------------------------------------------------------------------------------
# This class is an array of sensor probes to be executed by the information
# driver. The class is built on top of the Sensor class
#-------------------------------------------------------------------------------
class SensorList < Array
    #---------------------------------------------------------------------------
    # Initialize the class
    #---------------------------------------------------------------------------
    def initialize(config_file, remote_dir)
        super(0)

        @remote_dir = remote_dir

        load_sensors(config_file)
    end

    #---------------------------------------------------------------------------
    # Execute all sensors in the list in the given host
    #---------------------------------------------------------------------------
    def execute_sensors(host, log_proc)
        results = Array.new

        self.each {|sensor|
            results << sensor.execute(host, log_proc)
        }
        results
    end

private
    #---------------------------------------------------------------------------
    # Load sensors from a configuration file
    #---------------------------------------------------------------------------
    def load_sensors(file)
        f = open(file, "r")

        f.each_line {|line|
            l = line.strip.gsub(/#.*$/, "")

            case l
            when ""
            when /^[^=]+=[^=]+$/
                (name, script)=l.split("=")

                name.strip!
                script.strip!

                script = "#{PROBE_LOCATION}#{script}" if script[0] != ?/

                self << Sensor.new(name, script, @remote_dir)
            else
                STDERR.puts "Malformed line in configuration file: #{line}"
            end
        }

        f.close
    end
end

#-------------------------------------------------------------------------------
# The SSH Information Manager Driver
#-------------------------------------------------------------------------------
class InformationManager < OpenNebulaDriver

    #---------------------------------------------------------------------------
    # Init the driver
    #---------------------------------------------------------------------------
    def initialize(config_file, remote_dir, num)
        super(num, true)

        @sensor_list=SensorList.new(config_file, remote_dir)

        # register actions
        register_action(:MONITOR, method("action_monitor"))
    end

    #---------------------------------------------------------------------------
    # Execute the sensor array in the remote host
    #---------------------------------------------------------------------------
    def action_monitor(number, host)

        results = @sensor_list.execute_sensors(host, log_method(number))

        information=results.select{|res| res && !res.empty? }.join(",")

        if information and !information.empty?
            send_message("MONITOR", RESULT[:success], number, information)
        else
            send_message("MONITOR", RESULT[:failure], number,
                "Could not monitor host #{host}.")
        end
    end

end

#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
# Information Manager main program
#-------------------------------------------------------------------------------
#-------------------------------------------------------------------------------
im_conf = ARGV.last

if !im_conf || File.exists?(im_conf)
    puts "You need to specify config file."
    exit(-1)
end

im_conf = "#{ETC_LOCATION}#{im_conf}" if im_conf[0] != ?/

if !File.exists?(im_conf)
    puts "Configuration file #{im_conf} does not exists."
    exit(-1)
end

remote_dir = ENV["IM_REMOTE_DIR"]
remote_dir = "/tmp/one-im" if !remote_dir

im = InformationManager.new(im_conf, "#{remote_dir}/", 15)
im.start_driver
