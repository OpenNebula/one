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

require 'one_helper'

class OneUserHelper < OpenNebulaHelper::OneHelper
    TABLE_CONF_FILE="#{OpenNebulaHelper::TABLE_CONF_PATH}/oneuser.yaml"

    def self.rname
        "USER"
    end

    def self.password_to_str_desc
        "TBD"
    end

    def self.password_to_str(arg, options)
        if options[:read_file]
            begin
                password = File.read(arg).split("\n").first
            rescue
                return -1, "Can not read file: #{arg}"
            end
        else
            if options[:plain]
                password = arg.gsub(/\s/, '')
            else
                password = Digest::SHA1.hexdigest(arg)
            end
        end
        
        return 0, password
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::User.new_with_id(id, @client)
        else
            xml=OpenNebula::User.build_xml
            OpenNebula::User.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        #TBD OpenNebula::UserPool.new(@client, user_flag)
        OpenNebula::UserPool.new(@client)
    end

    def format_pool(pool, options, top=false)
        config_file=self.class.table_conf
        table=CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the User", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the User", :left, :size=>15 do |d|
                d["NAME"]
            end

            column :GROUP, "Group of the User", :left, :size=>8 do |d|
                helper.gid_to_str(d["GID"], options)
            end

            column :PASSWORD, "Password of the User", :size=>50 do |d|
                d['PASSWORD']
            end

            default :ID, :GROUP, :NAME, :PASSWORD
        end

        if top
            table.top(pool, options)
        else
            table.show(pool, options)
        end
    end
end