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

require 'cli_helper'
require 'open3'
require 'io/console'

begin
    require 'opennebula'
rescue Exception => e
    puts "Error: "+e.message.to_s
    exit(-1)
end

include OpenNebula

module OpenNebulaHelper
    ONE_VERSION=<<-EOT
OpenNebula #{OpenNebula::VERSION}
Copyright 2002-2019, OpenNebula Project, OpenNebula Systems

Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License. You may obtain
a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
EOT

    if ONE_LOCATION
        TABLE_CONF_PATH=ONE_LOCATION+"/etc/cli"
        VAR_LOCATION=ONE_LOCATION+"/var" if !defined?(VAR_LOCATION)
        CLI_ADDONS_LOCATION=ONE_LOCATION+"/lib/ruby/cli/addons"
    else
        TABLE_CONF_PATH="/etc/one/cli"
        VAR_LOCATION="/var/lib/one" if !defined?(VAR_LOCATION)
        CLI_ADDONS_LOCATION="/usr/lib/one/ruby/cli/addons"
    end

    EDITOR_PATH='/usr/bin/vi'

    ########################################################################
    # Options
    ########################################################################
    XML={
        :name  => "xml",
        :short => "-x",
        :large => "--xml",
        :description => "Show the resource in xml format"
    }

    NUMERIC={
        :name  => "numeric",
        :short => "-n",
        :large => "--numeric",
        :description => "Do not translate user and group IDs"
    }

    KILOBYTES={
        :name  => "kilobytes",
        :short => "-k",
        :large => "--kilobytes",
        :description => "Show units in kilobytes"
    }

    DESCRIBE={
        :name  => "describe",
        :large => "--describe",
        :description => "Describe list columns"
    }

    APPEND = {
        :name => "append",
        :short => "-a",
        :large => "--append",
        :description => "Append new attributes to the current template"
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
            :proc => lambda do |o, options|
                OneHelper.set_user(o)
                [0, o]
            end
        },
        {
            :name   => 'password',
            :large  => '--password password',
            :description => 'Password to authenticate with OpenNebula',
            :format => String,
            :proc => lambda do |o, options|
                OneHelper.set_password(o)
                [0, o]
            end
        },
        {
            :name   => 'endpoint',
            :large  => '--endpoint endpoint',
            :description => 'URL of OpenNebula xmlrpc frontend',
            :format => String,
            :proc => lambda do |o, options|
                OneHelper.set_endpoint(o)
                [0, o]
            end
        }
    ]

    GROUP_OPTIONS=[
        {
            :name   => 'name',
            :large  => '--name name',
            :short => "-n",
            :description =>
                'Name for the new group',
            :format => String
        },
        {
            :name   => 'admin_user',
            :large  => '--admin_user name',
            :short => "-u",
            :description =>
                'Creates an admin user for the group with name',
            :format => String
        },
        {
            :name   => 'admin_password',
            :large  => '--admin_password pass',
            :short => "-p",
            :description =>
                'Password for the admin user of the group',
            :format => String
        },
        {
            :name   => 'admin_driver',
            :large  => '--admin_driver driver',
            :short => "-d",
            :description =>
                'Auth driver for the admin user of the group',
            :format => String
        },
        {
            :name   => 'resources',
            :large  => '--resources res_str',
            :short => "-r",
            :description =>
                "Which resources can be created by group users "<<
                "(VM+NET+IMAGE+TEMPLATE by default)",
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

    #NOTE: Other options defined using this array, add new options at the end
    TEMPLATE_OPTIONS=[
        {
            :name   => 'cpu',
            :large  => '--cpu cpu',
            :description =>
                "CPU percentage reserved for the VM (1=100% one\n"<<
                " "*31<<"CPU)",
            :format => Float
        },
        {
            :name   => 'vcpu',
            :large  => '--vcpu vcpu',
            :description =>
                "Number of virtualized CPUs",
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
                "can be used: 8g=8192, 0.5g=512",
            :format => String,
            :proc   => lambda do |o,options|
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
            :description => "Disks to attach. To use an image owned by"<<
                            " other user use user[disk]. Add any additional"<<
                            " attributes separated by ':' and in the shape of"<<
                            " KEY=VALUE. For example, if the disk must be"<<
                            " resized, use image0:size=1000 . Or"<<
                            " image0:size=1000:target=vda,image1:target=vdb",
            :format => Array
        },
        {
            :name   => 'nic',
            :large  => '--nic network0,network1',
            :description => "Networks to attach. To use a network owned by"<<
                            " other user use user[network]. Additional"<<
                            " attributes are supported like with the --disk"<<
                            " option. Also you can use auto if you want that" <<
                            " OpenNebula select automatically the network",
            :format => Array
        },
        {
            :name   => 'raw',
            :large  => '--raw string',
            :description => "Raw string to add to the template. Not to be\n"<<
                            " "*31<<"confused with the RAW attribute",
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
                (' '*31) << "SSH_PUBLIC_KEY will be used.",
            :format => String,
            :proc => lambda do |o, options|
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
            :description => 'Lines to add to the context section'
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
            :description => "In a vCenter environment sets the the VMs and Template folder where the VM will be placed in." \
            " The path uses slashes to separate folders. For example: --vcenter_vm_folder \"/Management/VMs\""
        },
        {
            :name   => 'user_inputs',
            :large  => '--user-inputs ui1,ui2,ui3',
            :format => Array,
            :description => 'Specify the user inputs values when instantiating',
            :proc => lambda do |o, options|
                # escape values
                options[:user_inputs].map! do |user_input|
                    user_input_split = user_input.split('=')
                    "#{user_input_split[0]}=\"#{user_input_split[1]}\""
                end

                options[:user_inputs] = o.join("\n")
            end
        },
        AS_GROUP,
        AS_USER
    ]

    FORCE={
        :name  => 'force',
        :large  => '--force',
        :description => 'Overwrite the file'
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

    TEMPLATE_OPTIONS_VM   = [TEMPLATE_NAME_VM] + TEMPLATE_OPTIONS + [DRY]

    CAPACITY_OPTIONS_VM   = [TEMPLATE_OPTIONS[0], TEMPLATE_OPTIONS[1],
      TEMPLATE_OPTIONS[3]]

    UPDATECONF_OPTIONS_VM = TEMPLATE_OPTIONS[6..15] + [TEMPLATE_OPTIONS[2],
      TEMPLATE_OPTIONS[17], TEMPLATE_OPTIONS[18]]

    OPTIONS = XML, EXTENDED, NUMERIC, KILOBYTES

    class OneHelper
        attr_accessor :client

        def self.get_client(options={}, force=false)
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
                    password=password||options[:password]||self.get_password
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
                self.get_client
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

        if RUBY_VERSION>="1.9.3"
            require 'io/console'
            def self.get_password
                print "Password: "
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
                print "Password: "
                system("stty", "-echo")
                begin
                    @@password = STDIN.gets.chop
                    return @@password
                ensure
                    system("stty", "echo")
                    print "\n"
                end
            end
        end

        def initialize(secret=nil, endpoint=nil)
            @client=nil

            @translation_hash = nil
        end

        def set_client(options)
            @client=OpenNebulaHelper::OneHelper.get_client(options, true)
        end

        def create_resource(options, &block)
            resource = factory

            rc = block.call(resource)
            if OpenNebula.is_error?(rc)
                return -1, rc.message
            else
                puts "ID: #{resource.id.to_s}"
                return 0
            end
        end

        #-----------------------------------------------------------------------
        #  List pool functions
        #-----------------------------------------------------------------------
        def start_pager
            pager = ENV['ONE_PAGER'] || 'more'

            # Start pager, defaults to less
            p_r, p_w = IO.pipe

            Signal.trap('PIPE', 'SIG_IGN')

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

            return lpid
        end

        def stop_pager(lpid)
            $stdout.close

            begin
                Process.wait(lpid)
            rescue Interrupt
                Process.kill("TERM", lpid)
                Process.wait(lpid)
            rescue Errno::ECHILD
            end
        end

        def print_page(pool, options)
            page = nil

            if options[:xml]
                elements = 0
                page     = ""

                pool.each {|e|
                    elements += 1
                    page << e.to_xml(true) << "\n"
                }
            else
                pname = pool.pool_name
                ename = pool.element_name

                page  = pool.to_hash
                elems = page["#{pname}"]["#{ename}"]

                if elems.class == Array
                    elements = elems.length
                else
                    elements = 1
                end
            end

            return elements, page
        end

        #-----------------------------------------------------------------------
        # List the pool in table form, it uses pagination for interactive
        # output
        #-----------------------------------------------------------------------
        def list_pool_table(table, pool, options, filter_flag)
            if $stdout.isatty and (!options.key?:no_pager)
                size = $stdout.winsize[0] - 1

                # ----------- First page, check if pager is needed -------------
                rc = pool.get_page(size, 0, false)
                ps = ""

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
                    rc = pool.get_page(size, current, false)

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
                array = pool.get_hash
                return -1, array.message if OpenNebula.is_error?(array)

                rname    = self.class.rname
                elements = array["#{rname}_POOL"][rname]

               if options[:ids] && elements
                    elements.reject! do |element|
                        !options[:ids].include?(element['ID'].to_i)
                    end
                end

                table.show(array, options)
            end

            return 0
        end

        #-----------------------------------------------------------------------
        # List pool in XML format, pagination is used in interactive output
        #-----------------------------------------------------------------------
        def list_pool_xml(pool, options, filter_flag)
            extended = options.include?(:extended) && options[:extended]

            if $stdout.isatty and (!options.key?:no_pager)
                size = $stdout.winsize[0] - 1

                # ----------- First page, check if pager is needed -------------
                rc = pool.get_page(size, 0, extended)
                ps = ""

                return -1, rc.message if OpenNebula.is_error?(rc)

                pname = pool.pool_name

                elements, page = print_page(pool, options)

                ppid = -1

                if elements >= size
                    ppid = start_pager
                end

                puts "<#{pname}>"

                puts page

                if elements < size
                    puts "</#{pname}>"
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
                    rc = pool.get_page(size, current, extended)

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
                if pool.pool_name == "VM_POOL" && extended
                    rc = pool.info_all_extended
                else
                    rc = pool.info
                end

                return -1, rc.message if OpenNebula.is_error?(rc)

                puts pool.to_xml(true)
            end

            return 0
        end

        #-----------------------------------------------------------------------
        # List pool table in top-like form
        #-----------------------------------------------------------------------
        def list_pool_top(table, pool, options)
            table.top(options) {
                array = pool.get_hash

                return -1, array.message if OpenNebula.is_error?(array)

                array
            }

            return 0
        end


        def list_pool(options, top=false, filter_flag=nil)
            table = format_pool(options)

            if options[:describe]
                table.describe_columns

                return 0
            end

            filter_flag ||= OpenNebula::Pool::INFO_ALL

            pool  = factory_pool(filter_flag)

            if top
                return list_pool_top(table, pool, options)
            elsif options[:xml]
                return list_pool_xml(pool, options, filter_flag)
            else
                return list_pool_table(table, pool, options, filter_flag)
            end

            return 0
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
                return 0, resource.to_xml(true)
            else
                format_resource(resource, options)
                return 0
            end
        end

        def perform_action(id, options, verbose, &block)
            resource = retrieve_resource(id)

            rc = block.call(resource)
            if OpenNebula.is_error?(rc)
                return -1, rc.message
            else
                if options[:verbose]
                    puts "#{self.class.rname} #{id}: #{verbose}"
                end
                return 0
            end
        end

        def perform_actions(ids,options,verbose,&block)
            exit_code = 0
            ids.each do |id|
                rc = perform_action(id,options,verbose,&block)

                unless rc[0]==0
                    puts rc[1]
                    exit_code=rc[0]
                end
            end

            exit_code
        end

        ########################################################################
        # Id translation
        ########################################################################
        def user_name(resource, options={})
            if options[:numeric]
                resource['UID']
            else
                resource['UNAME']
            end
        end

        def group_name(resource, options={})
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
            "OpenNebula #{self.rname} name or id"
        end

        def list_to_id(names)
            rc = get_pool
            return rc if rc.first != 0

            pool     = rc[1]
            poolname = self.class.rname

            result = names.split(',').collect { |name|
                if name.match(/^[0123456789]+$/)
                    name.to_i
                else
                    rc = OneHelper.name_to_id(name, pool, poolname)

                    if rc.first == -1
                        return rc[0], rc[1]
                    end

                    rc[1]
                end
            }

            return 0, result
        end

        def self.list_to_id_desc
            "Comma-separated list of OpenNebula #{self.rname} names or ids"
        end

        def self.name_to_id(name, pool, ename)
            if ename=="CLUSTER" and name.upcase=="ALL"
                return 0, "ALL"
            end

            objects=pool.select {|object| object.name==name }

            if objects.length>0
                if objects.length>1
                    return -1, "There are multiple #{ename}s with name #{name}."
                else
                    result = objects.first.id
                end
            else
                return -1, "#{ename} named #{name} not found."
            end

            return 0, result
        end

        def filterflag_to_i(str)
            filter_flag = case str
            when "a", "all"   then OpenNebula::Pool::INFO_ALL
            when "m", "mine"  then OpenNebula::Pool::INFO_MINE
            when "g", "group" then OpenNebula::Pool::INFO_GROUP
            when "G", "primary group" then OpenNebula::Pool::INFO_PRIMARY_GROUP
            else
                if str.match(/^[0123456789]+$/)
                    str.to_i
                else
                    rc = OpenNebulaHelper.rname_to_id(str, "USER")
                    if rc.first==-1
                        return rc
                    else
                        rc[1]
                    end
                end
            end

            return 0, filter_flag
        end

        def self.filterflag_to_i_desc
            desc=<<-EOT
a, all            all the known #{self.rname}s
m, mine           the #{self.rname} belonging to the user in ONE_AUTH
g, group          'mine' plus the #{self.rname} belonging to the groups
                  the user is member of
G, primary group  the #{self.rname} owned the user's primary group
uid               #{self.rname} of the user identified by this uid
user              #{self.rname} of the user identified by the username
EOT
        end

        def self.table_conf(conf_file=self.conf_file)
            path = "#{ENV["HOME"]}/.one/cli/#{conf_file}"

            if File.exists?(path)
                return path
            else
                return "#{TABLE_CONF_PATH}/#{conf_file}"
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
                phash = Array.new
            end

            phash
        end

        def get_pool
            user_flag = OpenNebula::Pool::INFO_ALL
            pool = factory_pool(user_flag)

            rc = pool.info
            if OpenNebula.is_error?(rc)
                if rc.message.empty?
                    return -1, "OpenNebula #{self.class.rname} name not " <<
                           "found, use the ID instead"
                else
                    return -1,rc.message
                end
            end

            return 0, pool
        end
    end

    def OpenNebulaHelper.rname_to_id(name, poolname)
        return 0, name.to_i if name.match(/^[0123456789]+$/)

        client=OneHelper.client

        pool = case poolname
        when "HOST"        then OpenNebula::HostPool.new(client)
        when "HOOK"        then OpenNebula::HookPool.new(client)
        when "GROUP"       then OpenNebula::GroupPool.new(client)
        when "USER"        then OpenNebula::UserPool.new(client)
        when "DATASTORE"   then OpenNebula::DatastorePool.new(client)
        when "CLUSTER"     then OpenNebula::ClusterPool.new(client)
        when "VNET"        then OpenNebula::VirtualNetworkPool.new(client)
        when "IMAGE"       then OpenNebula::ImagePool.new(client)
        when "VMTEMPLATE"  then OpenNebula::TemplatePool.new(client)
        when "VM"          then OpenNebula::VirtualMachinePool.new(client)
        when "ZONE"        then OpenNebula::ZonePool.new(client)
        when "MARKETPLACE" then OpenNebula::MarketPlacePool.new(client)
        end

        rc = pool.info
        if OpenNebula.is_error?(rc)
            return -1, "OpenNebula #{poolname} name not found," <<
                       " use the ID instead"
        end

        OneHelper.name_to_id(name, pool, poolname)
    end

    def OpenNebulaHelper.size_in_mb(size)
        m = size.match(/^(\d+(?:\.\d+)?)(t|tb|m|mb|g|gb)?$/i)

        if !m
            # return OpenNebula::Error.new('Size value malformed')
            return -1, 'Size value malformed'
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
            return 0, value.ceil
        end
    end

    def OpenNebulaHelper.rname_to_id_desc(poolname)
        "OpenNebula #{poolname} name or id"
    end

    def OpenNebulaHelper.boolean_to_str(str)
        if str.to_i == 1
            "Yes"
        else
            "No"
        end
    end

    def OpenNebulaHelper.time_to_str(time, print_seconds=true,
        print_hours=true, print_years=false)

        value = time.to_i

        if value==0
            value='-'
        else
            if print_hours
                if print_seconds
                    if print_years
                        value=Time.at(value).strftime("%m/%d/%y %H:%M:%S")
                    else
                        value=Time.at(value).strftime("%m/%d %H:%M:%S")
                    end
                else
                    if print_years
                        value=Time.at(value).strftime("%m/%d/%y %H:%M")
                    else
                        value=Time.at(value).strftime("%m/%d %H:%M")
                    end
                end
            else
                if print_years
                    value=Time.at(value).strftime("%m/%d/%y")
                else
                    value=Time.at(value).strftime("%m/%d")
                end
            end
        end

        return value
    end

    def OpenNebulaHelper.period_to_str(time, print_seconds=true)
        seconds=time.to_i
        minutes, seconds=seconds.divmod(60)
        hours, minutes=minutes.divmod(60)
        days, hours=hours.divmod(24)

        if print_seconds
            "%3dd %02dh%02dm%02ds" % [days, hours, minutes, seconds]
        else
            "%3dd %02dh%02dm" % [days, hours, minutes]
        end
    end

    def OpenNebulaHelper.short_period_to_str(time, print_seconds=true)
        seconds=time.to_i
        minutes, seconds=seconds.divmod(60)
        hours, minutes=minutes.divmod(60)

        if print_seconds
            "%3dh%02dm%02ds" % [hours, minutes, seconds]
        else
            "%3dh%02dm" % [hours, minutes]
        end
    end

    BinarySufix = ["K", "M", "G", "T" ]

    def OpenNebulaHelper.unit_to_str(value, options, unit="K")
        if options[:kilobytes]
            value
        else
            i=BinarySufix.index(unit).to_i

            while value > 1024 && i < 3 do
                value /= 1024.0
                i+=1
            end

            value = (value * 10).round / 10.0

            value = value.to_i if value - value.round == 0
            st = value.to_s + BinarySufix[i]
        end
    end

    # If the cluster name is empty, returns a '-' char.
    #
    # @param str [String || Hash] Cluster name, or empty Hash (when <CLUSTER/>)
    # @return [String] the same Cluster name, or '-' if it is empty
    def OpenNebulaHelper.cluster_str(str)
        if str != nil && !str.empty?
            str
        else
            "-"
        end
    end

    def OpenNebulaHelper.clusters_str(clusters)
        if clusters.nil?
            "-"
        else
            [clusters].flatten.join(',')
        end

    end

    def OpenNebulaHelper.update_template(id, resource, path=nil, xpath='TEMPLATE')
        return update_template_helper(false, id, resource, path, xpath)
    end

    def OpenNebulaHelper.append_template(id, resource, path=nil, xpath='TEMPLATE')
        return update_template_helper(true, id, resource, path, xpath)
    end

    def OpenNebulaHelper.update_template_helper(append, id, resource, path, xpath, update=true)
        if path
            return File.read(path)
        elsif append
            return editor_input()
        else
            if update
                rc = resource.info

                if OpenNebula.is_error?(rc)
                    puts rc.message
                    exit -1
                end
            end

            return editor_input(resource.template_like_str(xpath))
        end
    end

    def OpenNebulaHelper.editor_input(contents=nil)
        require 'tempfile'

        tmp  = Tempfile.new("one_cli")

        if contents
            tmp << contents
            tmp.flush
        end

        editor_path = ENV["EDITOR"] ? ENV["EDITOR"] : EDITOR_PATH
        system("#{editor_path} #{tmp.path}")

        unless $?.exitstatus == 0
            puts "Editor not defined"
            exit -1
        end

        tmp.close

        str = File.read(tmp.path)
        return str
    end

    def self.parse_user_object(user_object)
        reg=/^([^\[]+)(?:\[([^\]]+)\])?$/

        m=user_object.match(reg)

        return nil if !m

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
            obj, *extra_attributes = obj.split(":")

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
                if str.include?("=")
                    attrs << str
                else
                    attrs.last << ":#{str}"
               end
            end

            extra_attributes = attrs

            res=parse_user_object(obj)
            return [-1, "#{section.capitalize} \"#{obj}\" malformed"] if !res
            user, object=*res

            template<<"#{section.upcase}=[\n"
            if object.downcase == "auto"
                template<<"  NETWORK_MODE=\"#{object}\"\n"
            else
                template<<"  #{name.upcase}_UNAME=\"#{user}\",\n" if user
                extra_attributes.each do |extra_attribute|
                    key, value = extra_attribute.split("=")
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
        context_options = [:ssh, :net_context, :context, :init, :files_ds, :startscript, :report_ready]
        if !(options.keys & context_options).empty?
            lines=[]

            if options[:ssh]
                if options[:ssh]==true
                    lines<<"SSH_PUBLIC_KEY=\"$USER[SSH_PUBLIC_KEY]\""
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
                lines << "NETWORK = \"YES\""
            end

            lines+=options[:context] if options[:context]

            if options[:files_ds]
                text='FILES_DS="'
                text << options[:files_ds].map do |file|
                    %Q<$FILE[IMAGE=\\"#{file}\\"]>
                end.join(' ')
                text << '"'

                lines << text
            end

            if options[:init]
                lines << %Q<INIT_SCRIPTS="#{options[:init].join(' ')}">
            end

            if options[:startscript]
                script = nil
                begin
                    script = File.read(options[:startscript]).strip
                rescue Exception => e
                    STDERR.puts e.message
                    exit(-1)
                end
                script = Base64::strict_encode64(script)
                lines<<"START_SCRIPT_BASE64=\"#{script}\""
            end

            if options[:report_ready]
                lines << "REPORT_READY = \"YES\""
            end

            if !lines.empty?
                "CONTEXT=[\n" << lines.map{|l| "  " << l }.join(",\n") << "\n]\n"
            else
                nil
            end
        else
            nil
        end
    end

    def self.create_template(options, template_obj=nil)
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
            vnc_listen=options[:vnc_listen] || "0.0.0.0"
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
            spice_listen=options[:spice_listen] || "0.0.0.0"
            template<<"GRAPHICS=[ TYPE=\"spice\", LISTEN=\"#{spice_listen}\""
            if options[:spice_password]
                template << ", PASSWD=\"#{options[:spice_password]}\""
            end
            if options[:spice_keymap]
                template << ", KEYMAP=\"#{options[:spice_keymap]}\""
            end
            template<<' ]' << "\n"
        end

        template<<"VCENTER_VM_FOLDER=#{options[:vcenter_vm_folder]}\n" if options[:vcenter_vm_folder]

        context=create_context(options)
        template<<context if context

        if options[:userdata] && !template_obj.nil?
            if template_obj.has_elements?('TEMPLATE/EC2')
                template_obj.add_element(
                    'TEMPLATE/EC2',
                    'USERDATA' => options[:userdata])

                template << template_obj.template_like_str(
                    'TEMPLATE', false, 'EC2')
            end
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
            STDERR.puts 'Address range needs to specify size (-s size)'
            exit(-1)
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

    def self.create_template_options_used?(options)
        # Get the template options names as symbols. options hash
        # uses symbols
        template_options=OpenNebulaHelper::TEMPLATE_OPTIONS.map do |o|
            o[:name].to_sym
        end

        # Check if one at least one of the template options is
        # in options hash
        (template_options-options.keys)!=template_options
    end

    def self.sunstone_url
        if (one_sunstone = ENV['ONE_SUNSTONE'])
           one_sunstone
        elsif (one_xmlrpc = ENV['ONE_XMLRPC'])
            uri = URI(one_xmlrpc)
            "#{uri.scheme}://#{uri.host}:9869"
        else
            "http://localhost:9869"
        end
    end

    def self.download_resource_sunstone(kind, id, path, force)
        client = OneHelper.client
        user, password = client.one_auth.split(":", 2)

        # Step 1: Build Session to get Cookie
        uri = URI(File.join(sunstone_url,"login"))

        req = Net::HTTP::Post.new(uri)
        req.basic_auth user, password

        begin
            res = Net::HTTP.start(uri.hostname, uri.port) do |http|
                http.request(req)
            end
        rescue
            return OpenNebula::Error.new("Error connecting to '#{uri}'.")
        end

        cookie = res.response['set-cookie'].split('; ')[0]

        if cookie.nil?
           return OpenNebula::Error.new("Unable to get Cookie. Is OpenNebula running?")
        end

        # Step 2: Open '/' to get the csrftoken
        uri = URI(sunstone_url)

        req = Net::HTTP::Get.new(uri)
        req['Cookie'] = cookie

        begin
            res = Net::HTTP.start(uri.hostname, uri.port) do |http|
                http.request(req)
            end
        rescue
            return OpenNebula::Error.new("Error connecting to '#{uri}'.")
        end

        m = res.body.match(/var csrftoken = '(.*)';/)
        csrftoken = m[1] rescue nil

        if csrftoken.nil?
           return OpenNebula::Error.new("Unable to get csrftoken.")
        end

        # Step 3: Download resource
        uri = URI(File.join(sunstone_url,
                            kind.to_s,
                            id.to_s,
                            "download?csrftoken=#{csrftoken}"))

        req = Net::HTTP::Get.new(uri)

        req['Cookie'] = cookie
        req['User-Agent'] = "OpenNebula CLI"

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
            return OpenNebula::Error.new("Target file not writable.")
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

        if error_message
            File.unlink(path)
            return OpenNebula::Error.new("Remote server error: #{error_message}")
        end
    end

    def OpenNebulaHelper.level_lock_to_str(str)
        level = str.to_i
        if level == 0
            "None"
        elsif level == 1
            "Use"
        elsif level == 2
            "Manage"
        elsif level == 3
            "Admin"
        elsif level == 4
            "All"
        else
            "-"
        end
    end

    def OpenNebulaHelper.parse_user_inputs(inputs, get_defaults = false)
        unless get_defaults
            puts 'There are some parameters that require user input. ' \
                 'Use the string <<EDITOR>> to launch an editor ' \
                 '(e.g. for multi-line inputs)'
        end

        answers = {}

        inputs.each do |key, val|
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

            if get_defaults
                answers[key]= initial unless mandatory == 'M'
                next
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

                unless %w[YES NO].include?(answer)
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
                    exp = INT_EXP
                else
                    header += 'Float: '
                    exp = FLOAT_EXP
                end

                begin
                    print header
                    answer = STDIN.readline.chop

                    answer = initial if answer == ''
                        noanswer = ((answer == '') && optional)
                end while !noanswer && (answer =~ exp) == nil

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
                    exp = INT_EXP
                    min = min.to_i
                    max = max.to_i

                    header += "Integer in the range [#{min}..#{max}]: "
                else
                    exp = FLOAT_EXP
                    min = min.to_f
                    max = max.to_f

                    header += "Float in the range [#{min}..#{max}]: "
                end

                begin
                    print header
                    answer = STDIN.readline.chop

                    answer = initial if answer == ''

                    noanswer = (answer == '') && optional
                end while !noanswer && ((answer =~ exp) == nil ||
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

                    noanswer = ((answer == '') && optional)
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

end
