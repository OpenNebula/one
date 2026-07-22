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

# Kubernetes Cluster LCM Service
module OneKS

    # Cluster LCM Service
    class ClusterLCM

        attr_reader :em

        COMP = 'LCM'

        include Singleton

        def configure(cloud_auth, opts = {})
            @cloud_auth   = cloud_auth
            @conf         = SERVER_CONF.merge(opts)
            @cluster_pool = OneKS::ClusterDocumentPool.new(:auth => cloud_auth)
            @group_pool   = OneKS::K8sGroupDocumentPool.new(:auth => cloud_auth)

            # Event manager handles internal LCM events
            # WatchDog handles cluster events (allocate document, vms)
            @em = OneKS::EventManager.new(@cloud_auth)
            @wd = OneKS::ClusterWD.new(@cloud_auth, @em)
            @tm = ODS::ThreadManager.instance

            # Fill in cluster pool and start LCM threads
            @cluster_pool.info_all
            @group_pool.info_all

            @tm.start(:event_manager) { @em.start(@cluster_pool, @group_pool) }
            @tm.start(:watchdog) { @wd.start(@cluster_pool, @group_pool) }
            @tm.start(:lcm) { catch_up }
        end

        private

        # Iterate through the groups for catching up with the state of each group
        # used when the LCM starts
        def catch_up
            Log.info(COMP, 'Catching up...')

            @group_pool.each do |group|
                Log.info(COMP, "Catching up #{group.type} #{group.id}")
                # recover_action(nil, cluster.id) if cluster.transient_state?
            end
        end

    end

end
