#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                #
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
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    ETC_LOCATION      = ONE_LOCATION + '/etc/'
end

if File.directory?(GEMS_LOCATION)
    $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }
    require 'rubygems'
    Gem.use_paths(File.realpath(GEMS_LOCATION))
end

$LOAD_PATH << RUBY_LIB_LOCATION

require 'OpenNebulaDriver'
require 'getoptlong'
require 'rubygems'
require 'ffi-rzmq'
require 'base64'
require 'nokogiri'

# HookManagerDriver class
class HookManagerDriver < OpenNebulaDriver

    # --------------------------------------------------------------------------
    # Default configuration options for the driver
    # --------------------------------------------------------------------------
    DEFAULT_CONF = {
        :concurrency => 15,
        :threaded    => false,
        :retries     => 0,
        :publisher_port => 2101,
        :logger_port    => 2102,
        :hwm  => nil, # http://zguide.zeromq.org/page:all#High-Water-Marks
        :bind => '127.0.0.1'
    }

    def initialize(options)
        @options = DEFAULT_CONF.merge(options)
        @options[:concurrency] = 1 # Only on thread using the publisher socket

        super('', @options)

        register_action(:EXECUTE, method('action_execute'))
        register_action(:RETRY, method('action_retry'))

        # Initialize sockets and listener
        context = ZMQ::Context.new(1)

        @publisher = context.socket(ZMQ::PUB)
        @publisher.setsockopt(ZMQ::SNDHWM, @options[:hwm]) if @options[:hwm]
        @publisher.bind("tcp://#{@options[:bind]}:#{@options[:publisher_port]}")

        @replier = context.socket(ZMQ::REP)
        @replier.bind("tcp://#{@options[:bind]}:#{@options[:logger_port]}")

        Thread.new do
            receiver_thread
        end
    end

    def action_execute(*arguments)
        begin
            arg_xml = Nokogiri::XML(Base64.decode64(arguments.flatten[0]))
            type    = arg_xml.xpath('//HOOK_TYPE').text

            key(type, arg_xml).each do |key|
                m_key = "EVENT #{key}"

                # Using envelopes for splitting key/val
                # http://zguide.zeromq.org/page:all#Pub-Sub-Message-Envelopes
                send_string(@publisher, m_key, ZMQ::SNDMORE)
                send_string(@publisher, arguments.flatten[0])
            end
        rescue StandardError => e
            log(0, "ERROR: #{e.message}")
        end
    end

    def action_retry(*arguments)
        begin
            arguments.flatten!

            command = arguments[0]
            params  = arguments[1]

            m_key = 'RETRY'
            m_val = "#{command} #{params}"

            send_string(@publisher, m_key, ZMQ::SNDMORE)
            send_string(@publisher, m_val)
        rescue StandardError => e
            log(0, "ERROR: #{e.message}")
        end
    end

    def receiver_thread
        Kernel.loop do
            message = ''

            @replier.recv_string(message)
            @replier.send_string('ACK')

            message = message.split(' ')
            hook_rc = message.shift.to_i
            hook_id = message.shift.to_i

            if hook_rc.zero?
                result = RESULT[:success]
            else
                result = RESULT[:failure]
            end

            send_message('EXECUTE', result, hook_id,
                         "#{hook_rc} #{message.flatten.join(' ')}")
        end
    end

    #---------------------------------------------------------------------------
    #  Helpers
    #---------------------------------------------------------------------------

    def key(type, xml)
        case type.to_sym
        when :API
            call    = xml.xpath('//CALL')[0].text
            success = xml.xpath('//CALL_INFO/RESULT')[0].text

            ["API #{call} #{success}"]
        when :STATE
            obj         = xml.xpath('//HOOK_OBJECT')[0].text
            state       = xml.xpath('//STATE')[0].text
            lcm_state   = xml.xpath('//LCM_STATE')[0].text if obj == 'VM'
            resource_id = xml.xpath('//RESOURCE_ID')[0].text
            service_id  = xml.xpath('//SERVICE_ID')[0]
            service_id  = service_id.text if service_id

            ret = ["#{obj} #{resource_id}/#{state}/#{lcm_state} ",
                   "STATE #{obj}/#{state}/#{lcm_state}/#{resource_id} "]

            ret << "SERVICE #{service_id} " if service_id

            ret
        else
            ['']
        end
    end

    def send_string(socket, content, flag = nil)
        rc = 0

        if flag.nil?
            rc = socket.send_string(content)
        else
            rc = socket.send_string(content, flag)
        end

        return unless rc < 0

        msg = "ERROR: failure sending string: #{ZMQ::Util.error_string}" \
              " (#{ZMQ::Util.errno})"
        log(0, msg)
    end

end

#-------------------------------------------------------------------------------
# Hook Manager main program
#-------------------------------------------------------------------------------
opts = GetoptLong.new(
    ['--threads',        '-t', GetoptLong::OPTIONAL_ARGUMENT],
    ['--publisher-port', '-p', GetoptLong::OPTIONAL_ARGUMENT],
    ['--logger-port',    '-l', GetoptLong::OPTIONAL_ARGUMENT],
    ['--hwm',            '-h', GetoptLong::OPTIONAL_ARGUMENT],
    ['--bind',           '-b', GetoptLong::OPTIONAL_ARGUMENT]
)

arguments = {}

begin
    opts.each do |opt, arg|
        case opt
        when '--threads'
            arguments[:concurrency] = arg.to_i
        when '--publisher-port'
            arguments[:publisher_port] = arg.to_i
        when '--logger-port'
            arguments[:logger_port] = arg.to_i
        when '--hwm'
            arguments[:hwm] = arg.to_i
        when '--bind'
            arguments[:bind] = arg
        end
    end
rescue StandardError
    exit(-1)
end

hm = HookManagerDriver.new(arguments)

hm.start_driver
