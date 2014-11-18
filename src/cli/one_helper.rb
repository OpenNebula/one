# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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
Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs

Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License. You may obtain
a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
EOT

    if ONE_LOCATION
        TABLE_CONF_PATH=ONE_LOCATION+"/etc/cli"
    else
        TABLE_CONF_PATH="/etc/one/cli"
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
        },
        {
            :name   => 'admin_resources',
            :large  => '--admin_resources res_str',
            :short => "-o",
            :description =>
                "Which resources can be created by the admin user "<<
                "(VM+NET+IMAGE+TEMPLATE by default)",
            :format => String
        }
    ]

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
                            " other user use user[disk]",
            :format => Array
        },
        {
            :name   => 'nic',
            :large  => '--nic network0,network1',
            :description => "Networks to attach. To use a network owned by"<<
                            " other user use user[network]",
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
            :name   => 'ssh',
            :large  => '--ssh [file]',
            :description => "Add an ssh public key to the context. If the \n"<<
                (' '*31)<<"file is omited then the user variable \n"<<
                (' '*31)<<"SSH_PUBLIC_KEY will be used.",
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
            :large  => '--boot device',
            :description => 'Select boot device (hd|fd|cdrom|network)',
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
        }
    ]

    TEMPLATE_OPTIONS_VM=[TEMPLATE_NAME_VM]+TEMPLATE_OPTIONS+[DRY]

    CAPACITY_OPTIONS_VM=[TEMPLATE_OPTIONS[0],TEMPLATE_OPTIONS[1],TEMPLATE_OPTIONS[3]]

    OPTIONS = XML, NUMERIC, KILOBYTES

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

                @@client=OpenNebula::Client.new(secret, endpoint, :sync => sync)
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

        def list_pool(options, top=false, filter_flag=nil)
            if options[:describe]
                table = format_pool(options)

                table.describe_columns
                return 0
            end

            filter_flag ||= OpenNebula::Pool::INFO_ALL

            pool = factory_pool(filter_flag)

            if options[:xml]
                # TODO: use paginated functions
                rc=pool.info
                return -1, rc.message if OpenNebula.is_error?(rc)
                return 0, pool.to_xml(true)
            else
                table = format_pool(options)

                if top
                    table.top(options) {
                        array=pool.get_hash
                        return -1, array.message if OpenNebula.is_error?(array)

                        array
                    }
                else
                    array=pool.get_hash
                    return -1, array.message if OpenNebula.is_error?(array)

                    rname=self.class.rname
                    elements=array["#{rname}_POOL"][rname]
                    if options[:ids] && elements
                        elements.reject! do |element|
                            !options[:ids].include?(element['ID'].to_i)
                        end
                    end

                    table.show(array, options)
                end

                return 0
            end
        end

        def show_resource(id, options)
            resource = retrieve_resource(id)

            rc = resource.info
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
a, all       all the known #{self.rname}s
m, mine      the #{self.rname} belonging to the user in ONE_AUTH
g, group     'mine' plus the #{self.rname} belonging to the groups
             the user is member of
uid          #{self.rname} of the user identified by this uid
user         #{self.rname} of the user identified by the username
EOT
        end

        def self.table_conf
            path = "#{ENV["HOME"]}/.one/cli/#{self.conf_file}"

            if File.exists?(path)
                return path
            else
                return "#{TABLE_CONF_PATH}/#{self.conf_file}"
            end
        end

        private

        def retrieve_resource(id)
            factory(id)
        end

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
                return -1, "OpenNebula #{self.class.rname} name not " <<
                           "found, use the ID instead"
            end

            return 0, pool
        end
    end

    def OpenNebulaHelper.rname_to_id(name, poolname)
        return 0, name.to_i if name.match(/^[0123456789]+$/)

        client=OneHelper.client

        pool = case poolname
        when "HOST"      then OpenNebula::HostPool.new(client)
        when "GROUP"     then OpenNebula::GroupPool.new(client)
        when "USER"      then OpenNebula::UserPool.new(client)
        when "DATASTORE" then OpenNebula::DatastorePool.new(client)
        when "CLUSTER"   then OpenNebula::ClusterPool.new(client)
        when "VNET"      then OpenNebula::VirtualNetworkPool.new(client)
        when "IMAGE"     then OpenNebula::ImagePool.new(client)
        when "VMTEMPLATE" then OpenNebula::TemplatePool.new(client)
        when "VM"        then OpenNebula::VirtualMachinePool.new(client)
        when "ZONE"      then OpenNebula::ZonePool.new(client)
        end

        rc = pool.info
        if OpenNebula.is_error?(rc)
            return -1, "OpenNebula #{poolname} name not found," <<
                       " use the ID instead"
        end

        OneHelper.name_to_id(name, pool, poolname)
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

    def OpenNebulaHelper.time_to_str(time, print_seconds=true)
        value=time.to_i
        if value==0
            value='-'
        else
            if print_seconds
                value=Time.at(value).strftime("%m/%d %H:%M:%S")
            else
                value=Time.at(value).strftime("%m/%d %H:%M")
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

    def OpenNebulaHelper.update_template(id, resource, path=nil, xpath='TEMPLATE')
        return update_template_helper(false, id, resource, path, xpath)
    end

    def OpenNebulaHelper.append_template(id, resource, path=nil, xpath='TEMPLATE')
        return update_template_helper(true, id, resource, path, xpath)
    end

    def OpenNebulaHelper.update_template_helper(append, id, resource, path, xpath, update=true)
        unless path
            require 'tempfile'

            tmp  = Tempfile.new(id.to_s)
            path = tmp.path

            if !append
                if update
                    rc = resource.info

                    if OpenNebula.is_error?(rc)
                        puts rc.message
                        exit -1
                    end
                end

                tmp << resource.template_like_str(xpath)
                tmp.flush
            end

            editor_path = ENV["EDITOR"] ? ENV["EDITOR"] : EDITOR_PATH
            system("#{editor_path} #{path}")

            unless $?.exitstatus == 0
                puts "Editor not defined"
                exit -1
            end

            tmp.close
        end

        str = File.read(path)
        str
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
            res=parse_user_object(obj)
            return [-1, "#{section.capitalize} \"#{obj}\" malformed"] if !res
            user, object=*res

            template<<"#{section.upcase}=[\n"
            template<<"  #{name.upcase}_UNAME=\"#{user}\",\n" if user
            if object.match(/^\d+$/)
                template<<"  #{name.upcase}_ID=#{object}\n"
            else
                template<<"  #{name.upcase}=\"#{object}\"\n"
            end
            template<<"]\n"
        end if objects

        [0, template]
    end

    def self.create_context(options)
        context_options = [:ssh, :net_context, :context, :init, :files_ds]
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

            if !lines.empty?
                "CONTEXT=[\n"<<lines.map{|l| "  "<<l }.join(",\n")<<"\n]\n"
            else
                nil
            end
        else
            nil
        end
    end

    def self.create_template(options)
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
            template<<' ]'<<"\n"
        end

        if options[:spice]
            spice_listen=options[:spice_listen] || "0.0.0.0"
            template<<"GRAPHICS=[ TYPE=\"spice\", LISTEN=\"#{spice_listen}\""
            if options[:spice_password]
                template << ", PASSWD=\"#{options[:spice_password]}\""
            end
            template<<' ]'<<"\n"
        end

        context=create_context(options)
        template<<context if context

        [0, template]
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
end
