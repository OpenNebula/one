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

require 'base64'

class OneProvisionClusterHelper < OpenNebulaHelper::OneHelper

    def self.rname
        "CLUSTER"
    end

    def self.conf_file
        "oneprovision_cluster.yaml"
    end

    def factory(id=nil)
        if id
            OpenNebula::Cluster.new_with_id(id, @client)
        else
            xml=OpenNebula::Cluster.build_xml
            OpenNebula::Cluster.new(xml, @client)
        end
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "ONE identifier for the Cluster", :size=>5 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Cluster", :left, :size=>25 do |d|
                d["NAME"]
            end

            column :HOSTS, "Number of Hosts", :size=>5 do |d|
                d["HOSTS"]
            end

            column :VNETS, "Number of Networks", :size=>5 do |d|
                d["NETWORKS"]
            end

            column :DATASTORES, "Number of Datastores", :size=>10 do |d|
                d["DATASTORES"]
            end

            default :ID, :NAME, :HOSTS, :VNETS, :DATASTORES
        end

        table
    end

    def create_cluster(cluster, provision_id)
        c = OpenNebula::Cluster.new(OpenNebula::Cluster.build_xml, @client)

        cluster['provision']['provision_id'] = provision_id
        rc = c.allocate(cluster['name'])

        if OpenNebula.is_error?(rc)
            raise OneProvisionLoopException.new(rc.message)
        end

        c.update($common_helper.template_like_str(cluster), true)
        c.info
        c
    end

    def get_cluster(provision_id)
        pool = OpenNebula::ClusterPool.new(@client)

        pool.info
        pool.select { |c| c['TEMPLATE/PROVISION/PROVISION_ID'] == provision_id }[0]
    end
end
