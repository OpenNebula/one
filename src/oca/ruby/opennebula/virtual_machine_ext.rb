# -------------------------------------------------------------------------- #
# Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                #
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

# Module to decorate VirtualMachine class with additional helpers not directly
# exposed through the OpenNebula XMLRPC API. The extensions include
#   - mp_import helper that imports a template into a marketplace
#
# rubocop:disable Style/ClassAndModuleChildren
module OpenNebula::VirtualMachineExt

    def self.extend_object(obj)
        if !(OpenNebula::VirtualMachine === obj)
            raise StandardError.new "Cannot extended #{obj.class} with MarketPlaceAppExt"
        end

        class << obj
            #####################################################################
            # Public extended interface
            #####################################################################
            # Clones the VM's source Template, replacing the disks with live snapshots
            # of the current disks. The VM capacity and NICs are also preserved
            #
            # @param name [String] Name for the new Template
            # @param name [true,false,nil] Optional, true to make the saved images
            # persistent, false make them non-persistent
            #
            # @return [Integer, OpenNebula::Error] the new Template ID in case of
            #   success, error otherwise
            REMOVE_VNET_ATTRS = %w{AR_ID BRIDGE CLUSTER_ID IP MAC TARGET NIC_ID
                NETWORK_ID VN_MAD SECURITY_GROUPS VLAN_ID}

            REMOVE_IMAGE_ATTRS = %w{DEV_PREFIX SOURCE ORIGINAL_SIZE SIZE
                DISK_SNAPSHOT_TOTAL_SIZE DRIVER IMAGE_STATE SAVE CLONE READONLY
                PERSISTENT TARGET ALLOW_ORPHANS CLONE_TARGET CLUSTER_ID DATASTORE
                DATASTORE_ID DISK_ID DISK_TYPE IMAGE_ID IMAGE IMAGE_UNAME IMAGE_UID
                LN_TARGET TM_MAD TYPE OPENNEBULA_MANAGED}

            def save_as_template(name,description, persistent=nil)
                img_ids = []
                new_tid = nil
                begin
                    rc = info()
                    raise if OpenNebula.is_error?(rc)

                    tid = self['TEMPLATE/TEMPLATE_ID']
                    if tid.nil? || tid.empty?
                        rc = Error.new('VM has no template to be saved')
                        raise
                    end

                    if state_str() != "POWEROFF"
                        rc = Error.new("VM state must be POWEROFF, "<<
                            "current state is #{state_str()}, #{lcm_state_str()}")
                        raise
                    end

                    # Clone the source template
                    rc = OpenNebula::Template.new_with_id(tid, @client).clone(name)
                    raise if OpenNebula.is_error?(rc)

                    new_tid = rc

                    # Replace the original template's capacity with the actual VM values
                    replace = ""
                    if !description.nil?
                        replace << "DESCRIPTION = \"#{description}\"\n"
                    end
                    cpu = self['TEMPLATE/CPU']
                    if !cpu.nil? && !cpu.empty?
                        replace << "CPU = #{cpu}\n"
                    end

                    vcpu = self['TEMPLATE/VCPU']
                    if !vcpu.nil? && !vcpu.empty?
                        replace << "VCPU = #{vcpu}\n"
                    end

                    mem = self['TEMPLATE/MEMORY']
                    if !mem.nil? && !mem.empty?
                        replace << "MEMORY = #{mem}\n"
                    end

                    self.each('TEMPLATE/DISK') do |disk|
                        # While the previous snapshot is still in progress, we wait
                        # indefinitely
                        rc = info()
                        raise if OpenNebula.is_error?(rc)

                        steps = 0
                        while lcm_state_str() == "HOTPLUG_SAVEAS_POWEROFF"
                            if steps < 30
                                sleep 1
                            else
                                sleep 15
                            end

                            rc = info()
                            raise if OpenNebula.is_error?(rc)

                            steps += 1
                        end

                        # If the VM is not busy with a previous disk snapshot, we wait
                        # but this time with a timeout
                        rc = wait_state("POWEROFF")
                        raise if OpenNebula.is_error?(rc)

                        disk_id = disk["DISK_ID"]
                        if disk_id.nil? || disk_id.empty?
                            rc = Error.new('The DISK_ID is missing from the VM template')
                            raise
                        end

                        image_id           = disk["IMAGE_ID"]
                        opennebula_managed = disk["OPENNEBULA_MANAGED"]
                        type               = disk["TYPE"]

                        REMOVE_IMAGE_ATTRS.each do |attr|
                            disk.delete_element(attr)
                        end

                        if !image_id.nil? && !image_id.empty?
                            if type == 'CDROM'
                                replace << "DISK = [ IMAGE_ID = #{image_id}"
                                if opennebula_managed
                                    replace << ", OPENNEBULA_MANAGED=#{opennebula_managed}"
                                end
                                replace << " ]\n"
                            else
                                rc = disk_saveas(disk_id.to_i,"#{name}-disk-#{disk_id}","",-1)

                                raise if OpenNebula.is_error?(rc)

                                if persistent == true
                                    OpenNebula::Image.new_with_id(rc.to_i, @client).persistent()
                                end

                                img_ids << rc.to_i

                                disk_template = disk.template_like_str(".").tr("\n", ",\n")

                                if disk_template.empty?
                                    replace << "DISK = [ IMAGE_ID = #{rc} ] \n"
                                else
                                    replace << "DISK = [ IMAGE_ID = #{rc}, " <<
                                        disk_template << " ] \n"
                                end
                            end
                        else
                            # Volatile disks cannot be saved, so the definition is copied
                            replace << self.template_like_str(
                                "TEMPLATE", true, "DISK[DISK_ID=#{disk_id}]") << "\n"
                        end
                    end

                    self.each('TEMPLATE/NIC') do |nic|
                        nic_id = nic["NIC_ID"]

                        if nic_id.nil? || nic_id.empty?
                            rc = Error.new('The NIC_ID is missing from the VM template')
                            raise
                        end

                        REMOVE_VNET_ATTRS.each do |attr|
                            # Remove every automatically generated value
                            # The vnet will be referenced via NAME + UNAME (if defined)
                            nic.delete_element(attr)
                        end

                        replace << "NIC = [ " 
                        replace << nic.template_like_str(".").tr("\n", ",\n") << " ] \n"
                    end

                    # Required by the Sunstone Cloud View
                    replace << "SAVED_TEMPLATE_ID = #{tid}\n"

                    new_tmpl = OpenNebula::Template.new_with_id(new_tid, @client)

                    rc = new_tmpl.update(replace, true)
                    raise if OpenNebula.is_error?(rc)

                    return new_tid

                rescue
                    # Rollback. Delete the template and the images created
                    if !new_tid.nil?
                        new_tmpl = OpenNebula::Template.new_with_id(new_tid, @client)
                        new_tmpl.delete()
                    end

                    img_ids.each do |id|
                        img = OpenNebula::Image.new_with_id(id, @client)
                        img.delete()
                    end

                    return rc
                end
            end
        end
    end
end
# rubocop:enable Style/ClassAndModuleChildren
