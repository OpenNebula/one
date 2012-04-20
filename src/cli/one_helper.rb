# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'OpenNebula'
include OpenNebula

module OpenNebulaHelper
    ONE_VERSION=<<-EOT
OpenNebula 3.5.0
Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)

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

    OPTIONS = XML, NUMERIC, KILOBYTES

    class OneHelper
        def initialize(secret=nil, endpoint=nil)
            begin
                @client = OpenNebula::Client.new(secret,endpoint)
            rescue Exception => e
                puts e.message
                exit -1
            end

            @translation_hash = nil
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
            filter_flag ||= OpenNebula::Pool::INFO_ALL

            pool = factory_pool(filter_flag)

            rc = pool.info
            return -1, rc.message if OpenNebula.is_error?(rc)

            if options[:xml]
                return 0, pool.to_xml(true)
            else
                table = format_pool(options)

                if top
                    table.top(options) {
                        pool.info
                        pool_to_array(pool)
                    }
                else
                    table.show(pool_to_array(pool), options)
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
                format_resource(resource)
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

                    if rc.first==-1
                        return -1, "OpenNebula #{poolname} #{name} " <<
                                   "not found, use the ID instead"
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

        client = OpenNebula::Client.new

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

    def OpenNebulaHelper.time_to_str(time)
        value=time.to_i
        if value==0
            value='-'
        else
            value=Time.at(value).strftime("%m/%d %H:%M:%S")
        end
    end

    def OpenNebulaHelper.period_to_str(time)
        seconds=time.to_i
        minutes, seconds=seconds.divmod(60)
        hours, minutes=minutes.divmod(60)
        days, hours=hours.divmod(24)

        "%4dd %02d:%02d:%02d" % [days, hours, minutes, seconds]
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

    def OpenNebulaHelper.update_template(id, resource, path=nil)
        unless path
            require 'tempfile'

            tmp  = Tempfile.new(id.to_s)
            path = tmp.path

            rc = resource.info

            if OpenNebula.is_error?(rc)
                puts rc.message
                exit -1
            end

            tmp << resource.template_str
            tmp.flush

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
end
