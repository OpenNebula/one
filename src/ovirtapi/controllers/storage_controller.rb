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

require_relative 'helper_functions'

# StorageController manages OpenNebula Datastores
class StorageController

    # Maps the OpenNebula datastore manager to an oVirt storage type.
    def self.ovirt_storage_type(ds_hash)
        ds_mad = ds_hash['DS_MAD'].to_s.downcase

        if ds_mad == 'fs'
            # It can be either local filesystem or NFS, need to check TM_MAD
            ds_tm_mad = ds_hash['TM_MAD'].to_s.downcase
            return 'nfs' if ds_tm_mad == 'shared'

            return 'localfs'
        end

        return 'localfs' if ds_mad == 'virtiofs'

        'managed_block_storage'
    end

    # Auxiliary function to convert an OpenNebula Datastore
    # into an oVirt Storage Domain in hash format
    def self.oneds_to_ovirtso(datastore)
        ds_hash = datastore.to_hash['DATASTORE']
        return {
            :name => datastore.name,
          :id => Helper.int_to_uuid(datastore.id).to_s,
          :type => 'data',
          :status => ds_hash['state'].to_i == 0 ? 'active' : 'inactive',
          :external_status => 'ok',
          :storage => {
              :type => ovirt_storage_type(ds_hash)
          },

          :available => ds_hash['FREE_MB'].to_i*1024*1024,
          :used => ds_hash['USED_MB'].to_i*1024*1024,
          :commited => ds_hash['TOTAL_MB'].to_i*1024*1024
        }
    end

    # Auxiliary function to get a list of OpenNebula Datastores or
    # a single datastore if an id is provided
    def self.get_one_datastores(client, id = nil)
        if client.is_a?(Helper::Inventory)
            return client.pool(:datastores, id) { get_one_datastores(client.client) }
        end

        datastores = OpenNebula::DatastorePool.new(client)
        rc = datastores.info_all

        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return
        end

        id ? datastores.find {|datastore| datastore.id == id } : datastores
    end

    # Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#types/storage_domain
    def self.get_ovirt_storagedomains(client, max: nil, search: nil)
        pagination = Helper::Pagination.new(:max => max, :search => search)
        datastores = get_one_datastores(client)
        if datastores.nil?
            LOGGER.error('No datastores found')
            return 500, Helper.fault_response('No datastores found')
        end

        datastores = datastores.select {|datastore| datastore['TYPE'].to_i.zero? }
        formatted_datastores = pagination.apply(datastores).map {|ds| oneds_to_ovirtso(ds) }
        return 200, { :storage_domain => formatted_datastores }
    end

end
