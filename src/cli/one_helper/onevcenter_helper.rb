
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

require 'one_helper'

class OneVcenterHelper < OpenNebulaHelper::OneHelper


    def connection_options(object_name, options)
        if  options[:vuser].nil? || options[:vcenter].nil?
            raise "vCenter connection parameters are mandatory to import"\
                  " #{object_name}:\n"\
                  "\t --vcenter vCenter hostname\n"\
                  "\t --vuser username to login in vcenter"
        end

        password = options[:vpass] || OpenNebulaHelper::OneHelper.get_password
        {
           :user     => options[:vuser],
           :password => password,
           :host     => options[:vcenter]
        }
    end

    TABLE = {
        "datastores" => ["DATASTORE_LIST", "DATASTORE"],
        "networks" => ["NETWORK_LIST", "NETWORK"],
        "templates" => ["TEMPLATE_LIST", "TEMPLATE"]
    }
    def cli_format(o, hash)
        {TABLE[o].first => {TABLE[o].last => hash.values}}
    end

    def list_object(options, list)
        list = cli_format(options[:object], list)
        table = format_list(options)
        table.show(list)
    end


    def format_list(options)
        table = CLIHelper::ShowTable.new() do
            column :IMID, "identifier for ...", :size=>4 do |d|
                d[:import_id]
            end

            column :REF, "ref", :left, :size=>15 do |d|
                d[:ref]
            end

            column :VCENTER, "vCenter", :left, :size=>20 do |d|
                d[:vcenter]
            end

            column :NAME, "Name", :left, :size=>20 do |d|
                d[:simple_name]
            end

            column :CLUSTERS, "CLUSTERS", :left, :size=>10 do |d|
                d[:cluster].to_s
            end

            default :IMID, :REF, :VCENTER, :NAME, :CLUSTERS
        end

        table
    end
end
