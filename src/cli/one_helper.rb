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

require 'cli_helper'
require 'open3'
require 'io/console'
require 'time'
require 'io/wait'

begin
    require 'opennebula'
rescue Exception => e
    puts 'Error: '+e.message.to_s
    exit(-1)
end

include OpenNebula

module OpenNebulaHelper

    ONE_VERSION=<<~EOT
        OpenNebula #{OpenNebula::VERSION}
        Copyright 2002-2024, OpenNebula Project, OpenNebula Systems
    EOT

    if ONE_LOCATION
        TABLE_CONF_PATH     = ONE_LOCATION + '/etc/cli'
        VAR_LOCATION        = ONE_LOCATION + '/var' unless defined?(VAR_LOCATION)
        CLI_ADDONS_LOCATION = ONE_LOCATION + '/lib/ruby/cli/addons'
        XSD_PATH            = ONE_LOCATION + '/share/schemas/xsd'
    else
        TABLE_CONF_PATH     = '/etc/one/cli'
        VAR_LOCATION        = '/var/lib/one' unless defined?(VAR_LOCATION)
        CLI_ADDONS_LOCATION = '/usr/lib/one/ruby/cli/addons'
        XSD_PATH            = '/usr/share/one/schemas/xsd'
    end

    EDITOR_PATH='/usr/bin/vi'

    TEMPLATE_INPUT = 'A template can be passed as a file with or the content via STDIN
