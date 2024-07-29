# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'shellwords'

module OpenNebula

    # Generic log function
    def self.log_function(severity, message)
        STDERR.puts "#{severity}: #{File.basename $0}: #{message}"
    end

    # Logs an info message
    def self.log_info(message)
        log_function("INFO", message)
    end

    # Logs an info message
    def self.log_warning(message)
        log_function('WARNING', message)
    end

    # Logs an error message
    def self.log_error(message)
        log_function("ERROR", message)
    end

    # Logs a debug message
    def self.log_debug(message)
        log_function("DEBUG", message)
    end

    # Alias log to log_info in the singleton class
    class << self
        alias :log :log_info
    end

    # This function is used to pass error message to the mad
    def self.error_message(message)
        STDERR.puts message
    end

    def self.is_disk?(arg)
        arg.match("disk\.[0-9]+$")
    end

    # Gets the host from an argument
    def self.arg_host(arg)
        result = arg.match("^\([^:]*\):.*$")

        return result[1] if result
    end

    def self.arg_path(arg)
        result = arg.match('^[^:]*:(.*)$')

        return result[1] if result
    end

    # Executes a command, if it fails returns error message and exits
    # If a second parameter is present it is used as the error message when
    # the command fails
    def self.exec_and_log(command, message=nil, allowed_return_code=0)
        command = command.shellsplit.shelljoin # escape
        output=`#{command} 2>&1 1>/dev/null`
        code=$?.exitstatus

        if code!=0 && code!=allowed_return_code
            log_error "Command \"#{command}\" failed."
            log_error output
            if !message
                error_message output
            else
                error_message message
            end
            exit code
        end
        log "Executed \"#{command}\"."
    end

    def self.send_to_monitor(msg_type, result, oid, data)
        # Read monitord.conf
        one_location = ENV['ONE_LOCATION']

        if !one_location
            file_dir = '/etc/one/'
        else
            file_dir = one_location + '/etc/'
        end

        file_name = 'monitord.conf'

        begin
            require 'augeas'

            aug = Augeas.create(:no_modl_autoload => true,
                :no_load          => true,
                :root             => file_dir,
                :loadpath         => file_name)

            aug.clear_transforms
            aug.transform(:lens => 'Oned.lns', :incl => file_name)
            aug.context = "/files/#{file_name}"
            aug.load

            mon_address = aug.get('NETWORK/MONITOR_ADDRESS')
            mon_port    = aug.get('NETWORK/PORT')
            mon_key     = aug.get('NETWORK/PUBKEY').tr('"', '')

            mon_address = "127.0.0.1" if mon_address.include? "auto"
        rescue LoadError
            mon_address = "127.0.0.1"
            mon_port    = 4124
        end

        # Encrypt
        if mon_key && !mon_key.empty?
            block_size = mon_key.n.num_bytes - 11

            edata = ''
            index = 0

            loop do
                break if index >= data.length

                edata << mon_key.public_encrypt(data[index, block_size])

                index += block_size
            end

            data = edata
        end

        # Send data
        begin
            require 'base64'
            require 'zlib'
            require 'socket'

            zdata  = Zlib::Deflate.deflate(data, Zlib::BEST_COMPRESSION)
            data64 = Base64.strict_encode64(zdata)

            if (result == "SUCCESS" || result == "0")
                result = "SUCCESS"
            else
                result = "FAILURE"
            end

            if Integer(oid) == -1
                ts = 0
            else
                ts = Time.now.to_i
            end

            msg = "#{msg_type} #{result} #{oid} #{ts} #{data64}"

            socket_udp = UDPSocket.new()
            socket_udp.send(msg, 0, mon_address, mon_port)
        rescue LoadError
            STDERR.puts('Unable to send data to Monitor Daemon')
        end
    end
end
