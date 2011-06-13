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

class OneGroupHelper < OpenNebulaHelper::OneHelper
    def self.rname
        "GROUP"
    end

    def self.conf_file
        "onegroup.yaml"
    end

    private

    def factory(id=nil)
        if id
            OpenNebula::Group.new_with_id(id, @client)
        else
            xml=OpenNebula::Group.build_xml
            OpenNebula::Group.new(xml, @client)
        end
    end

    def factory_pool(user_flag=-2)
        #TBD OpenNebula::UserPool.new(@client, user_flag)
        OpenNebula::GroupPool.new(@client)
    end

    def format_pool(pool, options, top=false)
        config_file=self.class.table_conf
        table=CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Group", :size=>4 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Group", :left, :size=>15 do |d|
                d["NAME"]
            end
            
            column :USER, "Username of the Group owner", :left, :size=>8 do |d|
                helper.uid_to_str(d["UID"], options)
            end

            default :ID, :USER, :NAME
        end

        if top
            table.top(pool, options)
        else
            table.show(pool, options)
        end
    end
end