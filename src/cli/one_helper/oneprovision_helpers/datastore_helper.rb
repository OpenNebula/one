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

class OneProvisionDatastoreHelper < OpenNebulaHelper::OneHelper

    def self.rname
        "DATASTORE"
    end

    def self.conf_file
        "oneprovision_datastore.yaml"
    end

    def factory(id=nil)
        if id
            OpenNebula::Datastore.new_with_id(id, @client)
        else
            xml=OpenNebula::Datastore.build_xml
            OpenNebula::Datastore.new(xml, @client)
        end
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Datastore", :size=>4 do |d|
                d["ID"]
            end

            column :USER, "Username of the Datastore owner", :left,
                :size=>10 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Datastore", :left,
                :size=>10 do |d|
                helper.group_name(d, options)
            end

            column :NAME, "Name of the Datastore", :left, :size=>13 do |d|
                d["NAME"]
            end

            column :SIZE, "Datastore total size", :size =>10 do |d|
                shared = d['TEMPLATE']['SHARED']
                if shared != nil && shared.upcase == 'NO'
                    "-"
                else
                    OpenNebulaHelper.unit_to_str(d['TOTAL_MB'].to_i, {}, 'M')
                end
            end

            column :AVAIL, "Datastore free size", :left, :size =>5 do |d|
                if d['TOTAL_MB'].to_i == 0
                    "-"
                else
                    "#{((d['FREE_MB'].to_f/d['TOTAL_MB'].to_f) * 100).round()}%"
                end
            end

            column :CLUSTERS, "Cluster IDs", :left, :size=>12 do |d|
                OpenNebulaHelper.clusters_str(d["CLUSTERS"])
            end

            column :IMAGES, "Number of Images", :size=>6 do |d|
                if d["IMAGES"]["ID"].nil?
                    "0"
                else
                    [d["IMAGES"]["ID"]].flatten.size
                end
            end

            column :TYPE, "Datastore type", :left, :size=>4 do |d|
                type = Datastore::DATASTORE_TYPES[d["TYPE"].to_i]
                Datastore::SHORT_DATASTORE_TYPES[type]
            end

            column :DS, "Datastore driver", :left, :size=>7 do |d|
                d["DS_MAD"]
            end

            column :PROVIDER, "Baremetal provider name", :left, :size=>8 do |d|
                d["TEMPLATE/PM_MAD"]
            end

            column :TM, "Transfer driver", :left, :size=>7 do |d|
                d["TM_MAD"]
            end

            column :STAT, "State of the Datastore", :left, :size=>3 do |d|
                state = Datastore::DATASTORE_STATES[d["STATE"].to_i]
                Datastore::SHORT_DATASTORE_STATES[state]
            end

            default :ID, :NAME, :SIZE, :AVAIL, :CLUSTERS, :IMAGES, :TYPE, :DS, :PROVIDER, :TM, :STAT
        end

        table
    end

    def create_datastore(datastore, cluster_id, provision_id, pm)
        datastore['provision']['provision_id'] = provision_id

        one = OpenNebula::Client.new()
        d = OpenNebula::Datastore.new(OpenNebula::Datastore.build_xml, one)

        template = $common_helper.template_like_str(datastore)
        template += "PM_MAD=\"#{pm}\"\n"

        rc = d.allocate(template, cluster_id.to_i)

        if OpenNebula.is_error?(rc)
            raise OneProvisionLoopException.new(rc.message)
        end

        d.info
        d
    end
end