Bash symbols must be escaped on STDIN passing'

    ########################################################################
    # Options
    ########################################################################
    XML={
        :name  => 'xml',
        :short => '-x',
        :large => '--xml',
        :description => 'Show the resource in xml format'
    }

    JSON = {
        :name => 'json',
        :short => '-j',
        :large => '--json',
        :description => 'Show the resource in JSON format',
        :proc        => lambda do |_, _|
            require 'json'
        end
    }

    YAML = {
        :name => 'yaml',
        :short => '-y',
        :large => '--yaml',
        :description => 'Show the resource in YAML format'
    }

    NUMERIC={
        :name  => 'numeric',
        :short => '-n',
        :large => '--numeric',
        :description => 'Do not translate user and group IDs'
    }

    KILOBYTES={
        :name  => 'kilobytes',
        :short => '-k',
        :large => '--kilobytes',
        :description => 'Show units in kilobytes'
    }

    DESCRIBE={
        :name  => 'describe',
        :large => '--describe',
        :description => 'Describe list columns'
    }

    APPEND = {
        :name => 'append',
        :short => '-a',
        :large => '--append',
        :description => 'Append new attributes to the current template'
    }

    FILE = {
        :name => 'file',
        :short => '-f file',
        :large => '--file file',
        :description => 'Selects the template file',
        :format => String,
        :proc => lambda {|o, options|
            if File.file?(o)
                options[:file] = o
            else
                STDERR.puts "File `#{options[:file]}` doesn't exist"
                exit(-1)
            end
        }
    }

    # Command line VM template options
    TEMPLATE_NAME_VM={
        :name   => 'name',
        :large  => '--name name',
        :description =>
            'Name for the new VM',
        :format => String
    }

    DRY={
        :name  => 'dry',
        :large  => '--dry',
        :description => 'Just print the template'
    }

    CLIENT_OPTIONS=[
        {
            :name   => 'user',
            :large  => '--user name',
            :description => 'User name used to connect to OpenNebula',
            :format => String,
            :proc => lambda do |o, _options|
                OneHelper.set_user(o)
                [0, o]
            end
        },
        {
            :name   => 'password',
            :large  => '--password password',
            :description => 'Password to authenticate with OpenNebula',
            :format => String,
            :proc => lambda do |o, _options|
                OneHelper.set_password(o)
                [0, o]
            end
        },
        {
            :name   => 'endpoint',
            :large  => '--endpoint endpoint',
            :description => 'URL of OpenNebula xmlrpc frontend',
            :format => String,
            :proc => lambda do |o, _options|
                OneHelper.set_endpoint(o)
                [0, o]
            end
        }
    ]

    GROUP_OPTIONS=[
        {
            :name   => 'name',
            :large  => '--name name',
            :short => '-n',
            :description =>
                'Name for the new group',
            :format => String
        },
        {
            :name   => 'admin_user',
            :large  => '--admin_user name',
            :short => '-u',
            :description =>
                'Creates an admin user for the group with name',
            :format => String
        },
        {
            :name   => 'admin_password',
            :large  => '--admin_password pass',
            :short => '-p',
            :description =>
                'Password for the admin user of the group',
            :format => String
        },
        {
            :name   => 'admin_driver',
            :large  => '--admin_driver driver',
            :short => '-d',
            :description =>
                'Auth driver for the admin user of the group',
            :format => String
        },
        {
            :name   => 'resources',
            :large  => '--resources res_str',
            :short => '-r',
            :description =>
                'Which resources can be created by group users '<<
                '(VM+NET+IMAGE+TEMPLATE by default)',
            :format => String
        }
    ]

    AS_USER = {
        :name   => 'as_uid',
            :large  => '--as_uid uid',
            :format => Integer,
            :description => 'The User ID to instantiate the VM'
    }

    AS_GROUP = {
        :name   => 'as_gid',
            :large  => '--as_gid gid',
            :format => Integer,
            :description => 'The Group ID to instantiate the VM'
    }

    # NOTE: Other options defined using this array, add new options at the end
    TEMPLATE_OPTIONS=[
        {
            :name   => 'cpu',
            :large  => '--cpu cpu',
            :description =>
                "CPU percentage reserved for the VM (1=100% one\n"<<
                ' '*31<<'CPU)',
            :format => Float
        },
        {
            :name   => 'vcpu',
            :large  => '--vcpu vcpu',
            :description =>
                'Number of virtualized CPUs',
            :format => Integer
        },
        {
            :name   => 'arch',
            :large  => '--arch arch',
            :description =>
                'Architecture of the VM, e.g.: i386 or x86_64',
            :format => String
        },
        {
            :name   => 'memory',
            :large  => '--memory memory',
            :description => 'Memory amount given to the VM. By default the '<<
                "unit is megabytes. To use gigabytes add a 'g', floats "<<
                'can be used: 8g=8192, 0.5g=512',
            :format => String,
            :proc   => lambda do |o, _options|
                m=o.strip.match(/^(\d+(?:\.\d+)?)(m|mb|g|gb)?$/i)

                if !m
                    [-1, 'Memory value malformed']
                else
                    multiplier=case m[2]
                               when /(g|gb)/i
                                   1024
                               else
                                   1
                               end

                    value=m[1].to_f*multiplier

                    [0, value.floor]
                end
            end
        },
        {
            :name   => 'disk',
            :large  => '--disk image0,image1',
            :description => 'Disks to attach. To use an image owned by'<<
                            ' other user use user[disk]. Add any additional'<<
                            " attributes separated by ':' and in the shape of"<<
                            ' KEY=VALUE. For example, if the disk must be'<<
                            ' resized, use image0:size=1000 . Or'<<
                            ' image0:size=1000:target=vda,image1:target=vdb',
            :format => Array
        },
        {
            :name   => 'nic',
            :large  => '--nic network0,network1',
            :description => 'Networks to attach. To use a network owned by'<<
                            ' other user use user[network]. Additional'<<
                            ' attributes are supported like with the --disk'<<
                            ' option. Also you can use auto if you want that' <<
                            ' OpenNebula select automatically the network',
            :format => Array
        },
        {
            :name   => 'raw',
            :large  => '--raw string',
            :description => "Raw string to add to the template. Not to be\n"<<
                            ' '*31<<'confused with the RAW attribute',
            :format => String
        },
        {
            :name   => 'vnc',
            :large  => '--vnc',
            :description => 'Add VNC server to the VM'
        },
        {
            :name   => 'vnc_password',
            :large  => '--vnc-password password',
            :format => String,
            :description => 'VNC password'
        },
        {
            :name   => 'vnc_listen',
            :large  => '--vnc-listen ip',
            :format => String,
            :description => 'VNC IP where to listen for connections. '<<
                'By default is 0.0.0.0 (all interfaces).'
        },
        {
            :name   => 'vnc_keymap',
            :large  => '--vnc-keymap keymap',
            :format => String,
            :description => 'VNC keyboard layout'
        },
        {
            :name   => 'spice',
            :large  => '--spice',
            :description => 'Add spice server to the VM'
        },
        {
            :name   => 'spice_password',
            :large  => '--spice-password password',
            :format => String,
            :description => 'spice password'
        },
        {
            :name   => 'spice_listen',
            :large  => '--spice-listen ip',
            :format => String,
            :description => 'spice IP where to listen for connections. '<<
                'By default is 0.0.0.0 (all interfaces).'
        },
        {
            :name   => 'spice_keymap',
            :large  => '--spice-keymap keymap',
            :format => String,
            :description => 'spice keyboard layout'
        },
        {
            :name   => 'ssh',
            :large  => '--ssh [file]',
            :description => "Add an ssh public key to the context. If the \n"<<
                (' '*31) << "file is omited then the user variable \n"<<
                (' '*31) << 'SSH_PUBLIC_KEY will be used.',
            :format => String,
            :proc => lambda do |o, _options|
                if !o
                    [0, true]
                else
                    [0, o]
                end
            end
        },
        {
            :name   => 'net_context',
            :large  => '--net_context',
            :description => 'Add network contextualization parameters'
        },
        {
            :name   => 'context',
            :large  => '--context line1,line2,line3',
            :format => Array,
            :description => 'Replaces the context section with the specified lines'
        },
        {
            :name   => 'boot',
            :large  => '--boot device_list',
            :description => 'Set boot device list e.g. disk0,disk2,nic0',
            :format => String
        },
        {
            :name   => 'files_ds',
            :large  => '--files_ds file1,file2',
            :format => Array,
            :description => 'Add files to the contextualization CD from the' <<
                'files datastore'
        },
        {
            :name   => 'init',
            :large  => '--init script1,script2',
            :format => Array,
            :description => 'Script or scripts to start in context'
        },
        {
            :name   => 'startscript',
            :large  => '--startscript [file]',
            :format => String,
            :description => 'Start script to be executed'
        },
        {
            :name   => 'report_ready',
            :large  => '--report_ready',
            :description => 'Sends READY=YES to OneGate, useful for OneFlow'
        },
        {
            :name   => 'vcenter_vm_folder',
            :large  => '--vcenter_vm_folder path',
            :format => String,
            :description => 'In a vCenter environment sets the the VMs and Template folder where the VM will be placed in.' \
            ' The path uses slashes to separate folders. For example: --vcenter_vm_folder "/Management/VMs"'
        },
        {
            :name   => 'user_inputs',
            :large  => '--user-inputs ui1,ui2,ui3',
            :format => Array,
            :description => 'Specify the user inputs values when instantiating',
            :proc => lambda do |o, options|
                # Store user inputs that has been already processed
                options[:user_inputs_keys] = []

                # escape values
                options[:user_inputs].map! do |user_input|
                    user_input_split = user_input.split('=')

                    options[:user_inputs_keys] << user_input_split[0]

                    "#{user_input_split[0]}=\"#{user_input_split[1]}\""
                end

                options[:user_inputs] = o.join("\n")
            end
        },
        {
            :name   => 'video',
            :large  => '--video type',
            :format => String,
            :description => 'Add a custom video device (none, vga, cirrus, virtio)'
        },
        {
            :name   => 'video_iommu',
            :large  => '--video-iommu',
            :description => 'Enable IOMMU (I/O Memory Management Unit) for the video device'
        },
        {
            :name   => 'video_ats',
            :large  => '--video-ats',
            :description => 'Enable ATS (Address Translation Services) for the video device'
        },
        {
            :name   => 'video_vram',
            :large  => '--video-vram vram',
            :description => 'VRAM allocated to the video device. By default the ' +
                "unit is megabytes. To use gigabytes add a 'g', floats " +
                'can be used: 8g=8192, 0.5g=512',
            :format => String,
            :proc   => lambda do |o, _options|
                m=o.strip.match(/^(\d+(?:\.\d+)?)(m|mb|g|gb)?$/i)

                if !m
                    [-1, 'VRAM value malformed']
                else
                    multiplier=case m[2]
                               when /(g|gb)/i
                                   1048576 # = 1024 * 1024
                               else
                                   1024
                               end

                    value=m[1].to_f*multiplier

                    [0, value.floor]
                end
            end
        },
        {
            :name   => 'video_resolution',
            :large  => '--video-resolution resolution',
            :format => String,
            :description => 'Video resolution, in format like: 1280x720 or 1920x1080',
            :proc   => lambda do |_o, _options|
                if !m.match?(/\d{3,4}x\d{3,4}/)
                    [-1, 'Video Resolution value malformed']
                end
            end
        },
        AS_GROUP,
        AS_USER
    ]

    FORCE={
        :name  => 'force',
        :large  => '--force',
        :description => 'Ignore errors (if possible)'
    }

    EXTENDED={
        :name => 'extended',
        :large => '--extended',
        :description => 'Show info extended (it only works with xml output)'
    }

    DECRYPT = {
        :name => 'decrypt',
        :large => '--decrypt',
        :description => 'Get decrypted attributes'
    }

    SCHEDULE_OPTIONS=[
        SCHEDULE = {
            :name => 'schedule',
            :large => '--schedule TIME',
            :description => 'Schedules this action to be executed after' \
            'the given time. For example: onevm resume 0 --schedule "09/23 14:15"',
            :format => String,
            :proc => lambda {|o, options|
                if o[0] == '+'
                    options[:schedule] = o
                elsif o == 'now'
                    options[:schedule] = Time.now.to_i
                else
                    begin
                        options[:schedule] = Time.parse(o).to_i
                    rescue StandardError
                        STDERR.puts "Error parsing time spec: #{o}"
                        exit(-1)
                    end
                end
            }
        },

        WEEKLY = {
            :name => 'weekly',
            :large => '--weekly days',
            :description => 'Repeats the schedule action the days of the week ' \
            'specified, it can be a number between 0 (Sunday) to 6 (Saturday) ' \
            'separated with commas. ' \
            'For example: onevm resume 0 --schedule "09/23 14:15" --weekly 0,2,4',
            :format => String
        },

        MONTHLY = {
            :name => 'monthly',
            :large => '--monthly days',
            :description => 'Repeats the schedule action the days of the month ' \
            'specified, it can be a number between 1,31 separated with commas. ' \
            'For example: onevm resume 0 --schedule "09/23 14:15" --monthly 1,14',
            :format => String
        },

        YEARLY = {
            :name => 'yearly',
            :large => '--yearly days',
            :description => 'Repeats the schedule action the days of the year ' \
            'specified, it can be a number between 0,365 separated with commas. ' \
            'For example: onevm resume 0 --schedule "09/23 14:15" --yearly 30,60',
            :format => String
        },

        HOURLY = {
            :name => 'hourly',
            :large => '--hourly hour',
            :description => 'Repeats the schedule action with the given hourly frequency. ' \
            'For example (every 5 hours): onevm resume 0 --schedule "09/23 14:15" --hourly 5',
            :format => Numeric
        },

        END_TIME = {
            :name => 'end',
            :large => '--end number|TIME',
            :description => '----',
            :format => String
        }
    ]

    TEMPLATE_OPTIONS_VM   = [TEMPLATE_NAME_VM] + TEMPLATE_OPTIONS + [DRY]

    CAPACITY_OPTIONS_VM   = [TEMPLATE_OPTIONS[0], TEMPLATE_OPTIONS[1],
                             TEMPLATE_OPTIONS[3]]

    UPDATECONF_OPTIONS_VM = TEMPLATE_OPTIONS[6..15] + [TEMPLATE_OPTIONS[2],
                                                       TEMPLATE_OPTIONS[17], TEMPLATE_OPTIONS[18]]

    FORMAT = [XML, JSON, YAML]

    OPTIONS = FORMAT, EXTENDED, NUMERIC, KILOBYTES

    BACKUP_MODES = ['FULL', 'INCREMENT']

    class OneHelper

        attr_accessor :client

        def self.get_client(options = {}, force = false)
            if !force && defined?(@@client)
                @@client
            else

                secret=nil
                password=nil

                if defined?(@@user)
                    user=@@user
                    password=@@password if defined?(@@password)
                else
                    user=options[:user]
                end

                if user
                    password=password||options[:password]||get_password
                    secret="#{user}:#{password}"
                end

                if defined?(@@endpoint)
                    endpoint=@@endpoint
                else
                    endpoint=options[:endpoint]
                end

                # This breaks the CLI SSL support for Ruby 1.8.7, but is necessary
                # in order to do template updates, otherwise you get the broken pipe
                # error (bug #3341)
                if RUBY_VERSION < '1.9'
                    sync = false
                else
                    sync = true
                end
                options[:sync] = sync
                @@client=OpenNebula::Client.new(secret, endpoint, options)
            end
        end

        def self.client
            if defined?(@@client)
                @@client
            else
                get_client
            end
        end

        def self.set_user(user)
            @@user=user
        end

        def self.set_password(password)
            @@password=password
        end

        def self.set_endpoint(endpoint)
            @@endpoint=endpoint
        end

        if RUBY_VERSION>='1.9.3'
            require 'io/console'
            def self.get_password
                print 'Password: '
                pass=nil
                STDIN.noecho {|io| pass=io.gets }
                puts

                pass.chop! if pass
                @@password=pass
                pass
            end
        else
            # This function is copied from ruby net/imap.rb
            def self.get_password
                print 'Password: '
                system('stty', '-echo')
                begin
                    @@password = STDIN.gets.chop
                    @@password
                ensure
                    system('stty', 'echo')
                    print "\n"
                end
            end
        end

        def self.list_layout_help
            "The default columns and their layout can be configured in #{conf_file}"
        end

        def self.template_input_help(object_name)
            "#{TEMPLATE_INPUT}\nWhen using a template add only one #{object_name} instance."
        end

        def initialize(_secret = nil, _endpoint = nil)
            @client=nil

            @translation_hash = nil
        end

        def set_client(options, client = nil)
            if client.nil?
                @client=OpenNebulaHelper::OneHelper.get_client(options, true)
            else
                @client = client
            end
        end

        def create_resource(_options, &block)
            resource = factory

            rc = block.call(resource)
            if OpenNebula.is_error?(rc)
                [-1, rc.message]
            else
                puts "ID: #{resource.id}"
                0
            end
        end

        def backup_mode_valid?(sus_backup_mode)
            BACKUP_MODES.each do |backup_mode|
                return true if backup_mode.casecmp?(sus_backup_mode)
            end

            false
        end

        #-----------------------------------------------------------------------
        #  List pool functions
        #-----------------------------------------------------------------------
        def start_pager
            pager = ENV['ONE_PAGER'] || 'more'

            # Start pager, defaults to less
            p_r, p_w = IO.pipe

            Signal.trap('PIPE', 'SIG_IGN')
            Signal.trap('PIPE', 'EXIT')

            lpid = fork do
                $stdin.reopen(p_r)

                p_r.close
                p_w.close

                Kernel.select [$stdin]

                exec([pager, pager])
            end

            # Send listing to pager pipe
            $stdout.close
            $stdout = p_w.dup

            p_w.close
            p_r.close

            lpid
        end

        def stop_pager(lpid)
            $stdout.close

            begin
                Process.wait(lpid)
            rescue Interrupt
                Process.kill('TERM', lpid)
                Process.wait(lpid)
            rescue Errno::ECHILD
            end
        end

        def print_page(pool, options)
            elements = 0
            page     = ''

            if options[:xml]
                elements += 1

                page << pool.to_xml(true)
            else
                pname = pool.pool_name
                ename = pool.element_name

                if options[:decrypt]
                    page = pool.map do |element|
                        element.info(true)
                        element.to_hash[ename]
                    end
                else
                    page  = pool.to_hash
                    elems = page[pname][ename]
                end

                if elems.class == Array
                    elements = elems.length
                else
                    elements = 1
                end
            end

            [elements, page]
        end

        #-----------------------------------------------------------------------
        # List the pool in table form, it uses pagination for interactive
        # output
        #-----------------------------------------------------------------------
        def list_pool_table(table, pool, options, _filter_flag)
            if $stdout.isatty and (!options.key? :no_pager)
                size = $stdout.winsize[0] - 1

                # ----------- First page, check if pager is needed -------------
                rc = pool.get_page(size, 0, false, options[:state])
                ps = ''

                return -1, rc.message if OpenNebula.is_error?(rc)

                elements, hash = print_page(pool, options)

                ppid = -1

                if elements >= size
                    ppid = start_pager
                end

                table.show(hash, options)

                if elements < size
                    return 0
                elsif !pool.is_paginated?
                    stop_pager(ppid)
                    return 0
                end

                # ------- Rest of the pages in the pool, piped to pager --------
                current = size

                options[:no_header] = true

                loop do
                    rc = pool.get_page(size, current, false, options[:state])

                    return -1, rc.message if OpenNebula.is_error?(rc)

                    current += size

                    begin
                        Process.waitpid(ppid, Process::WNOHANG)
                    rescue Errno::ECHILD
                        break
                    end

                    elements, hash = print_page(pool, options)

                    table.show(hash, options)

                    $stdout.flush

                    break if elements < size
                end

                stop_pager(ppid)
            else
                rc = pool.info

                return -1, rc.message if OpenNebula.is_error?(rc)

                elements, hash = print_page(pool, options)

                if options[:ids] && elements
                    hash = [hash[pool.pool_name][pool.element_name]].flatten
                    hash.reject! do |element|
                        !options[:ids].include?(element['ID'].to_i)
                    end
                end

                table.show(hash, options)
            end

            0
        end

        #-----------------------------------------------------------------------
        # List pool in XML format, pagination is used in interactive output
        #-----------------------------------------------------------------------
        def list_pool_xml(pool, options, _filter_flag)
            extended = options.include?(:extended) && options[:extended]

            if $stdout.isatty and (!options.key? :no_pager)
                size = $stdout.winsize[0] - 1

                # ----------- First page, check if pager is needed -------------
                rc = pool.get_page(size, 0, extended, options[:state])
                ps = ''

                return -1, rc.message if OpenNebula.is_error?(rc)

                pname = pool.pool_name

                elements, page = print_page(pool, options)

                ppid = -1

                if elements >= size
                    ppid = start_pager
                end

                puts page

                if elements < size
                    return 0
                end

                if elements < size
                    return 0
                elsif !pool.is_paginated?
                    stop_pager(ppid)
                    return 0
                end

                # ------- Rest of the pages in the pool, piped to pager --------
                current = size

                loop do
                    rc = pool.get_page(size, current, extended, options[:state])

                    return -1, rc.message if OpenNebula.is_error?(rc)

                    current += size

                    begin
                        Process.waitpid(ppid, Process::WNOHANG)
                    rescue Errno::ECHILD
                        break
                    end

                    elements, page = print_page(pool, options)

                    puts page

                    $stdout.flush

                    break if elements < size
                end

                puts "</#{pname}>"

                stop_pager(ppid)
            else
                if pool.pool_name == 'VM_POOL' && extended
                    rc = pool.info_all_extended
                else
                    rc = pool.info
                end

                return -1, rc.message if OpenNebula.is_error?(rc)

                puts pool.to_xml(true)
            end

            0
        end

        #-----------------------------------------------------------------------
        # List pool in JSON format, pagination is used in interactive output
        #-----------------------------------------------------------------------
        def list_pool_format(pool, options, _filter_flag)
            extended = options.include?(:extended) && options[:extended]

            if $stdout.isatty and (!options.key? :no_pager)
                size = $stdout.winsize[0] - 1

                # ----------- First page, check if pager is needed -------------
                rc = pool.get_page(size, 0, extended, options[:state])
                ps = ''

                return -1, rc.message if OpenNebula.is_error?(rc)

                elements = get_format_size(pool, options)
                ppid     = -1

                if elements >= size
                    ppid = start_pager
                end

                yield(pool) if block_given?

                if elements < size
                    return 0
                end

                if elements < size
                    return 0
                elsif !pool.is_paginated?
                    stop_pager(ppid)
                    return 0
                end

                # ------- Rest of the pages in the pool, piped to pager --------
                current = size

                loop do
                    rc = pool.get_page(size, current, extended, options[:state])

                    return -1, rc.message if OpenNebula.is_error?(rc)

                    current += size

                    begin
                        Process.waitpid(ppid, Process::WNOHANG)
                    rescue Errno::ECHILD
                        break
                    end

                    elements = get_format_size(pool, options)

                    break if elements < size

                    yield(pool) if block_given?

                    $stdout.flush
                end

                stop_pager(ppid)
            else
                if pool.pool_name == 'VM_POOL' && extended
                    rc = pool.info_all_extended
                else
                    rc = pool.info
                end

                return -1, rc.message if OpenNebula.is_error?(rc)

                yield(pool) if block_given?
            end

            0
        end

        #-----------------------------------------------------------------------
        # List pool table in top-like form
        #-----------------------------------------------------------------------
        def list_pool_top(table, pool, options)
            table.top(options) do
                array = pool.get_hash

                return -1, array.message if OpenNebula.is_error?(array)

                array
            end

            0
        end

        def list_pool(options, top = false, filter_flag = nil)
            # Capture Broken pipe
            Signal.trap('PIPE', 'EXIT')

            table = format_pool(options)

            if options[:describe]
                table.describe_columns

                return 0
            end

            filter_flag ||= OpenNebula::Pool::INFO_ALL

            pool  = factory_pool(filter_flag)
            pname = pool.pool_name
            ename = pool.element_name

            if top
                return list_pool_top(table, pool, options)
            elsif options[:xml]
                return list_pool_xml(pool, options, filter_flag)
            elsif options[:json]
                return list_pool_format(pool, options, filter_flag) do |pool|
                    hash = check_resource_xsd(pool, pname)
                    puts ::JSON.pretty_generate(hash)
                end
            elsif options[:yaml]
                return list_pool_format(pool, options, filter_flag) do |pool|
                    hash = check_resource_xsd(pool, pname)
                    puts hash.to_yaml(:indent => 4)
                end
            else
                return list_pool_table(table, pool, options, filter_flag)
            end

            0
        rescue SystemExit, Interrupt
            # Rescue ctrl + c when paginated
            0
        end

        # Check if a resource defined by attributes is referenced in pool
        #
        # @param pool pool to search in
        # @param xpath xpath to search in pool
        # @param resource_name name of the resource to search (e.g IMAGE)
        # @attributes hash with resource attributes, must contains :id, :name
        # and :uname
        #
        # atributes {uname => ..., name => ..., id => ...}
        def check_orphan(pool, xpath, resource_name, attributes)
            return false if attributes.empty?

            return false unless pool["#{xpath}[#{resource_name}_ID = "\
                                     "#{attributes[:id]}]"].nil?

            return false unless pool["#{xpath}[#{resource_name} = "\
                                     "'#{attributes[:name]}' and "\
                                     "#{resource_name}_UNAME = "\
                                     "'#{attributes[:uname]}']"].nil?

            true
        end

        def show_resource(id, options)
            resource = retrieve_resource(id)

            if !options.key? :decrypt
                rc = resource.info
            else
                rc = resource.info(true)
            end

            return -1, rc.message if OpenNebula.is_error?(rc)

            if options[:xml]
                [0, resource.to_xml(true)]
            elsif options[:json]
                # If body is set, the resource contains a JSON inside
                if options[:body]
                    [0, check_resource_xsd(resource)]
                else
                    [0, ::JSON.pretty_generate(
                        check_resource_xsd(resource)
                    )]
                end
            elsif options[:yaml]
                [0, check_resource_xsd(resource).to_yaml(:indent => 4)]
            else
                format_resource(resource, options)
                0
            end
        end

        def perform_action(id, options, verbose, &block)
            resource = retrieve_resource(id)

            rc = block.call(resource)
            if OpenNebula.is_error?(rc)
                [-1, rc.message]
            else
                if options[:verbose]
                    puts "#{self.class.rname} #{id}: #{verbose}"
                end
                0
            end
        end

        def perform_actions(ids, options, verbose, &block)
            exit_code = 0
            ids.each do |id|
                rc = perform_action(id, options, verbose, &block)

                unless rc[0]==0
                    STDERR.puts rc[1]
                    exit_code=rc[0]
                end
            end

            exit_code
        end

        ########################################################################
        # Id translation
        ########################################################################
        def user_name(resource, options = {})
            if options[:numeric]
                resource['UID']
            else
                resource['UNAME']
            end
        end

        def group_name(resource, options = {})
            if options[:numeric]
                resource['GID']
            else
                resource['GNAME']
            end
        end

        ########################################################################
        # Formatters for arguments
        ########################################################################
        def to_id(name)
            return 0, name.to_i if name.match(/^[0123456789]+$/)

            rc = get_pool
            return rc if rc.first != 0

            pool     = rc[1]
            poolname = self.class.rname

            OneHelper.name_to_id(name, pool, poolname)
        end

        def self.to_id_desc
            "OpenNebula #{rname} name or id"
        end

        def list_to_id(names)
            rc = get_pool
            return rc if rc.first != 0

            pool     = rc[1]
            poolname = self.class.rname

            result = names.split(',').collect do |name|
                if name.match(/^[0123456789]+$/)
                    name.to_i
                else
                    rc = OneHelper.name_to_id(name, pool, poolname)

                    if rc.first == -1
                        return rc[0], rc[1]
                    end

                    rc[1]
                end
            end

            [0, result]
        end

        def self.list_to_id_desc
            "Comma-separated list of OpenNebula #{rname} names or ids"
        end

        def self.name_to_id(name, pool, ename)
            if ename=='CLUSTER' and name.upcase=='ALL'
                return 0, 'ALL'
            end

            objects=pool.select {|object| object.name==name }

            return -1, "#{ename} named #{name} not found." unless objects.length>0
            return -1, "There are multiple #{ename}s with name #{name}." if objects.length>1

            result = objects.first.id

            [0, result]
        end

        def filterflag_to_i(str)
            filter_flag = case str
                          when 'a', 'all'   then OpenNebula::Pool::INFO_ALL
                          when 'm', 'mine'  then OpenNebula::Pool::INFO_MINE
                          when 'g', 'group' then OpenNebula::Pool::INFO_GROUP
                          when 'G', 'primary group' then OpenNebula::Pool::INFO_PRIMARY_GROUP
                          else
                              if str.match(/^[0123456789]+$/)
                                  str.to_i
                              else
                                  rc = OpenNebulaHelper.rname_to_id(str, 'USER')
                                  return rc if rc.first==-1

                                  rc[1]

                              end
                          end

            [0, filter_flag]
        end

        def self.filterflag_to_i_desc
            desc=<<~EOT
                a, all            all the known #{rname}s
                m, mine           the #{rname} belonging to the user in ONE_AUTH
                g, group          'mine' plus the #{rname} belonging to the groups
                                  the user is member of
                G, primary group  the #{rname} owned the user's primary group
                uid               #{rname} of the user identified by this uid
                user              #{rname} of the user identified by the username
            EOT
        end

        def self.table_conf(conf_file = self.conf_file)
            path = "#{ENV['HOME']}/.one/cli/#{conf_file}"

            if File.exist?(path)
                path
            else
                "#{TABLE_CONF_PATH}/#{conf_file}"
            end
        end

        def retrieve_resource(id)
            factory(id)
        end

        private

        def pool_to_array(pool)
            if !pool.instance_of?(Hash)
                phash = pool.to_hash
            else
                phash = pool
            end

            rname = self.class.rname

            if phash["#{rname}_POOL"] &&
                    phash["#{rname}_POOL"]["#{rname}"]
                if phash["#{rname}_POOL"]["#{rname}"].instance_of?(Array)
                    phash = phash["#{rname}_POOL"]["#{rname}"]
                else
                    phash = [phash["#{rname}_POOL"]["#{rname}"]]
                end
            else
                phash = []
            end

            phash
        end

        def get_pool
            user_flag = OpenNebula::Pool::INFO_ALL
            pool = factory_pool(user_flag)

            rc = pool.info
            if OpenNebula.is_error?(rc)
                return -1, rc.message unless rc.message.empty?

                return -1, "OpenNebula #{self.class.rname} name not " <<
                       'found, use the ID instead'

            end

            [0, pool]
        end

        def get_format_size(pool, options)
            if options[:json]
                ::JSON.pretty_generate(pool.to_hash).split("\n").size
            elsif options[:yaml]
                pool.to_hash.to_yaml.split("\n").size
            else
                STDERR.puts 'ERROR: Format not found'
                exit(-1)
            end
        end

        ########################################################################
        # XSD check and fix
        ########################################################################

        # Check XSD values for a single resource
        #
        # @param resource [OpenNebula::Object] Resource to check
        # @param ename    [String]             Resource name
        #
        # @return [Object] Hash with correct values
        def check_resource_xsd(resource, ename = nil)
            hash  = resource.to_hash
            ename ||= hash.keys.first
            xsd   = read_xsd(ename)

            return hash unless xsd

            if xsd.keys.include?('complexType')
                xsd = xsd['complexType']['sequence']['element']
            else
                xsd = xsd['element']
            end

            xsd = [xsd] unless xsd.is_a? Array

            check_xsd(hash[ename], xsd)

            hash
        end

        # Replaces refs in xsd definition
        # limited func: only traverse hashes (not arrays), but works well for pools
        #
        # @param h [Hash] XSD in hash format
        #
        # @return [Object] XSD but where ref were, there inner XSD is loaded
        def replace_refs(h)
            return h unless h.is_a? Hash

            if h.keys.include? 'ref'
                ref_xsd = read_xsd(h['ref'])
                return ref_xsd unless ref_xsd.nil?

                h
            else
                h.each do |k, v|
                    h[k] = replace_refs(v)
                end
            end
        end

        # Read XSD file and parse to XML
        #
        # @param ename [String] Element name to read XSD
        #
        # @return [Hash] XSD in hash format, nil if not found
        def read_xsd(ename)
            require 'active_support'
            require 'active_support/core_ext/hash/conversions'

            # Try GEM directory
            file = File.expand_path(
                "../share/schemas/xsd/#{ename.downcase}.xsd",
                File.dirname(__FILE__)
            )

            file = "#{XSD_PATH}/#{ename.downcase}.xsd" unless File.exist?(file)

            unless File.exist?(file)
                STDERR.puts "WARNING: XSD for #{ename} not found, skipping check"
                return
            end

            hash = Hash.from_xml(Nokogiri::XML(File.read(file)).to_s)

            hash = hash['schema']['element']

            replace_refs(hash)
        end

        # Decides if given xsd definiton should be array in xml
        # Must be hash and contain either 'maxOccurs' => unbounded'
        #                              or 'maxOccurs' => >1
        #
        # @param e [Hash] XSD definition transfomred in hash
        #
        # @return [Boolean]
        #
        def is_array?(e)
            return false if e.nil?
            return false unless e.is_a? Hash

            e['maxOccurs'] == 'unbounded' || e['maxOccurs'].to_i > 1
        end

        # Decides if given xsd definiton is complex type sequence
        # Must be hash and contain nested hash
        #   ['complexType']['sequence']['element']
        #
        # @param  [Hash] XSD definition transfomred in hash
        #
        # @return [Boolean]
        #
        def xsd_complex_sequence?(x)
            x['complexType']['sequence']['element'] rescue return false
            true
        end

        # Decides if given xsd definiton is complex type all
        # Must be hash and contain nested hash
        #   ['complexType']['all']['element']
        #
        # @param  [Hash] XSD definition transfomred in hash
        #
        # @return [Boolean]
        #
        def xsd_complex_all?(x)
            x['complexType']['all']['element'] rescue return false
            true
        end

        # Recursively traverse the OpenNebula resource (in Hash) and it's XSD
        # Where array is required in XSD, there encapsulate the entry into [ ]
        # Typically usefull for single disk, snapshots etc.
        #
        # @param hash     [Hash]   Resource information in hash format
        # @param xsd      [Hash]   XSD of the resource, transformed into hash
        #
        def check_xsd(hash, xsd)
            return unless hash or hash.empty?

            hash.each do |k, v|
                # find the elem definition in xsd array
                xsd_elem = xsd.select {|e| e['name'] == k }.first unless xsd.nil?

                if xsd_complex_sequence?(xsd_elem) || xsd_complex_all?(xsd_elem)

                    # go deeper in xsd, xsd is ehter complex sequence or all
                    begin
                        inner_xsd = xsd_elem['complexType']['sequence']['element']
                    rescue StandardError
                        inner_xsd = xsd_elem['complexType']['all']['element']
                    end

                    # recursively traverse resource - hash
                    if v.is_a? Hash
                        hash[k] = check_xsd(v, inner_xsd)

                    # recursively traverse resource - array
                    elsif v.is_a? Array
                        hash[k] = []
                        v.each do |e|
                            hash[k] << check_xsd(e, inner_xsd)
                        end
                    end
                end

                # if XSD requires array, do so in resource if missing
                if is_array?(xsd_elem) && (!v.is_a? Array)
                    hash[k] = [v]
                end
            end
        end

    end

    def self.rname_to_id(name, poolname)
        return 0, name.to_i if name.match(/^[0123456789]+$/)

        client=OneHelper.client

        pool = case poolname
               when 'HOST'          then OpenNebula::HostPool.new(client)
               when 'HOOK'          then OpenNebula::HookPool.new(client)
               when 'GROUP'         then OpenNebula::GroupPool.new(client)
               when 'USER'          then OpenNebula::UserPool.new(client)
               when 'DATASTORE'     then OpenNebula::DatastorePool.new(client)
               when 'CLUSTER'       then OpenNebula::ClusterPool.new(client)
               when 'VNET'          then OpenNebula::VirtualNetworkPool.new(client)
               when 'IMAGE'         then OpenNebula::ImagePool.new(client)
               when 'VMTEMPLATE'    then OpenNebula::TemplatePool.new(client)
               when 'VNTEMPLATES'   then OpenNebula::VNTemplatePool.new(client)
               when 'VM'            then OpenNebula::VirtualMachinePool.new(client)
               when 'ZONE'          then OpenNebula::ZonePool.new(client)
               when 'MARKETPLACE'   then OpenNebula::MarketPlacePool.new(client)
               when 'FLOWTEMPLATES' then OpenNebula::ServiceTemplatePool.new(client)
               end

        rc = pool.info
        if OpenNebula.is_error?(rc)
            return -1, "OpenNebula #{poolname} name not found," <<
                       ' use the ID instead'
        end

        OneHelper.name_to_id(name, pool, poolname)
    end

    def self.size_in_mb(size)
        m = size.match(/^(\d+(?:\.\d+)?)(t|tb|m|mb|g|gb)?$/i)

        if !m
            # return OpenNebula::Error.new('Size value malformed')
            [-1, 'Size value malformed']
        else
            multiplier=case m[2]
                       when /(t|tb)/i
                           1024*1024
                       when /(g|gb)/i
                           1024
                       else
                           1
                       end

            value=m[1].to_f*multiplier

            # return value.ceil
            [0, value.ceil]
        end
    end

    def self.rname_to_id_desc(poolname)
        "OpenNebula #{poolname} name or id"
    end

    def self.boolean_to_str(str)
        if str.to_i == 1
            'Yes'
        else
            'No'
        end
    end

    def self.time_to_str(time, print_seconds = true,
                         print_hours = true, print_years = false)

        value = time.to_i

        if value==0
            value='-'
        else
            if print_hours
                if print_seconds
                    if print_years
                        value=Time.at(value).strftime('%m/%d/%y %H:%M:%S')
                    else
                        value=Time.at(value).strftime('%m/%d %H:%M:%S')
                    end
                else
                    if print_years
                        value=Time.at(value).strftime('%m/%d/%y %H:%M')
                    else
                        value=Time.at(value).strftime('%m/%d %H:%M')
                    end
                end
            else
                if print_years
                    value=Time.at(value).strftime('%m/%d/%y')
                else
                    value=Time.at(value).strftime('%m/%d')
                end
            end
        end

        value
    end

    def self.period_to_str(time, print_seconds = true)
        seconds=time.to_i
        minutes, seconds=seconds.divmod(60)
        hours, minutes=minutes.divmod(60)
        days, hours=hours.divmod(24)

        if print_seconds
            format('%3dd %02dh%02dm%02ds', days, hours, minutes, seconds)
        else
            format('%3dd %02dh%02dm', days, hours, minutes)
        end
    end

    def self.short_period_to_str(time, print_seconds = true)
        seconds=time.to_i
        minutes, seconds=seconds.divmod(60)
        hours, minutes=minutes.divmod(60)

        if print_seconds
            format('%3dh%02dm%02ds', hours, minutes, seconds)
        else
            format('%3dh%02dm', hours, minutes)
        end
    end

    BinarySufix = ['K', 'M', 'G', 'T']

    def self.unit_to_str(value, options, unit = 'K')
        if options[:kilobytes]
            value
        else
            i=BinarySufix.index(unit).to_i

            while value > 1024 && i < 3
                value /= 1024.0
                i+=1
            end

            value = (value * 10).round / 10.0

            value = value.to_i if value - value.round == 0
            st = value.to_s + BinarySufix[i]
        end
    end

    def self.bytes_to_unit(value, unit = 'K')
        j = 0
        i = BinarySufix.index(unit).to_i

        while j < i
            value /= 1024.0
            j += 1
        end

        value
    end

    # If the cluster name is empty, returns a '-' char.
    #
    # @param str [String || Hash] Cluster name, or empty Hash (when <CLUSTER/>)
    # @return [String] the same Cluster name, or '-' if it is empty
    def self.cluster_str(str)
        if !str.nil? && !str.empty?
            str
        else
            '-'
        end
    end

    def self.clusters_str(clusters)
        if clusters.nil?
            '-'
        else
            [clusters].flatten.join(',')
        end
    end

    def self.update_template(id, resource, path = nil, xpath = 'TEMPLATE')
        update_template_helper(false, id, resource, path, xpath)
    end

    def self.append_template(id, resource, path = nil, xpath = 'TEMPLATE')
        update_template_helper(true, id, resource, path, xpath)
    end

    def self.update_template_helper(append, _id, resource, path, xpath, update = true)
        if path
            File.read(path)
        elsif !(stdin = self.read_stdin).empty?
            stdin
        elsif append
            editor_input
        else
            if update
                rc = resource.info

                if OpenNebula.is_error?(rc)
                    puts rc.message
                    exit(-1)
                end
            end

            editor_input(resource.template_like_str(xpath))
        end
    end

    def self.update_obj(obj, file, plain = false)
        rc = obj.info(true)

        return rc if OpenNebula.is_error?(rc)

        if file
            path = file
        else
            tmp  = Tempfile.new(obj['ID'])
            path = tmp.path

            tmp.write(yield(obj)) if block_given?
            tmp.flush

            if ENV['EDITOR']
                editor_path = ENV['EDITOR']
            else
                editor_path = EDITOR_PATH
            end

            system("#{editor_path} #{path}")

            unless $CHILD_STATUS.exitstatus.zero?
                STDERR.puts 'Editor not defined'
                exit(-1)
            end

            tmp.close
        end

        if plain
            obj.update(File.read(path), plain)
        else
            obj.update(File.read(path))
        end
    end

    def self.editor_input(contents = nil)
        require 'tempfile'

        tmp = Tempfile.new('one_cli')

        if contents
            tmp << contents
            tmp.flush
        end

        editor_path = ENV['EDITOR'] ? ENV['EDITOR'] : EDITOR_PATH
        system("#{editor_path} #{tmp.path}")

        unless $?.exitstatus == 0
            puts 'Editor not defined'
            exit(-1)
        end

        tmp.close

        File.read(tmp.path)
    end

    def self.parse_user_object(user_object)
        reg=/^([^\[]+)(?:\[([^\]]+)\])?$/

        m=user_object.match(reg)

        return unless m

        user=nil
        if m[2]
            user=m[1]
            object=m[2]
        else
            object=m[1]
        end

        [user, object]
    end

    def self.create_disk_net(objects, section, name)
        template=''

        objects.each do |obj|
            obj, *extra_attributes = obj.split(':')

            # When extra attributes do not contain = character include
            # them in the previous value. Fixes adding MAC addresses. These
            # contain ":" character also used as extra attributes separator.
            #
            # It may be needed to strip the value from start and end quotes
            # as the value could be written as this:
            #
            # --nic 'some_net:mac="00:0A:12:34:56:78"'
            #
            attrs = []
            extra_attributes.each do |str|
                if str.include?('=')
                    attrs << str
                else
                    attrs.last << ":#{str}"
                end
            end

            extra_attributes = attrs

            res=parse_user_object(obj)
            return [-1, "#{section.capitalize} \"#{obj}\" malformed"] unless res

            user, object=*res

            template<<"#{section.upcase}=[\n"
            if object.downcase == 'auto'
                template<<"  NETWORK_MODE=\"#{object}\"\n"
            else
                template<<"  #{name.upcase}_UNAME=\"#{user}\",\n" if user
                extra_attributes.each do |extra_attribute|
                    key, value = extra_attribute.split('=')
                    template<<"  #{key.upcase}=\"#{value}\",\n"
                end
                if object.match(/^\d+$/)
                    template<<"  #{name.upcase}_ID=#{object}\n"
                else
                    template<<"  #{name.upcase}=\"#{object}\"\n"
                end
            end
            template<<"]\n"
        end if objects

        [0, template]
    end

    def self.create_context(options)
        context_options = [:ssh, :net_context, :context, :init, :files_ds, :startscript,
                           :report_ready]
        if !(options.keys & context_options).empty?
            lines=[]

            if options[:ssh]
                if options[:ssh]==true
                    lines<<'SSH_PUBLIC_KEY="$USER[SSH_PUBLIC_KEY]"'
                else
                    begin
                        key=File.read(options[:ssh]).strip
                    rescue Exception => e
                        STDERR.puts e.message
                        exit(-1)
                    end
                    lines<<"SSH_PUBLIC_KEY=\"#{key}\""
                end
            end

            if options[:net_context]
                lines << 'NETWORK = "YES"'
            end

            lines+=options[:context] if options[:context]

            if options[:files_ds]
                text='FILES_DS="'
                text << options[:files_ds].map do |file|
                    %($FILE[IMAGE=\\"#{file}\\"])
                end.join(' ')
                text << '"'

                lines << text
            end

            if options[:init]
                lines << %(INIT_SCRIPTS="#{options[:init].join(' ')}")
            end

            if options[:startscript]
                script = nil
                begin
                    script = File.read(options[:startscript]).strip
                rescue Exception => e
                    STDERR.puts e.message
                    exit(-1)
                end
                script = Base64.strict_encode64(script)
                lines<<"START_SCRIPT_BASE64=\"#{script}\""
            end

            if options[:report_ready]
                lines << 'REPORT_READY = "YES"'
            end

            if !lines.empty?
                "CONTEXT=[\n" << lines.map {|l| '  ' << l }.join(",\n") << "\n]\n"
            else
                nil
            end
        else
            nil
        end
    end

    def self.create_template(options, template_obj = nil)
        template=''

        template<<"NAME=\"#{options[:name]}\"\n" if options[:name]

        if options[:arch] || options[:boot]
            template<<"OS = [\n"

            lines=[]
            lines<<"  ARCH = \"#{options[:arch]}\"" if options[:arch]
            lines<<"  BOOT = \"#{options[:boot]}\"" if options[:boot]

            template<<lines.join(",\n")

            template << " ]\n"
        end

        template<<"CPU=#{options[:cpu]}\n" if options[:cpu]
        template<<"VCPU=#{options[:vcpu]}\n" if options[:vcpu]
        template<<"MEMORY=#{options[:memory]}\n" if options[:memory]
        template<<"#{options[:raw]}\n" if options[:raw]

        template<<"AS_UID=#{options[:as_uid]}\n" if options[:as_uid]
        template<<"AS_GID=#{options[:as_gid]}\n" if options[:as_gid]

        if options[:disk]
            res=create_disk_net(options[:disk], 'DISK', 'IMAGE')
            return res if res.first!=0

            template<<res.last
        end

        if options[:nic]
            res=create_disk_net(options[:nic], 'NIC', 'NETWORK')
            return res if res.first!=0

            template<<res.last
        end

        if options[:vnc]
            vnc_listen=options[:vnc_listen] || '0.0.0.0'
            template<<"GRAPHICS=[ TYPE=\"vnc\", LISTEN=\"#{vnc_listen}\""
            if options[:vnc_password]
                template << ", PASSWD=\"#{options[:vnc_password]}\""
            end
            if options[:vnc_keymap]
                template << ", KEYMAP=\"#{options[:vnc_keymap]}\""
            end
            template<<' ]' << "\n"
        end

        if options[:spice]
            spice_listen=options[:spice_listen] || '0.0.0.0'
            template<<"GRAPHICS=[ TYPE=\"spice\", LISTEN=\"#{spice_listen}\""
            if options[:spice_password]
                template << ", PASSWD=\"#{options[:spice_password]}\""
            end
            if options[:spice_keymap]
                template << ", KEYMAP=\"#{options[:spice_keymap]}\""
            end
            template<<' ]' << "\n"
        end

        if options[:video]
            template<<"VIDEO=[ TYPE=\"#{options[:video]}\""
            template<<', IOMMU="YES"' if options[:video_iommu]
            template<<', ATS="YES"' if options[:video_ats]
            template<<", VRAM=\"#{options[:video_vram]}\"" if options[:video_vram]
            template<<", RESOLUTION=\"#{options[:video_resolution]}\""
            template<<' ]' << "\n"
        end

        template<<"VCENTER_VM_FOLDER=#{options[:vcenter_vm_folder]}\n" if options[:vcenter_vm_folder]

        context=create_context(options)
        template<<context if context

        if options[:userdata] && !template_obj.nil? && template_obj.has_elements?('TEMPLATE/EC2')
            template_obj.add_element(
                'TEMPLATE/EC2',
                'USERDATA' => options[:userdata]
            )

            template << template_obj.template_like_str(
                'TEMPLATE', false, 'EC2'
            )
        end

        [0, template]
    end

    def self.create_ar(options)
        ar = 'AR = [ '

        if options[:ip]
            if options[:ip6_global] || options[:ip6_ula]
                ar << 'TYPE="IP4_6"'
            elsif options[:ip6]
                ar << 'TYPE="IP4_6_STATIC"'
            else
                ar << 'TYPE="IP4"'
            end
        elsif options[:ip6]
            ar << 'TYPE="IP6_STATIC"'
        elsif options[:ip6_global] || options[:ip6_ula]
            ar << 'TYPE="IP6"'
        else
            ar << 'TYPE="ETHER"'
        end

        if options[:size]
            ar << ', SIZE = ' << options[:size]
        else
            unless options[:ip6]
                STDERR.puts 'Address range needs to specify size (-s size)'
                exit(-1)
            end
        end

        if options[:ip6]
            m = %r{([\h:]*)\/(\d.*)$}.match(options[:ip6])

            if m.nil? || m[1].nil?
                STDERR.puts 'Missing or wrong IP6'
                exit(-1)
            else
                begin
                    require 'ipaddr'

                    ip = IPAddr.new(m[1])

                    if !ip.ipv6?
                        STDERR.puts 'Wrong IP6 format address'
                        exit(-1)
                    end
                rescue StandardError
                    STDERR.puts 'Wrong IP6 format address'
                    exit(-1)
                end

            end

            if m[2].nil?
                STDERR.puts 'IP6 address need to set the prefix length'
                exit(-1)
            end

            ar << ", PREFIX_LENGTH=\"#{m[2]}\""

            options[:ip6] = m[1]
        end

        ar << ', IP = ' << options[:ip] if options[:ip]
        ar << ', IP6 = ' << options[:ip6] if options[:ip6]
        ar << ', MAC = ' << options[:mac] if options[:mac]
        if options[:ip6_global]
            ar << ', GLOBAL_PREFIX = ' << options[:ip6_global]
        end
        if options[:ip6_ula]
            ar << ', ULA_PREFIX = ' << options[:ip6_ula]
        end
        ar << ', GATEWAY = ' << options[:gateway] if options[:gateway]
        ar << ', MASK = '    << options[:netmask] if options[:netmask]
        ar << ', VN_MAD = '  << options[:vn_mad]  if options[:vn_mad]
        ar << ', VLAN_ID = ' << options[:vlanid]  if options[:vlanid]

        ar << ']'
    end

    def self.create_template_options_used?(options, conflicting_opts)
        # Get the template options names as symbols. options hash
        # uses symbols
        template_options=OpenNebulaHelper::TEMPLATE_OPTIONS.map do |o|
            o[:name].to_sym
        end

        # Check if at least one of the template options is in options hash
        conflicting_opts.replace(options.keys & template_options)

        !conflicting_opts.empty?
    end

    def self.sunstone_url
        if (one_sunstone = ENV['ONE_SUNSTONE'])
            one_sunstone
        elsif (one_xmlrpc = ENV['ONE_XMLRPC'])
            uri = URI(one_xmlrpc)
            "#{uri.scheme}://#{uri.host}:9869"
        else
            'http://localhost:9869'
        end
    end

    def self.download_resource_sunstone(kind, id, path, _force)
        client = OneHelper.client
        user, password = client.one_auth.split(':', 2)

        # Step 1: Build Session to get Cookie
        uri = URI(File.join(sunstone_url, 'login'))

        req = Net::HTTP::Post.new(uri)
        req.basic_auth user, password

        begin
            res = Net::HTTP.start(uri.hostname, uri.port) do |http|
                http.request(req)
            end
        rescue StandardError
            return OpenNebula::Error.new("Error connecting to '#{uri}'.")
        end

        cookie = res.response['set-cookie'].split('; ')[0]

        if cookie.nil?
            return OpenNebula::Error.new('Unable to get Cookie. Is OpenNebula running?')
        end

        # Step 2: Open '/' to get the csrftoken
        uri = URI(sunstone_url)

        req = Net::HTTP::Get.new(uri)
        req['Cookie'] = cookie

        begin
            res = Net::HTTP.start(uri.hostname, uri.port) do |http|
                http.request(req)
            end
        rescue StandardError
            return OpenNebula::Error.new("Error connecting to '#{uri}'.")
        end

        m = res.body.match(/var csrftoken = '(.*)';/)
        csrftoken = m[1] rescue nil

        if csrftoken.nil?
            return OpenNebula::Error.new('Unable to get csrftoken.')
        end

        # Step 3: Download resource
        uri = URI(File.join(sunstone_url,
                            kind.to_s,
                            id.to_s,
                            "download?csrftoken=#{csrftoken}"))

        req = Net::HTTP::Get.new(uri)

        req['Cookie'] = cookie
        req['User-Agent'] = 'OpenNebula CLI'

        begin
            File.open(path, 'wb') do |f|
                Net::HTTP.start(uri.hostname, uri.port) do |http|
                    http.request(req) do |res|
                        res.read_body do |chunk|
                            f.write(chunk)
                        end
                    end
                end
            end
        rescue Errno::EACCES
            return OpenNebula::Error.new('Target file not writable.')
        end

        error_message = nil

        File.open(path, 'rb') do |f|
            begin
                f.seek(-1024, IO::SEEK_END)
            rescue Errno::EINVAL
            end

            tail = f.read

            m = tail.match(/@\^_\^@ (.*) @\^_\^@/m)
            error_message = m[1] if m
        end

        return unless error_message

        File.unlink(path)
        OpenNebula::Error.new("Remote server error: #{error_message}")
    end

    def self.level_lock_to_str(str)
        level = str.to_i
        if level == 0
            'None'
        elsif level == 1
            'Use'
        elsif level == 2
            'Manage'
        elsif level == 3
            'Admin'
        elsif level == 4
            'All'
        else
            '-'
        end
    end

    def self.parse_user_inputs(inputs, keys = [])
        unless inputs.keys == keys
            puts 'There are some parameters that require user input. ' \
                 'Use the string <<EDITOR>> to launch an editor ' \
                 '(e.g. for multi-line inputs)'
        end

        answers = {}

        inputs.each do |key, val|
            next if keys.include? key

            input_cfg = val.split('|', -1)

            if input_cfg.length < 3
                STDERR.puts 'Malformed user input. It should have at least 3 '\
                            "parts separated by '|':"
                STDERR.puts "  #{key}: #{val}"
                exit(-1)
            end

            mandatory, type, description, params, initial = input_cfg
            optional = mandatory.strip == 'O'
            type.strip!
            description.strip!

            if input_cfg.length > 3
                if input_cfg.length != 5
                    STDERR.puts 'Malformed user input. It should have 5 parts'\
                                " separated by '|':"
                    STDERR.puts "  #{key}: #{val}"
                    exit(-1)
                end

                params.strip!
                initial.strip!
            end

            puts "  * (#{key}) #{description}"

            header = '    '
            if !initial.nil? && initial != ''
                header += "Press enter for default (#{initial}). "
            end

            case type
            when 'text', 'text64'
                print header

                answer = STDIN.readline.chop

                if answer == '<<EDITOR>>'
                    answer = OpenNebulaHelper.editor_input
                end

                # use default in case it's empty
                answer = initial if answer.empty?

                if type == 'text64'
                    answer = Base64.encode64(answer).strip.delete("\n")
                end

            when 'boolean'
                print header

                answer = STDIN.readline.chop

                # use default in case it's empty
                answer = initial if answer.empty?

                unless ['YES', 'NO'].include?(answer)
                    STDERR.puts "Invalid boolean '#{answer}'"
                    STDERR.puts 'Boolean has to be YES or NO'
                    exit(-1)
                end

            when 'password'
                print header

                answer = OpenNebulaHelper::OneHelper.get_password

                # use default in case it's empty
                answer = initial if answer.empty?

            when 'number', 'number-float'
                if type == 'number'
                    header += 'Integer: '
                    exp = OneTemplateHelper::INT_EXP
                else
                    header += 'Float: '
                    exp = OneTemplateHelper::FLOAT_EXP
                end

                begin
                    print header
                    answer = STDIN.readline.chop

                    answer = initial if answer == ''
                    noanswer = (answer == '') && optional
                end while !noanswer && (answer =~ exp).nil?

                if noanswer
                    next
                end

            when 'range', 'range-float'
                min, max = params.split('..')

                if min.nil? || max.nil?
                    STDERR.puts 'Malformed user input. '\
                                "Parameters should be 'min..max':"
                    STDERR.puts "  #{key}: #{val}"
                    exit(-1)
                end

                if type == 'range'
                    exp = OneTemplateHelper::INT_EXP
                    min = min.to_i
                    max = max.to_i

                    header += "Integer in the range [#{min}..#{max}]: "
                else
                    exp = OneTemplateHelper::FLOAT_EXP
                    min = min.to_f
                    max = max.to_f

                    header += "Float in the range [#{min}..#{max}]: "
                end

                begin
                    print header
                    answer = STDIN.readline.chop

                    answer = initial if answer == ''

                    noanswer = (answer == '') && optional
                end while !noanswer && ((answer =~ exp).nil? ||
                          answer.to_f < min || answer.to_f > max)

                if noanswer
                    next
                end

            when 'list'
                options = params.split(',')

                options.each_with_index do |opt, i|
                    puts "    #{i}  #{opt}"
                end

                puts

                header += 'Please type the selection number: '

                begin
                    print header
                    answer = STDIN.readline.chop

                    if answer == ''
                        answer = initial
                    else
                        answer = options[answer.to_i]
                    end

                    noanswer = (answer == '') && optional
                end while !noanswer && !options.include?(answer)

                if noanswer
                    next
                end

            when 'fixed'
                puts "    Fixed value of (#{initial}). Cannot be changed"
                answer = initial

            else
                STDERR.puts 'Wrong type for user input:'
                STDERR.puts "  #{key}: #{val}"
                exit(-1)
            end

            answers[key] = answer
        end

        answers
    end

    # Returns plot object to print it on the CLI
    #
    # @param x     [Array]  Data to x axis (Time axis)
    # @param y     [Array]  Data to y axis
    # @param attr  [String] Parameter to y axis
    # @param title [String] Plot title
    #
    # @return Gnuplot plot object
    def self.get_plot(x, y, attr, title)
        # Require gnuplot gem only here
        begin
            require 'gnuplot'
        rescue LoadError, Gem::LoadError
            STDERR.puts(
                'Gnuplot gem is not installed, run `gem install gnuplot` '\
                'to install it'
            )
            exit(-1)
        end

        # Check if gnuplot is installed on the system
        unless system('gnuplot --version')
            STDERR.puts(
                'Gnuplot is not installed, install it depending on your distro'
            )
            exit(-1)
        end

        Gnuplot.open do |gp|
            Gnuplot::Plot.new(gp) do |p|
                p.title title

                p.xlabel 'Time'
                p.ylabel attr

                p.xdata   'time'
                p.timefmt "'%H:%M'"
                p.format  "x '%H:%M'"

                p.style    'data lines'
                p.terminal 'dumb'

                p.data << Gnuplot::DataSet.new([x, y]) do |ds|
                    ds.with      = 'linespoints'
                    ds.linewidth = '3'
                    ds.using     = '1:2'

                    ds.notitle
                end
            end
        end
    end

    # Convert u=rwx,g=rx,o=r to octet
    #
    # @param perm [String] Permissions in human readbale format
    #
    # @return [String] Permissions in octet format
    def self.to_octet(perm)
        begin
            Integer(perm)
            perm
        rescue StandardError
            perm = perm.split(',')
            ret  = 0

            perm.each do |p|
                p = p.split('=')

                next unless p.size == 2

                r = p[1].count('r')
                w = p[1].count('w')
                x = p[1].count('x')

                rwx = (2 ** 0) * x + (2 ** 1) * w + (2 ** 2) * r

                case p[0]
                when 'u'
                    ret += rwx * 100
                when 'g'
                    ret += rwx * 10
                else
                    ret += rwx * 1
                end
            end

            if ret == 0
                STDERR.puts 'Error in permissions format'
                exit(-1)
            else
                ret = ret.to_s

                if ret.size == 1
                    "00#{ret}"
                elsif ret.size == 2
                    "0#{ret}"
                else
                    ret
                end
            end
        end
    end

    def self.schedule_action_tmpl(options, action, warning = nil)
        str_periodic = ''

        if options.key?(:weekly)
            str_periodic << ", REPEAT = 0, DAYS = \"#{options[:weekly]}\""
        elsif options.key?(:monthly)
            str_periodic << ", REPEAT = 1, DAYS = \"#{options[:monthly]}\""
        elsif options.key?(:yearly)
            str_periodic << ", REPEAT = 2, DAYS = \"#{options[:yearly]}\""
        elsif options.key?(:hourly)
            str_periodic << ", REPEAT = 3, DAYS = \"#{options[:hourly]}\""
        end

        if options.key?(:end)
            begin
                end_date = Date.parse(options[:end])
                str_periodic << ", END_TYPE = 2, END_VALUE = #{end_date.to_time.to_i}"
            rescue ArgumentError
                if options[:end].to_i > 0
                    str_periodic << ", END_TYPE = 1, END_VALUE = #{options[:end].to_i}"
                end
            end
        elsif str_periodic != ''
            str_periodic << ', END_TYPE = 0'
        end

        tmp_str = 'SCHED_ACTION = ['
        tmp_str << "ACTION  = #{action}, " if action
        tmp_str << "WARNING = #{warning}," if warning
        tmp_str << "ARGS    = \"#{options[:args]}\"," if options[:args]
        tmp_str << "TIME    = #{options[:schedule]}"
        tmp_str << str_periodic << ']'

        tmp_str
    end

    def self.scheduled_action_table(object)
        CLIHelper::ShowTable.new(nil, object) do
            column :ID, '', :adjust => true do |d|
                warn = d['WARNING'].to_i

                prefix = ''
                prefix = '*' if d['DONE'].to_i <= 0 && warn != 0 && warn < Time.now.to_i

                prefix + d['ID']
            end

            column :ACTION, '', :adjust => true do |d|
                d['ACTION']
            end

            column :ARGS, '', :adjust => true do |d|
                d['ARGS'] && !d['ARGS'].empty? ? d['ARGS'] : '-'
            end

            column :SCHEDULED, '', :adjust => true do |d|
                t = d['TIME'].to_i

                # relative action for VMs
                if d['TIME'] !~ /^[0-9].*/ && !object['STIME'].nil?
                    t += object['STIME'].to_i
                end

                OpenNebulaHelper.time_to_str(t, false) unless d.nil?
            end

            column :REPEAT, '', :adjust => true do |d|
                begin
                    str_rep = ''

                    case d['REPEAT']
                    when '0'
                        str_rep << 'Weekly '
                    when '1'
                        str_rep << 'Monthly '
                    when '2'
                        str_rep << 'Yearly '
                    when '3'
                        str_rep << 'Each ' << d['DAYS'] << ' hours'
                    end

                    if d['REPEAT'] != '3'
                        str_rep << d['DAYS']
                    end

                    str_rep
                rescue StandardError
                    ''
                end
            end

            column :END, '', :adjust => true do |d|
                begin
                    str_end = ''

                    case d['END_TYPE']
                    when '0'
                        str_end << 'None'
                    when '1'
                        str_end << 'After ' << d['END_VALUE'] << ' times'
                    when '2'
                        str_end << 'On ' << \
                            OpenNebulaHelper.time_to_str(d['END_VALUE'], false, false, true)
                    end

                    str_end
                rescue StandardError
                    ''
                end
            end

            column :STATUS, '', :left, :size => 50 do |d|
                begin
                    if d['DONE'].to_i > 0 && d['REPEAT'].to_i < 0
                        "Done on #{OpenNebulaHelper.time_to_str(d['DONE'], false)}"
                    elsif d['MESSAGE'] && !d['MESSAGE'].empty?
                        "Error! #{d['MESSAGE']}"
                    else
                        t1 = Time.now
                        t2 = d['TIME'].to_i

                        # relative action for VMs
                        if (d['TIME'] !~ /^[0-9].*/) && !object['STIME'].nil?
                            t2 += object['STIME'].to_i
                        end

                        t2 = Time.at(t2)

                        days    = ((t2 - t1) / (24 * 3600)).round(2)
                        hours   = ((t2 - t1) / 3600).round(2)
                        minutes = ((t2 - t1) / 60).round(2)

                        if days > 1
                            "Next in #{days} days"
                        elsif days <= 1 && hours > 1
                            "Next in #{hours} hours"
                        elsif minutes > 0
                            "Next in #{minutes} minutes"
                        else
                            'Overdue!'
                        end
                    end
                rescue StandardError
                    ''
                end
            end
        end
    end

    def self.read_stdin
        if STDIN.wait_readable(0)
            STDIN.read()
        else
           ''
        end
    end
end
