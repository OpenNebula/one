# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'json'
require 'opennebula'

require_relative 'storage_controller'
require_relative 'network_controller'
require_relative 'helper_functions'

# ------------------------------------------------------------------
# In oVirt, DataCenters are a group of Clusters and other resources
# such as Networks and Storage Domains. Each OpenNebula Cluster is
# going to be represented as 1 oVirt DataCenter with a single cluster
# in it.
# ------------------------------------------------------------------

# ClusterController is responsible for converting OpenNebula Clusters.
class ClusterController

    # Convert ONE Cluster to oVirt Cluster
    # Struct Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#types/cluster
    def self.onecluster_to_ovirtcluster(onecluster)
        return {
            :ballooning_enabled => 'true',
          :bios_type => 'q35_ovmf',
          :cpu => {
              :architecture => 'x86_64',
              :type => 'Secure Intel SandyBridge Family'
          },
          :custom_scheduling_policy_properties => {
              :property => [
                  {
                      :name => 'HighUtilization',
                      :value => '80'
                  },
                  {
                      :name => 'CpuOverCommitDurationMinutes',
                      :value => '2'
                  }
              ]
          },
          :error_handling => {
              :on_error => 'migrate'
          },
          :fencing_policy => {
              :enabled => 'true',
              :skip_if_connectivity_broken => {
                  :enabled => false,
                  :threshold => '50'
              },
              :skip_if_gluster_bricks_up => 'false',
              :skip_if_gluster_quorum_not_met => 'false',
              :skip_if_sd_active => {
                  :enabled => 'false'
              }
          },
          :fips_mode => 'disabled',
          :firewall_type => 'firewalld',
          :gluster_service => 'false',
          :ha_reservation => 'false',
          :ksm => {
              :enabled => 'true',
              :merge_across_nodes => 'true'
          },
          :log_max_memory_used_threshold => '95',
          :log_max_memory_used_threshold_type => 'percentage',
          :memory_policy => {
              :over_commit => {
                  :percent => '100'
              },
              :transparent_hugepages => {
                  :enabled => 'true'
              }
          },
          :migration => {
              :auto_converge => 'inherit',
              :bandwidth => {
                  :assignment_method => 'auto'
              },
              :compressed => 'inherit',
              :encrypted => 'inherit',
              :parallel_migrations_policy => 'disabled',
              :policy => {
                  :id => '80554327-0569-496b-bdeb-fcbbf52b827b'
              }
          },
          :required_rng_sources => {
              :required_rng_source => [
                  'urandom'
              ]
          },
          :switch_type => 'legacy',
          :threads_as_cores => 'true',
          :trusted_service => 'false',
          :tunnel_migration => 'false',
          :upgrade_in_progress => 'false',
          :upgrade_percent_complete => '0',
          :version => {
              :major => '4',
              :minor => '7'
          },
          :virt_service => 'true',
          :vnc_encryption => 'false',
          :mac_pool => {
              :id => '58ca604b-017d-0374-0220-00000000014e'
          },
          :scheduling_policy => {
              :id => 'b4ed2332-a7ac-4d5f-9596-99a439cb2812'
          },
          :name => onecluster.name,
          :description => 'The default server cluster',
          :comment => '',
          :data_center => {
              :href => "/ovirt-engine/api/datacenters/#{Helper.int_to_uuid(onecluster.id.to_i)}",
            :id => Helper.int_to_uuid(onecluster.id.to_i).to_s
          },
          :href => "/ovirt-engine/api/clusters/#{Helper.int_to_uuid(onecluster.id)}",
          :id => Helper.int_to_uuid(onecluster.id).to_s
        }
    end

    # Convert ONE Cluster to oVirt DataCenter
    # Struct Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#types/data_center
    def self.onecluster_to_ovirtdc(onecluster)
        return {
            :local => 'false',
          :quota_mode => 'disabled',
          :status => 'up',
          :storage_format => 'v5',
          :supported_versions => {
              :version => [
                  {
                      :major => '4',
                      :minor => '7'
                  }
              ]
          },
          :version => {
              :major => '4',
              :minor => '7'
          },
          :mac_pool => {
              :id => '58ca604b-017d-0374-0220-00000000014e'
          },
          :description => 'The default Data Center',
          :link => [
              {
                  :href => '/ovirt-engine/api/datacenters/' \
                        "#{Helper.int_to_uuid(onecluster.id.to_i)}/networks",
                  :rel => 'networks'
              },
              {
                  :href => '/ovirt-engine/api/datacenters/' \
                        "#{Helper.int_to_uuid(onecluster.id.to_i)}/storagedomains",
                  :rel => 'storagedomains'
              }
          ],

          :name => onecluster.name,
          :id => Helper.int_to_uuid(onecluster.id.to_i).to_s,
          :href => "/ovirt-engine/api/datacenters/#{Helper.int_to_uuid(onecluster.id.to_i)}"
        }
    end

    # Auxiliary function to get a list of OpenNebula Clusters or
    # a single cluster if an id is provided
    def self.get_one_clusters(client, id = nil)
        id = Helper.uuid_to_int(id) unless id.nil?
        if client.is_a?(Helper::Inventory)
            return client.pool(:clusters, id) { get_one_clusters(client.client) }
        end

        clusters = OpenNebula::ClusterPool.new(client)
        rc = clusters.info_all

        Helper.check_lookup_error(rc, 'Unable to retrieve clusters')

        id ? clusters.find {|cluster| cluster.id == id } : clusters
    end

    # Return list of formatted oVirt Clusters
    def self.get_ovirt_clusters(client, id: nil, max: nil, search: nil)
        if id
            cluster = get_one_clusters(client, id)
            if cluster.nil?
                LOGGER.error("Error obtaining OpenNebula cluster: #{id}")
                return 404, Helper.fault_response("Cluster #{id} not found")
            end
            return 200, onecluster_to_ovirtcluster(cluster)
        end

        pagination = Helper::Pagination.new(:max => max, :search => search)
        clusters = get_one_clusters(client)
        if clusters.nil?
            LOGGER.error('Error obtaining OpenNebula clusters.')
            return 500, Helper.fault_response('Error obtaining OpenNebula clusters.')
        end

        formatted_clusters = []
        pagination.apply(clusters).each do |c|
            formatted_clusters << onecluster_to_ovirtcluster(c)
        end
        return 200, { :cluster => formatted_clusters }
    end

    # Return list of formatted oVirt DataCenters
    def self.get_ovirt_dcs(client, id: nil, max: nil, search: nil)
        if id
            LOGGER.info("Getting DataCenter with ID #{id}")
            cluster = get_one_clusters(client, id)
            if cluster.nil?
                LOGGER.error("Error obtaining OpenNebula cluster: #{id}")
                return 404, Helper.fault_response("DataCenter #{id} not found")
            end
            return 200, onecluster_to_ovirtdc(cluster)
        end

        pagination = Helper::Pagination.new(:max => max, :search => search)
        clusters = get_one_clusters(client)
        if clusters.nil?
            LOGGER.error('Error obtaining OpenNebula clusters.')
            return 500, Helper.fault_response('Error obtaining OpenNebula clusters.')
        end

        formatted_dcs = []
        pagination.apply(clusters).each do |dc|
            formatted_dcs << onecluster_to_ovirtdc(dc)
        end
        return 200, { :data_center => formatted_dcs }
    end

    # Return list of formatted oVirt Storage Domains for a given DataCenter
    def self.get_ovirt_dc_storagedomains(client, id)
        client = Helper::Inventory.wrap(client)
        cluster = get_one_clusters(client, id)
        if cluster.nil?
            LOGGER.error("Unable to obtain OpenNebula cluster: #{id}")
            return 404, Helper.fault_response("DataCenter #{id} not found")
        end
        datastores = cluster.to_hash['CLUSTER']['DATASTORES']['ID']
        storage_domains = []
        if datastores.is_a?(Array)
            datastores.each do |datastore|
                datastore = StorageController.get_one_datastores(client, datastore.to_i)
                if datastore.to_hash['DATASTORE']['TYPE'].to_i.zero?
                    storage_domains << StorageController.oneds_to_ovirtso(datastore)
                end
            end
        else
            datastore = StorageController.get_one_datastores(client, datastores.to_i)
            if datastore.to_hash['DATASTORE']['TYPE'].to_i.zero?
                storage_domains << StorageController.oneds_to_ovirtso(datastore)
            end
        end
        return 200, { :storage_domain => storage_domains }
    end

    # Return list of formatted oVirt Networks for a given DataCenter
    def self.get_ovirt_dc_networks(client, id)
        client = Helper::Inventory.wrap(client)
        cluster = get_one_clusters(client, id)
        if cluster.nil?
            LOGGER.error("Unable to obtain OpenNebula Cluster #{id}")
            return 404, Helper.fault_response("DataCenter #{id} not found")
        end
        vnets = cluster.to_hash['CLUSTER']['VNETS']['ID']
        networks = []
        if vnets.is_a?(Array)
            vnets.each do |vnet|
                vnet = NetworkController.get_one_vnets(client, vnet.to_i)
                networks << NetworkController.onevnet_to_ovirtnetwork(vnet)
            end
        else
            vnet = NetworkController.get_one_vnets(client, vnets.to_i)
            networks << NetworkController.onevnet_to_ovirtnetwork(vnet)
        end
        return 200, { :network => networks }
    end

end
