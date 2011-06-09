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

    class OneHelper
        def initialize
            @client = OpenNebula::Client.new
            @translation_hash = nil
        end

        def create_resource(template, options)
            resource = factory

            rc = resource.allocate(template)
            if OpenNebula.is_error?(rc)
                return -1, rc.message
            else
                puts "ID: #{resource.id.to_s}" if options[:verbose]
                return 0
            end
        end

        def list_pool(options)
            user_flag = options[:filter_flag] ? options[:filter_flag] : -2
            pool = factory_pool(user_flag)

            rc = pool.info
            return -1, rc.message if OpenNebula.is_error?(rc)

            if options[:xml]
                return 0, pool.to_xml(true)
            else
                generate_translation_hash
                format_pool(pool, options)
                return 0
            end
        end

        def show_resource(id, options)
            resource = retrieve_resource(id)
            return -1, resource.message if OpenNebula.is_error?(resource)

            if options[:xml]
                return 0, resource.to_xml(true)
            else
                generate_translation_hash
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
                puts "#{self.rname} #{id}: #{verbose}" if options[:verbose]
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
        # Formatters descriptions
        ########################################################################
        def self.filter_flag_desc
            desc=<<-EOT
a, all       all the known #{self.rname}s
m, mine      the #{self.rname} belonging to the user in ONE_AUTH
g, group     'mine' plus the #{self.rname} belonging to the groups
             the user is member of
uid          #{self.rname} of the user identified by this uid
user         #{self.rname} of the user identified by the username
EOT
        end

        def self.oneid_list_desc
            "Comma-separated list of OpenNebula #{self.rname} names or ids"
        end

        def self.oneid_desc
            "OpenNebula #{self.rname} name or id"
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

        def filterflag_to_i(str)
            filter_flag = case str
            when "a", "all" then "-2"
            when "m", "mine" then "-3"
            when "g", "group" then "-1"
            else
                if str.match(/^[0123456789]+$/)
                    str
                else
                    generate_translation_hash
                    user = @translation_hash[:users].select { |k,v| v==str }
                    user.length > 0 ? user.first.first : "-2"
                end
            end

            return 0, filter_flag
        end

        private

        def retrieve_resource(id)
            resource = factory(id)

            rc = resource.info
            OpenNebula.is_error?(rc) ? rc : resource
        end

        def generate_translation_hash
            @translation_hash ||= {
                :users => generate_user_translation,
                :groups => generate_group_translation
            }

        end

        def generate_user_translation
            user_pool = UserPool.new(@client)
            user_pool.info

            hash = Hash.new
            user_pool.each { |user|
                hash[user["ID"]]=user["NAME"]
            }
            hash
        end


        def generate_group_translation
            group_pool = GroupPool.new(@client)
            group_pool.info

            hash = Hash.new
            group_pool.each { |group|
                hash[group["ID"]]=group["NAME"]
            }
            hash
        end
    end

    def OpenNebulaHelper.public_to_str(str)
        if str.to_i == 1
            public_str = "Y"
        else
            public_str = "N"
        end
    end

    def OpenNebulaHelper.uid_to_str(uid, hash={})
        if hash[:users] && hash[:users][uid]
            hash[:users][uid]
        else
            uid
        end
    end

    def OpenNebulaHelper.gid_to_str(gid, hash={})
        if hash[:groups] && hash[:groups][gid]
            hash[:groups][gid]
        else
            gid
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
end