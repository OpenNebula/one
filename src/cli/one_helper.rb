# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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
OpenNebula 2.3.0
Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)

Licensed under the Apache License, Version 2.0 (the "License"); you may
not use this file except in compliance with the License. You may obtain
a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
EOT

    if ONE_LOCATION
        TABLE_CONF_PATH=ONE_LOCATION+"/etc/cli"
    else
        TABLE_CONF_PATH="/etc/one/cli"
    end

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
        def initialize
            @client = OpenNebula::Client.new
            @translation_hash = nil
        end

        def create_resource(options, &block)
            resource = factory

            rc = block.call(resource)
            if OpenNebula.is_error?(rc)
                return -1, rc.message
            else
                puts "ID: #{resource.id.to_s}" if options[:verbose]
                return 0
            end
        end

        def list_pool(options, top=false)
            user_flag = options[:filter_flag] ? options[:filter_flag] : -2
            pool = factory_pool(user_flag)

            rc = pool.info
            return -1, rc.message if OpenNebula.is_error?(rc)

            if options[:xml]
                return 0, pool.to_xml(true)
            else
                format_pool(pool, options, top)
                return 0
            end
        end

        def show_resource(id, options)
            resource = retrieve_resource(id)
            return -1, resource.message if OpenNebula.is_error?(resource)

            if options[:xml]
                return 0, resource.to_xml(true)
            else
                format_resource(resource)
                return 0
            end
        end

        def perform_action(id, options, verbose, &block)
            resource = retrieve_resource(id)
            return -1, resource.message if OpenNebula.is_error?(resource)

            rc = block.call(resource)
            if OpenNebula.is_error?(rc)
                return -1, rc.message
            else
                puts "#{self.class.rname} #{id}: #{verbose}" if options[:verbose]
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
        def uid_to_str(uid, options)
            rid_to_str(:users, uid, options)
        end

        def gid_to_str(gid, options)
            rid_to_str(:groups, gid, options)
        end

        ########################################################################
        # Formatters for arguments
        ########################################################################
        def to_id(name, pool=nil)
            return 0, name if name.match(/^[0123456789]+$/)

            user_flag = -2
            pool = pool ? pool : factory_pool(user_flag)

            rc = pool.info
            return -1, rc.message if OpenNebula.is_error?(rc)

            objects=pool.select {|object| object.name==name }

            if objects.length>0
                if objects.length>1
                    rname = Object.const_get(self.class.name)::RESOURCE
                    return -1, "There are multiple #{rname}s with name #{name}."
                else
                    result = objects.first.id
                end
            else
                rname=Object.const_get(self.class.name)::RESOURCE
                return -1,  "#{rname} named #{name} not found."
            end

            return 0, result
        end

        def self.to_id_desc
            "OpenNebula #{self.rname} name or id"
        end

        def list_to_id(names)
            user_flag = -2
            pool = factory_pool(user_flag)

            rc = pool.info
            return -1, rc.message if OpenNebula.is_error?(rc)

            result = names.split(',').collect { |name|
                rc = to_id(name)
                unless rc.first==0
                    return rc
                end
                rc[1]
            }

            return 0, result
        end

        def self.list_to_id_desc
            "Comma-separated list of OpenNebula #{self.rname} names or ids"
        end

        def filterflag_to_i(str)
            filter_flag = case str
            when "a", "all" then "-2"
            when "m", "mine" then "-3"
            when "g", "group" then "-1"
            else
                if str.match(/^[0123456789]+$/)
                    str
                else
                    user = translation_hash[:users].select { |k,v| v==str }
                    user.length > 0 ? user.first.first : "-2"
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

        private

        def retrieve_resource(id)
            resource = factory(id)

            rc = resource.info
            OpenNebula.is_error?(rc) ? rc : resource
        end

        def translation_hash
            @translation_hash ||= {
                :users => generate_resource_translation(UserPool),
                :groups => generate_resource_translation(GroupPool)
            }
        end

        def generate_resource_translation(pool)
            p = pool.new(@client)
            p.info

            hash = Hash.new
            p.each { |r| hash[r["ID"]]=r["NAME"] }
            hash
        end

        def rid_to_str(resource, id, options)
            if options[:numeric]
                id
            else
                if name = translation_hash[resource][id]
                    name
                else
                    id
                end
            end
        end
    end

    def OpenNebulaHelper.public_to_str(str)
        if str.to_i == 1
            public_str = "Y"
        else
            public_str = "N"
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

    BinarySufix = ["K", "M", "G", "T" ]

    def OpenNebulaHelper.unit_to_str(value, options)
        if options[:kilobytes]
            value
        else
            i=0

            while value > 1024 && i < 3 do
                value /= 1024.0
                i+=1
            end

            value = (value * 10).round / 10.0

            value = value.to_i if value - value.round == 0
            st = value.to_s + BinarySufix[i]
        end
    end

    def OpenNebulaHelper.update_template(id, resource)
        require 'tempfile'

        tmp  = Tempfile.new(id)
        path = tmp.path

        tmp << resource.template_str
        tmp.flush

        # TBD select editor
        system("vim #{path}")
        tmp.close

        str = File.read(path)
        str
    end
end