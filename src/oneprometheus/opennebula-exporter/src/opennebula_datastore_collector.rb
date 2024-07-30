# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula'

class OpenNebulaDatastoreCollector

    LABELS = %i[one_datastore_id]

    # --------------------------------------------------------------------------
    # Datastore metrics
    # --------------------------------------------------------------------------
    #   - opennebula_datastore_total
    #   - opennebula_datastore_total_bytes
    #   - opennebula_datastore_used_bytes
    #   - opennebula_datastore_free_bytes
    #   - opennebula_datastore_images
    # --------------------------------------------------------------------------
    DATASTORE_METRICS = {
        'datastore_total' => {
            :type   => :gauge,
            :docstr => 'Total number of datastores defined in OpenNebula',
            :labels => {}
        },
        'datastore_total_bytes' => {
            :type   => :gauge,
            :docstr => 'Total capacity of the datastore',
            :value  => ->(v) { Integer(v['TOTAL_MB']) * 1024 * 1024 },
            :labels => LABELS
        },
        'datastore_used_bytes' => {
            :type   => :gauge,
            :docstr => 'Capacity being used in the dastore',
            :value  => ->(v) { Integer(v['USED_MB']) * 1024 * 1024 },
            :labels => LABELS
        },
        'datastore_free_bytes' => {
            :type   => :gauge,
            :docstr => 'Available capacity in the datastore',
            :value  => ->(v) { Integer(v['FREE_MB']) * 1024 * 1024},
            :labels => LABELS
        },
        'datastore_images' => {
            :type   => :gauge,
            :docstr => 'Number of images stored in the datastore',
            :value  => ->(v) {
                ids = v.retrieve_elements('IMAGES/ID')

                if ids
                    ids.size
                else
                    0
                end
            },
            :labels => LABELS
        }
    }

    def initialize(registry, client, namespace)
        @client  = client
        @metrics = {}

        DATASTORE_METRICS.each do |name, conf|
            @metrics[name] = registry.method(conf[:type]).call(
                      "#{namespace}_#{name}".to_sym,
                      :docstring => conf[:docstr],
                      :labels    => conf[:labels])
        end
    end

    def collect
        ds_pool = OpenNebula::DatastorePool.new(@client)
        rc      = ds_pool.info_all

        raise rc.message if OpenNebula.is_error?(rc)

        dss = ds_pool.retrieve_xmlelements('/DATASTORE_POOL/DATASTORE')

        @metrics['datastore_total'].set(dss.length)

        dss.each do |ds|
            labels = { :one_datastore_id => Integer(ds['ID']) }

            DATASTORE_METRICS.each do |name, conf|
                next unless conf[:value]

                metric = @metrics[name]
                value  = conf[:value].call(ds)

                next unless metric

                metric.set(value, :labels => labels)
            end
        end
    end
end

