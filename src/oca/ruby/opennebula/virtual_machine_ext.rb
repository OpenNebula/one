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
            REMOVE_VNET_ATTRS = %w[AR_ID BRIDGE CLUSTER_ID IP MAC TARGET NIC_ID
                                   NETWORK_ID VN_MAD SECURITY_GROUPS VLAN_ID
                                   BRIDGE_TYPE]

            REMOVE_IMAGE_ATTRS = %w[DEV_PREFIX SOURCE ORIGINAL_SIZE SIZE
                                    DISK_SNAPSHOT_TOTAL_SIZE DRIVER IMAGE_STATE
                                    SAVE CLONE READONLY PERSISTENT TARGET
                                    ALLOW_ORPHANS CLONE_TARGET CLUSTER_ID
                                    DATASTORE DATASTORE_ID DISK_ID DISK_TYPE
                                    IMAGE_ID IMAGE IMAGE_UNAME IMAGE_UID
                                    LN_TARGET TM_MAD TYPE OPENNEBULA_MANAGED]

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

                raise Error, rc.message if OpenNebula.is_error?(rc)

                tid = self['TEMPLATE/TEMPLATE_ID']

                raise Error, 'VM has no associated template' unless valid?(tid)

                # --------------------------------------------------------------
                # Check VM state and poweroff it if needed
                # --------------------------------------------------------------
                if state_str != 'POWEROFF'
                    raise Error, 'VM must be POWEROFF' unless opts[:poweroff]

                    logger.info 'Powering off VM' if logger

                    poweron = true

                    rc = poweroff

                    raise Error, rc.message if OpenNebula.is_error?(rc)
                end

                # --------------------------------------------------------------
                # Clone the source template
                # --------------------------------------------------------------
                vm_template = OpenNebula::Template.new_with_id(tid, @client)

                ntid = vm_template.clone(name)

                raise Error, ntid.message if OpenNebula.is_error?(ntid)

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

                    raise Error, rc.message if OpenNebula.is_error?(rc)

                    disk_id  = disk['DISK_ID']
                    image_id = disk['IMAGE_ID']

                    omng = disk['OPENNEBULA_MANAGED']
                    type = disk['TYPE']

                    raise Error, 'Missing DISK_ID' unless valid?(disk_id)

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

                    raise Error, rc.message if OpenNebula.is_error?(rc)

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

                    raise Error, 'Missing NIC_ID' unless valid?(nic_id)

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

                raise Error, rc.message if OpenNebula.is_error?(rc)

                # --------------------------------------------------------------
                # Resume VM if needed
                # --------------------------------------------------------------
                if poweron
                    logger.info 'Powering on VM' if logger

                    rc = wait_state2('POWEROFF', 'LCM_INIT')

                    raise Error, rc.message if OpenNebula.is_error?(rc)

                    resume

                    rc = wait_state2('ACTIVE', 'RUNNING')

                    raise Error, rc.message if OpenNebula.is_error?(rc)
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

            #-------------------------------------------------------------------
            #  Backups a VM. TODO Add final description
            #  @param keep [Bool]
            #  @param logger[Logger]
            #  @param binfo[Hash] Oneshot
            #-------------------------------------------------------------------
            def backup(keep = false, logger = nil, binfo = nil)
                # --------------------------------------------------------------
                # Check backup consistency
                # --------------------------------------------------------------
                unless binfo
                    rc = info
                    raise Error, rc.message if OpenNebula.is_error?(rc)

                    binfo = backup_info
                end

                raise Error, 'No backup information' if binfo.nil?

                raise Error, 'No frequency defined' unless valid?(binfo[:freq])

                return if Time.now.to_i - binfo[:last].to_i < binfo[:freq].to_i

                # --------------------------------------------------------------
                # Save VM as new template
                # --------------------------------------------------------------
                logger.info 'Saving VM as template' if logger

                tid = save_as_template(
                    binfo[:name], '', :poweroff => true, :logger => logger
                )

                tmp = OpenNebula::Template.new_with_id(tid, @client)
                rc  = tmp.info

                raise Error, rc.message if OpenNebula.is_error?(rc)

                # --------------------------------------------------------------
                # Import template into Marketplace & update VM info
                # --------------------------------------------------------------
                logger.info "Importing template #{tmp.id} to marketplace "\
                    "#{binfo[:market]}" if logger

                tmp.extend(OpenNebula::TemplateExt)

                rc, ids = tmp.mp_import(binfo[:market], true, binfo[:name],
                                        :wait => true, :logger => logger)

                raise Error, rc.message if OpenNebula.is_error?(rc)

                logger.info "Imported app ids: #{ids.join(',')}" if logger

                rc = update(backup_attr(binfo, ids), true)

                if OpenNebula.is_error?(rc)
                    raise Error, 'Could not update the backup reference: '\
                      " #{rc.message}. New backup ids are #{ids.join(',')}."
                end

                # --------------------------------------------------------------
                # Cleanup
                # --------------------------------------------------------------
                logger.info "Deleting template #{tmp.id}" if logger

                tmp.delete(true)

                binfo[:apps].each do |id|
                    log "Deleting applicance #{id}" if logger

                    papp = OpenNebula::MarketPlaceApp.new_with_id(id, @client)

                    papp.delete
                end if !keep && binfo[:apps]
            rescue Error, StandardError => e
                logger.fatal(e.inspect) if logger
                raise
            end

            #-------------------------------------------------------------------
            # Restores VM information from previous backup
            #
            # @param datastore [Integer] Datastore ID to import app backup
            # @param logger    [Logger]  Logger instance to print debug info
            #
            # @return [Integer] VM ID
            #-------------------------------------------------------------------
            def restore(datastore, logger = nil)
                rc = info

                if OpenNebula.is_error?(rc)
                    raise Error, "Error getting VM: #{rc.message}"
                end

                logger.info 'Reading backup information' if logger

                backup_ids = backup_info[:apps]

                # highest (=last) of the app ids is the template id
                app_id = backup_ids.last

                app = OpenNebula::MarketPlaceApp.new_with_id(app_id, @client)
                rc  = app.info

                if OpenNebula.is_error?(rc)
                    raise Error,
                          "Can not find appliance #{app_id}: #{rc.message}."
                end

                if logger
                    logger.info "Restoring VM #{self['ID']} from " \
                                "saved appliance #{app_id}"
                end

                app.extend(OpenNebula::MarketPlaceAppExt)

                exp = app.export(:dsid => Integer(datastore),
                                 :name => "#{self['NAME']} - RESTORED")

                if OpenNebula.is_error?(exp)
                    raise Error, "Can not restore app: #{exp.message}."
                end

                # Check possible errors when exporting apps
                exp[:image].each do |image|
                    next unless OpenNebula.is_error?(image)

                    raise Error, "Error restoring image: #{image.message}."
                end

                template = exp[:vmtemplate].first

                if OpenNebula.is_error?(template)
                    raise Error,
                          "Error restoring template: #{template.message}."
                end

                if logger
                    logger.info(
                        "Backup restored, VM template: #{exp[:vmtemplate]}, " \
                        "images: #{exp[:image]}"
                    )

                    logger.info(
                        "Instantiating the template #{exp[:vmtemplate]}"
                    )
                end

                tmpl = OpenNebula::Template.new_with_id(template, @client)
                rc   = tmpl.instantiate

                if OpenNebula.is_error?(rc)
                    raise Error,
                          "Can not instantiate the template: #{rc.message}."
                end

                rc
            rescue Error, StandardError => e
                logger.fatal(e.inspect) if logger
                raise
            end

            ####################################################################
            # Private extended interface
            ####################################################################

            private

            # --------------------------------------------------------------
            # Check an attribute is defined and valid
            # --------------------------------------------------------------
            def valid?(att)
                return !att.nil? && !att.empty? if att.is_a? String

                !att.nil?
            end

            #-------------------------------------------------------------------
            #  Get backup information from the VM
            #-------------------------------------------------------------------
            def backup_info
                base  = '//USER_TEMPLATE/BACKUP'
                binfo = {}

                app_ids = self["#{base}/MARKETPLACE_APP_IDS"] || ''

                binfo[:name] = "#{self['NAME']} - BACKUP " \
                               " - #{Time.now.strftime('%Y%m%d_%k%M')}"

                binfo[:freq]   = self["#{base}/FREQUENCY_SECONDS"]
                binfo[:last]   = self["#{base}/LAST_COPY_TIME"]
                binfo[:market] = Integer(self["#{base}/MARKETPLACE_ID"])
                binfo[:apps]   = app_ids.split(',')

                binfo
            rescue StandardError
                binfo
            end

            def backup_attr(binfo, ids)
                'BACKUP=[' \
                "  MARKETPLACE_APP_IDS = \"#{ids.join(',')}\"," \
                "  FREQUENCY_SECONDS   = \"#{binfo[:freq]}\"," \
                "  LAST_COPY_TIME      = \"#{Time.now.to_i}\"," \
                "  MARKETPLACE_ID      = \"#{binfo[:market]}\" ]"
            end

        end
    end

end
# rubocop:enable Style/ClassAndModuleChildren
