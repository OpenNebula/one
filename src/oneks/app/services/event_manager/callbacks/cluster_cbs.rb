# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

module OneKS

    # NodeGroup Callbacks for LCM
    module ClusterCallbacks

        COMP = 'EVT'

        #------------------------------------------------------
        # Failure callbacks
        #------------------------------------------------------

        def cluster_provision_failure_cb(cluster_id, external_user)
            @cluster_pool.get(cluster_id, external_user) do |cluster|
                cluster.state = :PROVISIONING_FAILURE
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(CLUSTER_ID=#{cluster_id}): #{e.class}: #{e.message}"
            )
        end

        def cluster_deprovision_failure_cb(cluster_id, external_user)
            @cluster_pool.get(cluster_id, external_user) do |cluster|
                cluster.state = :DEPROVISIONING_FAILURE
            end
        rescue StandardError => e
            Log.error(
                COMP,
                "#{__method__}: Callback execution failed " \
                "(CLUSTER_ID=#{cluster_id}): #{e.class}: #{e.message}"
            )
        end

    end

end
