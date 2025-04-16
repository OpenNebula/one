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

module OpenNebula

    # Virtual Route Role class
    class VRRole < Role

        attr_reader :service

        ########################################################################
        # Operations
        ########################################################################

        def chown(uid, gid)
            vrouter_id = @body['vrouter_id']

            vrouter = OpenNebula::VirtualRouter.new_with_id(
                vrouter_id, @service.client
            )

            rc = vrouter.chown(uid, gid)

            if OpenNebula.is_error?(rc)
                msg = "Role #{name} : Chown failed for VR #{vrouter_id}; " \
                      "#{rc.message}"

                Log.error(LOG_COMP, msg, @service.id)
                @service.log_error(msg)

                return [false, rc.message]
            else
                msg = "Role #{name} : Chown success for VR #{vrouter_id}"
                Log.debug(LOG_COMP, msg, @service.id)

            end

            [true, nil]
        end

        def update(_)
            return OpenNebula::Error.new(
                "Virtual Router role #{name} does not support cardinality update"
            )
        end

        ########################################################################
        # Scheduler
        ########################################################################

        def batch_action(_, _, _, _)
            return OpenNebula::Error.new(
                "Virtual Router role #{name} does not support schedule actions"
            )
        end

        ########################################################################
        # Scalability
        ########################################################################

        # Returns the role max cardinality
        # @return [Integer,nil] the role cardinality
        def max_cardinality
            return cardinality
        end

        # Returns the role min cardinality
        # @return [Integer,nil] the role cardinality
        def min_cardinality
            return cardinality
        end

        def scale?(_)
            return [0, 0]
        end

        def elasticity_policies
            []
        end

        def update_elasticity_policies(_)
            []
        end

        def cooldown
            []
        end

        def update_cooldown(_)
            []
        end

        def scale_way(_)
            []
        end

        def clean_scale_way
            []
        end

        ########################################################################
        # Deployment
        ########################################################################

        # Deploys all the nodes in this role
        #
        # @return [Array<true, nil>, Array<false, String>] true if all the VMs
        #  were created, false and the error reason if there was a problem
        #  creating the VMs
        def deploy
            deployed_nodes = []
            n_nodes        = cardinality - nodes.size

            return [deployed_nodes, nil] if n_nodes == 0

            vr_name = @@vr_name_template
                      .gsub('$SERVICE_ID', @service.id.to_s)
                      .gsub('$SERVICE_NAME', @service.name.to_s)
                      .gsub('$ROLE_NAME', name.to_s)

            @body['template_contents']['NAME'] = vr_name
            template_id, _, extra_template = init_template_attributes

            # Create vrouter Object and description
            vrouter = VirtualRouter.new(
                VirtualRouter.build_xml(@service.uid),
                @service.client
            )

            Log.debug(
                LOG_COMP,
                "Role #{name} : Creating service VRouter",
                @service.id
            )

            # Allocating VR with role description provided
            rc = vrouter.allocate(extra_template)

            if OpenNebula.is_error?(rc)
                msg = "Role #{name} : Allocate failed for Vrouter " \
                      "#{template_id}; #{rc.message}"

                Log.error(LOG_COMP, msg, @service.id)
                @service.log_error(msg)

                return [false, "Error allocating Vrouter #{template_id} in Role " \
                               "#{name}: #{rc.message}"]
            end

            Log.debug(
                LOG_COMP,
                "Role #{name} : Instantiating VRouter #{vrouter.id}",
                @service.id
            )

            # Instantiating Vrouters
            vm_name = @@vm_name_template
                      .gsub('$SERVICE_ID', @service.id.to_s)
                      .gsub('$SERVICE_NAME', @service.name.to_s)
                      .gsub('$ROLE_NAME', name.to_s)
                      .gsub('$VM_NUMBER', '%i')

            rc = vrouter.instantiate(
                n_nodes,
                template_id,
                vm_name,
                on_hold?,
                extra_template
            )

            if OpenNebula.is_error?(rc)
                msg = "Role #{name} : Instantiate failed for Vrouter " \
                      "#{vrouter.id}; #{rc.message}"

                Log.error(LOG_COMP, msg, @service.id)
                @service.log_error(msg)

                return [false, "Error instantiating Vrouter #{vrouter.id} in Role " \
                               "#{name}: #{rc.message}"]
            end

            vrouter.info

            # Once deployed, save VM info in role node body
            deployed_nodes.concat(vrouter.vm_ids)

            deployed_nodes.each do |vm_id|
                fill_node_info(vm_id)
            end

            @body['vrouter_id'] = vrouter.id

            # Fill vrouter IP in vrouter role body
            vrouter_nics = vrouter.to_hash['VROUTER']['TEMPLATE']['NIC'] || []
            vrouter_nics = [vrouter_nics] if vrouter_nics.is_a?(Hash)

            @body['vrouter_ips'] = vrouter_nics.map do |nic|
                next unless nic.is_a?(Hash) && nic.key?('VROUTER_IP')

                {
                    'NETWORK_ID' => nic['NETWORK_ID'].to_i,
                    'VROUTER_IP' => nic['VROUTER_IP']
                }
            end.compact

            [deployed_nodes, nil]
        end

        ########################################################################
        # Recover
        ########################################################################

        # VRs do not support scale operations, returing empty array with
        # zero nodes deployed / shutdown
        def recover_scale(_)
            []
        end

        ########################################################################
        # Helpers
        ########################################################################

        def shutdown_nodes(nodes, n_nodes, _)
            success          = true
            vrouter_id       = @body['vrouter_id']

            return [success, nodes] if nodes.empty? && vrouter_id.nil?

            msg = "Role #{name} : Terminating VR #{vrouter_id} (#{n_nodes} VMs associated)"
            Log.debug(LOG_COMP, msg, @service.id)

            vrouter = OpenNebula::VirtualRouter.new_with_id(
                vrouter_id, @service.client
            )

            rc = vrouter.delete

            if OpenNebula.is_error?(rc)
                msg = "Role #{name} : Delete failed for VR #{vrouter_id}: #{rc.message}"

                Log.error(LOG_COMP, msg, @service.id)
                @service.log_error(msg)

                success = false
            end

            [success, nodes]
        end

    end

end
