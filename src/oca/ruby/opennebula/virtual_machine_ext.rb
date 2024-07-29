# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'opennebula/template_ext'

# Module to decorate VirtualMachine class with additional helpers not directly
# exposed through the OpenNebula XMLRPC API. The extensions include
#   - mp_import helper that imports a template into a marketplace
#
# rubocop:disable Style/ClassAndModuleChildren
module OpenNebula::VirtualMachineExt

    def self.extend_object(obj)
        if !obj.is_a?(OpenNebula::VirtualMachine)
            raise StandardError, "Cannot extended #{obj.class} "\
              ' with MarketPlaceAppExt'
        end

        class << obj

            ####################################################################
            # Public extended interface
            ####################################################################

            #-------------------------------------------------------------------
            # Clones the VM's source Template, replacing the disks with live
            # snapshots of the current disks. The VM capacity and NICs are also
            # preserved
            #
            # @param name [String] Name for the new Template
            # @param name [true,false,nil] Optional, true to make the saved
            # images persistent, false make them non-persistent
            #
            # @return [Integer, OpenNebula::Error] the new Template ID in case
            #   of success, error otherwise
            #-------------------------------------------------------------------
            REMOVE_VNET_ATTRS = ['AR_ID', 'BRIDGE', 'CLUSTER_ID', 'IP', 'MAC', 'TARGET', 'NIC_ID',
                                 'NETWORK_ID', 'VN_MAD', 'SECURITY_GROUPS', 'VLAN_ID',
                                 'BRIDGE_TYPE']

            REMOVE_IMAGE_ATTRS = ['DEV_PREFIX', 'SOURCE', 'ORIGINAL_SIZE', 'SIZE',
                                  'DISK_SNAPSHOT_TOTAL_SIZE', 'DRIVER', 'IMAGE_STATE', 'SAVE',
                                  'CLONE', 'READONLY', 'PERSISTENT', 'TARGET', 'ALLOW_ORPHANS',
                                  'CLONE_TARGET', 'CLUSTER_ID', 'DATASTORE', 'DATASTORE_ID',
                                  'DISK_ID', 'DISK_TYPE', 'IMAGE_ID', 'IMAGE', 'IMAGE_UNAME',
                                  'IMAGE_UID', 'LN_TARGET', 'TM_MAD', 'TYPE', 'OPENNEBULA_MANAGED']

            def save_as_template(name, desc, opts = {})
                opts = {
                    :persistent => false,
                    :poweroff   => false,
                    :logger     => nil
                }.merge(opts)

                img_ids = []
                ntid    = nil
                logger  = opts[:logger]
                poweron = false

                rc = info

                raise rc.message if OpenNebula.is_error?(rc)

                tid = self['TEMPLATE/TEMPLATE_ID']

                raise 'VM has no associated template' unless valid?(tid)

                # --------------------------------------------------------------
                # Check VM state and poweroff it if needed
                # --------------------------------------------------------------
                if state_str != 'POWEROFF'
                    raise 'VM must be POWEROFF' unless opts[:poweroff]

                    logger.info 'Powering off VM' if logger

                    poweron = true

                    rc = poweroff

                    raise rc.message if OpenNebula.is_error?(rc)
                end

                # --------------------------------------------------------------
                # Ask if source VM is linked clone
                # --------------------------------------------------------------
                use_linked_clones = self['USER_TEMPLATE/VCENTER_LINKED_CLONES']

                if use_linked_clones && use_linked_clones.downcase == 'yes'
                    # Delay the require until it is strictly needed
                    # This way we can avoid the vcenter driver dependency
                    # in no vCenter deployments
                    require 'vcenter_driver'

                    deploy_id = self['DEPLOY_ID']
                    vm_id = self['ID']
                    host_id = self['HISTORY_RECORDS/HISTORY[last()]/HID']
                    vi_client = VCenterDriver::VIClient.new_from_host(host_id)

                    vm = VCenterDriver::VirtualMachine.new(
                        vi_client,
                        deploy_id,
                        vm_id
                    )

                    error, vm_template_ref = vm.save_as_linked_clones(name)

                    raise error unless error.nil?

                    return vm_template_ref
                end

                # --------------------------------------------------------------
                # Clone the source template
                # --------------------------------------------------------------
                vm_template = OpenNebula::Template.new_with_id(tid, @client)

                ntid = vm_template.clone(name)

                raise ntid.message if OpenNebula.is_error?(ntid)

                # --------------------------------------------------------------
                # Replace the original template's capacity with VM values
                # --------------------------------------------------------------
                cpu  = self['TEMPLATE/CPU']
                vcpu = self['TEMPLATE/VCPU']
                mem  = self['TEMPLATE/MEMORY']

                replace = ''
                replace << "DESCRIPTION = \"#{desc}\"\n" if valid?(desc)
                replace << "CPU = #{cpu}\n" if valid?(cpu)
                replace << "VCPU = #{vcpu}\n" if valid?(vcpu)
                replace << "MEMORY = #{mem}\n" if valid?(mem)

                # --------------------------------------------------------------
                # Process VM DISKs
                # --------------------------------------------------------------
                logger.info 'Processing VM disks' if logger

                each('TEMPLATE/DISK') do |disk|
                    # Wait for any pending operation
                    rc = wait_state2('POWEROFF', 'LCM_INIT')

                    raise rc.message if OpenNebula.is_error?(rc)

                    disk_id  = disk['DISK_ID']
                    image_id = disk['IMAGE_ID']

                    omng = disk['OPENNEBULA_MANAGED']
                    type = disk['TYPE']

                    raise 'Missing DISK_ID' unless valid?(disk_id)

                    REMOVE_IMAGE_ATTRS.each do |attr|
                        disk.delete_element(attr)
                    end

                    # Volatile disks cannot be saved, copy definition
                    if !valid?(image_id)
                        logger.info 'Adding volatile disk' if logger

                        disk_str = template_like_str(
                            'TEMPLATE',
                            true,
                            "DISK [ DISK_ID = #{disk_id} ]"
                        )

                        replace << "#{disk_str}\n"

                        next
                    end

                    # CDROM disk, copy definition
                    if type == 'CDROM'
                        logger.info 'Adding CDROM disk' if logger

                        replace << "DISK = [ IMAGE_ID = #{image_id}"
                        replace << ", OPENNEBULA_MANAGED=#{omng}" if omng
                        replace << " ]\n"

                        next
                    end

                    # Regular disk, saveas it
                    logger.info 'Adding and saving regular disk' if logger

                    ndisk_name = "#{name}-disk-#{disk_id}"

                    rc = disk_saveas(disk_id.to_i, ndisk_name, '', -1)

                    raise rc.message if OpenNebula.is_error?(rc)

                    if opts[:persistent]
                        logger.info 'Making disk persistent' if logger

                        nimg = OpenNebula::Image.new_with_id(rc.to_i, @client)
                        nimg.persistent
                    end

                    img_ids << rc.to_i

                    disk_tmpl = disk.template_like_str('.').tr("\n", ",\n")

                    replace << "DISK = [ IMAGE_ID = #{rc} "
                    replace << ", #{disk_tmpl}" unless disk_tmpl.empty?
                    replace << " ]\n"
                end

                # --------------------------------------------------------------
                # Process VM NICs
                # --------------------------------------------------------------
                logger.info 'Processing VM NICs' if logger

                each('TEMPLATE/NIC') do |nic|
                    nic_id = nic['NIC_ID']

                    raise 'Missing NIC_ID' unless valid?(nic_id)

                    REMOVE_VNET_ATTRS.each do |attr|
                        nic.delete_element(attr)
                    end

                    replace << 'NIC = [ '
                    replace << nic.template_like_str('.').tr("\n", ",\n")
                    replace << " ] \n"
                end

                # --------------------------------------------------------------
                # Extra. Required by the Sunstone Cloud View
                # --------------------------------------------------------------
                replace << "SAVED_TEMPLATE_ID = #{tid}\n"

                new_tmpl = OpenNebula::Template.new_with_id(ntid, @client)

                logger.info 'Updating VM Template' if logger

                rc = new_tmpl.update(replace, true)

                raise rc.message if OpenNebula.is_error?(rc)

                # --------------------------------------------------------------
                # Resume VM if needed
                # --------------------------------------------------------------
                if poweron
                    logger.info 'Powering on VM' if logger

                    rc = wait_state2('POWEROFF', 'LCM_INIT')

                    raise rc.message if OpenNebula.is_error?(rc)

                    resume

                    rc = wait_state2('ACTIVE', 'RUNNING')

                    raise rc.message if OpenNebula.is_error?(rc)
                end

                ntid
            rescue StandardError
                # --------------------------------------------------------------
                # Rollback. Delete the template and the images created
                # --------------------------------------------------------------
                if ntid
                    ntmpl = OpenNebula::Template.new_with_id(ntid, @client)
                    ntmpl.delete
                end

                img_ids.each do |id|
                    img = OpenNebula::Image.new_with_id(id, @client)
                    img.delete
                end

                raise
            end

            ####################################################################
            # Private extended interface
            ####################################################################

            private

            #-------------------------------------------------------------------
            # Check an attribute is defined and valid
            #-------------------------------------------------------------------
            def valid?(att)
                return false if att.nil?

                return !att.nil? && !att.empty? if att.is_a? String

                !att.nil?
            end

        end
    end

end
# rubocop:enable Style/ClassAndModuleChildren
