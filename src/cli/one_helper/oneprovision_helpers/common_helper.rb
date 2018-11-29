# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
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

require 'yaml'
require 'erb'
require 'nokogiri'
require 'open3'
require 'tempfile'
require 'highline'
require 'highline/import'
require 'tmpdir'
require 'json'
require 'logger'
require 'base64'
require 'securerandom'

ENCRYPT_VALUES = ["PACKET_TOKEN", "EC2_SECRET", "EC2_ACCESS"]

class OneProvisionCleanupException < Exception
end

class OneProvisionLoopException < Exception
    attr_reader :text

    def initialize(text=nil)
        @text = text
    end
end

class CommonHelper < OpenNebulaHelper::OneHelper
    ERROR_OPEN  = "ERROR MESSAGE --8<------"
    ERROR_CLOSE = "ERROR MESSAGE ------>8--"

    def self.rname
        "ONEPROVISION"
    end

    def validate_configuration(config, options)
        config = read_config(config)

        config = config.delete_if { |k, v| v.nil? }

        check_config(config)

        puts config.to_yaml if options.has_key? :dump
    end

    def check_config(config)
        fail('There is an error in your configuration file: no name given') if config['name'].nil? && config['version'] == 2
        fail('There is an error in your configuration file: defaults provision is missing') if config['defaults']['provision'].nil?

        if config['hosts']
            config['hosts'].each_with_index do |h, i|
                fail("There is an error in your configuration file: there is no im_mad in host #{i + 1}") if h['im_mad'].nil?
                fail("There is an error in your configuration file: there is no vm_mad in host #{i + 1}") if h['vm_mad'].nil?
                fail("There is an error in your configuration file: there is no hostname in host #{i + 1}") if h['provision']['hostname'].nil?
            end
        end

        if config['datastores']
            config['datastores'].each_with_index do |d, i|
                fail("There is an error in your configuration file: there is no tm_mad in datastore #{i + 1}") if d['tm_mad'].nil?
            end
        end
    end

    def create_config(yaml, update=false)
        begin
            check_config(yaml)

            yaml['cluster'] = {'name' => yaml['name']} if (yaml['cluster'].nil? && !update)

            #TODO: schema check

            if yaml['hosts']
                yaml['hosts'] = yaml['hosts'].map do |host|
                    ['connection', 'provision', 'configuration'].each do |section|
                        data = CONFIG_DEFAULTS[section] || {}
                        # merge defaults with globals and device specific params
                        data.merge!(yaml['defaults'][section]) unless yaml['defaults'][section].nil?
                        data.merge!(host[section]) unless host[section].nil?

                        host[section] = data
                    end

                    host
                end
            end

            ['datastores', 'networks'].each do |r|
                if yaml[r]
                    yaml[r] = yaml[r].map do |x|
                        x['provision'] = yaml['defaults']['provision']
                        x
                    end
                end
            end

            yaml['cluster']['provision'] = yaml['defaults']['provision'] if !update
        rescue Exception => e
            fail("Failed to read configuration: #{e.to_s}")
        end

        yaml
    end

    def read_config(name)
        begin
            yaml = YAML.load_file(name)
        rescue Exception => e
            fail("Failed to read template: #{e.to_s}")
        end

        if yaml['extends']
            base = read_config(yaml['extends'])

            yaml.delete('extends')
            base['defaults'] ||= {}
            yaml['defaults'] ||= {}

            # replace scalars or append array from child YAML
            yaml.each do |key, value|
                next if key == 'defaults'

                if (value.is_a? Array) && (base[key].is_a? Array)
                    base[key].concat(value)
                else
                    base[key] = value
                end
            end

            # merge each defaults section separately
            ['connection', 'provision', 'configuration'].each do |section|
                base['defaults'][section] ||= {}
                yaml['defaults'][section] ||= {}

                base['defaults'][section].merge!(yaml['defaults'][section])
            end

            return base
        else
            return yaml
        end
    end

    def get_erb_value(provision, value)
        template = ERB.new value
        ret = template.result(provision.get_binding)

        if ret.empty?
            raise "#{value} not found."
        else
            ret
        end
    end

    def evaluate_erb(provision, root)
        if root.is_a? Hash
            root.each_pair do |key, value|
                if value.is_a? Array
                    root[key] = value.map do |x| evaluate_erb(provision, x) end
                elsif value.is_a? Hash
                    root[key] = evaluate_erb(provision, value)
                elsif value.is_a? String
                    if value =~ /<%= /
                        root[key] = get_erb_value(provision, value)
                    end
                end
            end
        else
            root = root.map do |x| evaluate_erb(provision, x) end
        end

        root
    end

    def try_read_file(name)
        begin
            File.read(name).strip
        rescue
            name
        end
    end

    def create_deployment_file(host, provision_id)
        Nokogiri::XML::Builder.new { |xml|
            xml.HOST do
                xml.NAME "provision-#{SecureRandom.hex(24)}"
                xml.TEMPLATE do
                    xml.IM_MAD host['im_mad']
                    xml.VM_MAD host['vm_mad']
                    xml.PM_MAD host['provision']['driver']
                    xml.PROVISION do
                        host['provision'].each { |key, value|
                            if key != 'driver'
                                xml.send(key.upcase, encrypt(key.upcase, value))
                            end
                        }
                        xml.send("PROVISION_ID", provision_id)
                    end
                    if host['configuration']
                        xml.PROVISION_CONFIGURATION_BASE64 Base64.strict_encode64(host['configuration'].to_yaml)
                    end
                    xml.PROVISION_CONFIGURATION_STATUS 'pending'
                    if host['connection']
                        xml.PROVISION_CONNECTION do
                            host['connection'].each { |key, value|
                                xml.send(key.upcase, value)
                            }
                        end
                    end
                    if host['connection']
                        xml.CONTEXT do
                            if host['connection']['public_key']
                                xml.SSH_PUBLIC_KEY try_read_file(host['connection']['public_key'])
                            end
                        end
                    end
                end
            end
        }.doc.root
    end

    def get_mode(options)
        $logger = Logger.new(STDERR)

        $logger.formatter = proc do |severity, datetime, progname, msg|
            "#{datetime.strftime("%Y-%m-%d %H:%M:%S")} #{severity.ljust(5)} : #{msg}\n"
        end

        if options.has_key? :debug
            $logger.level = Logger::DEBUG
        elsif options.has_key? :verbose
            $logger.level = Logger::INFO
        else
            $logger.level = Logger::UNKNOWN
        end

        $RUN_MODE = :batch if options.has_key? :batch

        $PING_TIMEOUT = options[:ping_timeout] if options.has_key? :ping_timeout
        $PING_RETRIES = options[:ping_retries] if options.has_key? :ping_retries
        $THREADS = options[:threads] if options.has_key? :threads

        if options.has_key? :fail_cleanup
            $FAIL_CHOICE = :cleanup
        elsif options.has_key? :fail_retry
            $FAIL_CHOICE = :retry
            $MAX_RETRIES = options[:fail_retry].to_i
        elsif options.has_key? :fail_skip
            $FAIL_CHOICE = :skip
        elsif options.has_key? :fail_quit
            $FAIL_CHOICE = :quit
        end
    end

    def retry_loop(text, cleanup=$CLEANUP, &block)
        retries = 0

        begin
            block.call
        rescue OneProvisionLoopException => e
            STDERR.puts "ERROR: #{text}\n#{e.text}"

            retries += 1

            exit(-1) if retries > $MAX_RETRIES && $RUN_MODE == :batch

            choice = $FAIL_CHOICE

            if $RUN_MODE == :interactive
                begin
                    $mutex.synchronize do
                        cli = HighLine.new($stdin, $stderr)

                        choice = cli.choose do |menu|
                            menu.prompt = "Choose failover method:"
                            menu.choices(:quit, :retry, :skip)
                            menu.choices(:cleanup) if cleanup
                            menu.default = choice
                        end
                    end
                rescue EOFError
                    STDERR.puts choice
                rescue Interrupt => e
                    exit(-1)
                end
            end

            if choice == :retry
                retry
            elsif choice == :quit
                exit(-1)
            elsif choice == :skip
                return nil
            elsif choice == :cleanup
                if cleanup
                    raise OneProvisionCleanupException
                else
                    fail('Cleanup unsupported for this operation')
                end
            end

            exit(-1)
        end
    end

    def run(*cmd, &block)
        $logger.debug("Command run: #{cmd.join(' ')}")

        rtn = nil

        begin
            if Hash === cmd.last
                opts = cmd.pop.dup
            else
                opts = {}
            end

            stdin_data = opts.delete(:stdin_data) || ''
            binmode = opts.delete(:binmode)

            Open3.popen3(*cmd, opts) {|i, o, e, t|
                if binmode
                    i.binmode
                    o.binmode
                    e.binmode
                end

                out_reader = Thread.new {o.read}
                err_reader = Thread.new {e.read}

                begin
                    i.write stdin_data
                rescue Errno::EPIPE
                end

                begin
                    i.close
                rescue IOError => e
                end

                rtn = [out_reader.value, err_reader.value, t.value]
            }

            $mutex.synchronize do
                if rtn
                    $logger.debug("Command STDOUT: #{rtn[0].strip}") unless rtn[0].empty?
                    $logger.debug("Command STDERR: #{rtn[1].strip}") unless rtn[1].empty?

                    if rtn[2].success?
                        $logger.debug("Command succeeded")
                    else
                        $logger.warn("Command FAILED (code=#{rtn[2].exitstatus}): #{cmd.join(' ')}")
                    end
                else
                    $logger.error("Command failed on unknown error")
                end
            end
        rescue Interrupt
            fail('Command interrupted')
        rescue Exception => e
            $logger.error("Command exception: #{e.message}")
        end

        rtn
    end

    def pm_driver_action(pm_mad, action, args, host = nil)
        $host_helper.check_host(pm_mad)

        cmd = ["#{REMOTES_LOCATION}/pm/#{pm_mad}/#{action}"]

        args.each do |arg|
            cmd << arg
        end

        # action always gets host ID/name if host defined, same as for VMs:
        # https://github.com/OpenNebula/one/blob/d95b883e38a2cee8ca9230b0dbef58ce3b8d6d6c/src/mad/ruby/OpenNebulaDriver.rb#L95
        $mutex.synchronize do
            unless host.nil?
                cmd << host.id
                cmd << host.name
            end
        end

        unless File.executable? cmd[0]
            $logger.error("Command not found or not executable #{cmd[0]}")
            fail('Driver action script not executable')
        end

        o = nil

        retry_loop "Driver action '#{cmd[0]}' failed" do
            o, e, s = run(cmd.join(' '))

            unless s && s.success?
                err = get_error_message(e)

                text = err.lines[0].strip if err
                text = 'Unknown error' if text == '-'

                raise OneProvisionLoopException.new(text)
            end
        end

        o
    end

    #TODO: handle exceptions?
    def write_file_log(name, content)
        $mutex.synchronize do
            $logger.debug("Creating #{name}:\n" + content)
        end

        f = File.new(name, "w")
        f.write(content)
        f.close
    end

    def fail(text, code=-1)
        STDERR.puts "ERROR: #{text}"
        exit(code)
    end

    def get_error_message(text)
        msg = '-'

        if text
            tmp = text.scan(/^#{ERROR_OPEN}\n(.*?)#{ERROR_CLOSE}$/m)
            msg = tmp[0].join(' ').strip if tmp[0]
        end

        msg
    end

    def template_like_str(attributes, indent=true)
        if indent
            ind_enter="\n"
            ind_tab='  '
        else
            ind_enter=''
            ind_tab=' '
        end

        str=attributes.collect do |key, value|
            if value
                str_line=""
                if value.class==Array

                    value.each do |value2|
                        str_line << key.to_s.upcase << "=[" << ind_enter
                        if value2 && value2.class==Hash
                            str_line << value2.collect do |key3, value3|
                                str = ind_tab + key3.to_s.upcase + "="
                                str += "\"#{encrypt(key3.to_s.upcase, value3.to_s)}\"" if value3
                                str
                            end.compact.join(",\n")
                        end
                        str_line << "\n]\n"
                    end

                elsif value.class==Hash
                    str_line << key.to_s.upcase << "=[" << ind_enter

                    str_line << value.collect do |key3, value3|
                        str = ind_tab + key3.to_s.upcase + "="
                        str += "\"#{encrypt(key3.to_s.upcase, value3.to_s)}\"" if value3
                        str
                    end.compact.join(",\n")

                    str_line << "\n]\n"

                else
                    str_line << key.to_s.upcase << "=" << "\"#{encrypt(key.to_s.upcase, value.to_s)}\""
                end
                str_line
            end
        end.compact.join("\n")

        str
    end

    def encrypt(key, value)
        if ENCRYPT_VALUES.include? key
            system = OpenNebula::System.new(@client)
            config = system.get_configuration
            token = config["ONE_KEY"]

            OpenNebula.encrypt({:value => value}, token)[:value]
        else
            value
        end
    end
end
