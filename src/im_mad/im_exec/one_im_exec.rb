#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    ETC_LOCATION      = '/etc/one/'
    REMOTES_LOCATION  = '/var/lib/one/remotes'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    ETC_LOCATION      = ONE_LOCATION + '/etc/'
    REMOTES_LOCATION  = ONE_LOCATION + '/var/remotes/'
end

if File.directory?(GEMS_LOCATION)
    Gem.use_paths(GEMS_LOCATION)
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'OpenNebulaDriver'
require 'getoptlong'
require 'zlib'
require 'base64'
require 'rexml/document'

# The SSH Information Manager Driver
class InformationManagerDriver < OpenNebulaDriver

    # Init the driver
    def initialize(hypervisor, options)
        @options={
            :threaded => true
        }.merge!(options)

        super('im', @options)

        @hypervisor = hypervisor

        # register actions
        register_action(:START_MONITOR, method('start_monitor'))
        register_action(:STOP_MONITOR, method('stop_monitor'))
    end

    def start_monitor(_not_used, _hostid, zaction64)
        rc, input = parse_input(:START_MONITOR, zaction64)

        return if rc == -1

        if !action_is_local?(:START_MONITOR)
            rc = update_remotes(:START_MONITOR, input[:host_id],
                                input[:hostname])

            return if rc == -1
        end

        do_action(input[:im_mad],
                  input[:host_id],
                  input[:hostname],
                  :START_MONITOR,
                  :stdin => input[:stdin],
                  :script_name => 'run_probes',
                  :zip => true,
                  :base64 => true)
    end

    def stop_monitor(_not_used, _hostid, zaction64)
        rc, input = parse_input(:STOP_MONITOR, zaction64)

        return if rc == -1

        do_action(input[:im_mad],
                  input[:host_id],
                  input[:hostname],
                  :STOP_MONITOR,
                  :script_name => 'stop_probes',
                  :stdin => input[:stdin],
                  :zip => true,
                  :base64 => true)
    end

    private

    def parse_input(msg_type, zaction64)
        zaction = Base64.decode64(zaction64)
        action  = Zlib::Inflate.inflate(zaction)

        action_xml = REXML::Document.new(action).root
        host_xml   = action_xml.elements['HOST']
        config_xml = action_xml.elements['MONITOR_CONFIGURATION']

        hostname = host_xml.elements['NAME'].text.to_s
        im_mad   = host_xml.elements['IM_MAD'].text.to_s
        host_id  = host_xml.elements['ID'].text.to_s

        hid_elem = REXML::Element.new 'HOST_ID'
        hid_elem.add_text(host_id)

        config_xml.add_element(hid_elem)

        [0, {:im_mad   => im_mad,
             :host_id  => host_id,
             :hostname => hostname,
             :stdin    => config_xml.to_s}]

    rescue StandardError => e
        msg = Zlib::Deflate.deflate(e.message, Zlib::BEST_COMPRESSION)
        msg = Base64.strict_encode64(msg)

        send_message(msg_type, RESULT[:failure], host_id, msg)

        [-1, {}]
    end

    def update_remotes(action, hostid, hostname)
        # Recreate dir for remote scripts
        mkdir_cmd = "mkdir -p #{@remote_scripts_base_path}"

        cmd = SSHCommand.run(mkdir_cmd, hostname, log_method(hostid))

        if cmd.code != 0
            msg = Zlib::Deflate.deflate('Could not update remotes',
                                        Zlib::BEST_COMPRESSION)
            msg = Base64.strict_encode64(msg)

            send_message(action, RESULT[:failure], hostid, msg)
            return -1
        end

        # Use SCP to sync:
        #sync_cmd = "scp -r #{@local_scripts_base_path}/* " \
        #    "#{hostname}:#{@remote_scripts_base_path}"

        # Use rsync to sync:
        sync_cmd = "rsync -Laz --delete #{@local_scripts_base_path}" \
                   " #{hostname}:#{@remote_scripts_base_path}"

        cmd = LocalCommand.run(sync_cmd, log_method(hostid))

        if cmd.code != 0
            msg = Zlib::Deflate.deflate('Could not update remotes',
                                        Zlib::BEST_COMPRESSION)
            msg = Base64.strict_encode64(msg)

            send_message(action, RESULT[:failure], hostid, msg)
            return -1
        end

        0
    end

    # Sends a log message to ONE. The +message+ can be multiline, it will
    # be automatically splitted by lines.
    def log(id, message, not_used=true)
        in_error = false
        msg      = message.strip
        severity = 'I'

        msg.each_line do |line|
            l = line.strip

            if l == 'ERROR MESSAGE --8<------'
                in_error = true
                next
            elsif l == 'ERROR MESSAGE ------>8--'
                in_error = false
                next
            else
                m = line.match(/^(ERROR|DEBUG|INFO):(.*)$/)

                if in_error
                    severity = 'E'
                elsif m
                    line = m[2]

                    case m[1]
                    when 'ERROR'
                        severity = 'E'
                    when 'DEBUG'
                        severity = 'D'
                    when 'INFO'
                        severity = 'I'
                    else
                        severity = 'I'
                    end
                end
            end

            zline   = Zlib::Deflate.deflate(line.strip, Zlib::BEST_COMPRESSION)
            zline64 = Base64.strict_encode64(zline)

            send_message('LOG', severity, id, zline64)
        end
    end

end

# Information Manager main program

opts = GetoptLong.new(
    ['--retries',    '-r', GetoptLong::OPTIONAL_ARGUMENT],
    ['--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT],
    ['--local',      '-l', GetoptLong::NO_ARGUMENT],
    ['--force-copy', '-c', GetoptLong::NO_ARGUMENT],
    ['--timeout',    '-w', GetoptLong::OPTIONAL_ARGUMENT]
)

hypervisor    = ''
retries       = 0
threads       = 15
local_actions = {}
force_copy    = false
timeout       = nil

begin
    opts.each do |opt, arg|
        case opt
        when '--retries'
            retries = arg.to_i
        when '--threads'
            threads = arg.to_i
        when '--local'
            local_actions={ 'START_MONITOR' => nil, 'STOP_MONITOR' => nil }
        when '--force-copy'
            force_copy=true
        when '--timeout'
            timeout = arg.to_i
        end
    end
rescue StandardError
    exit(-1)
end

if ARGV.length >= 1
    hypervisor = ARGV.shift
end

im = InformationManagerDriver.new(hypervisor,
                                  :concurrency => threads,
                                  :retries => retries,
                                  :local_actions => local_actions,
                                  :force_copy => force_copy,
                                  :timeout => timeout)
im.start_driver
