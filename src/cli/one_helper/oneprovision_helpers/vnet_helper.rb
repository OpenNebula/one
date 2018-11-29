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

class OneProvisionVnetHelper < OpenNebulaHelper::OneHelper

    def self.rname
        "VNET"
    end

    def self.conf_file
        "oneprovision_vnet.yaml"
    end

    def factory(id=nil)
        if id
            OpenNebula::VirtualNetwork.new_with_id(id, @client)
        else
            xml=OpenNebula::VirtualNetwok.build_xml
            OpenNebula::VirtualNetwork.new(xml, @client)
        end
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for Virtual Network", :size=>4 do |d|
                d["ID"]
            end

            column :USER, "Username of the Virtual Network owner", :left,
                :size=>15 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, "Group of the Virtual Network", :left,
                :size=>12 do |d|
                helper.group_name(d, options)
            end

            column :NAME, "Name of the Virtual Network", :left,
                :size=>19 do |d|
                d["NAME"]
            end

            column :CLUSTERS, "Cluster IDs", :left, :size=>10 do |d|
                OpenNebulaHelper.clusters_str(d["CLUSTERS"]) rescue "-"
            end

            column :BRIDGE, "Bridge associated to the Virtual Network", :left,
                :size=>8 do |d|
                d["BRIDGE"]
            end

            column :PROVIDER, "Baremetal provider name", :left, :size=>8 do |d|
                d["TEMPLATE/PM_MAD"]
            end

            column :LEASES, "Number of this Virtual Network's given leases",
                :size=>6 do |d|
                d["USED_LEASES"]
            end

            default :ID, :USER, :GROUP, :NAME, :CLUSTERS, :BRIDGE, :PROVIDER, :LEASES
        end

        table
    end

    def create_vnet(vnet, cluster_id, provision_id, pm)
        vnet['provision']['provision_id'] = provision_id

        one = OpenNebula::Client.new()
        v = OpenNebula::VirtualNetwork.new(OpenNebula::VirtualNetwork.build_xml, one)

        template = $common_helper.template_like_str(vnet)
        template += "PM_MAD=\"#{pm}\"\n"

        rc = v.allocate(template, cluster_id.to_i)

        if OpenNebula.is_error?(rc)
            raise OneProvisionLoopException.new(rc.message)
        end

        v.info
        v
    end
end
