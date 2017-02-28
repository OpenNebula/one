
module OneDBFsck
    def check_fix_user_quotas
        # This block is not needed for now
=begin
        @db.transaction do
            @db.fetch("SELECT oid FROM user_pool") do |row|
                found = false

                @db.fetch("SELECT user_oid FROM user_quotas WHERE user_oid=#{row[:oid]}") do |q_row|
                    found = true
                end

                if !found
                    log_error("User #{row[:oid]} does not have a quotas entry")

                    @db.run "INSERT INTO user_quotas VALUES(#{row[:oid]},'<QUOTAS><ID>#{row[:oid]}</ID><DATASTORE_QUOTA></DATASTORE_QUOTA><NETWORK_QUOTA></NETWORK_QUOTA><VM_QUOTA></VM_QUOTA><IMAGE_QUOTA></IMAGE_QUOTA></QUOTAS>');"
                end
            end
        end
=end
        @db.run "ALTER TABLE user_quotas RENAME TO old_user_quotas;"
        create_table(:user_quotas)

        @db.transaction do
            # oneadmin does not have quotas
            @db.fetch("SELECT * FROM old_user_quotas WHERE user_oid=0") do |row|
                @db[:user_quotas].insert(row)
            end

            @db.fetch("SELECT * FROM old_user_quotas WHERE user_oid>0") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                calculate_quotas(doc, "uid=#{row[:user_oid]}", "User")

                @db[:user_quotas].insert(
                    :user_oid   => row[:user_oid],
                    :body       => doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_user_quotas;"
    end

    def check_fix_group_quotas
        # This block is not needed for now
=begin
        @db.transaction do
            @db.fetch("SELECT oid FROM group_pool") do |row|
                found = false

                @db.fetch("SELECT group_oid FROM group_quotas WHERE group_oid=#{row[:oid]}") do |q_row|
                    found = true
                end

                if !found
                    log_error("Group #{row[:oid]} does not have a quotas entry")

                    @db.run "INSERT INTO group_quotas VALUES(#{row[:oid]},'<QUOTAS><ID>#{row[:oid]}</ID><DATASTORE_QUOTA></DATASTORE_QUOTA><NETWORK_QUOTA></NETWORK_QUOTA><VM_QUOTA></VM_QUOTA><IMAGE_QUOTA></IMAGE_QUOTA></QUOTAS>');"
                end
            end
        end
=end
        @db.run "ALTER TABLE group_quotas RENAME TO old_group_quotas;"
        create_table(:group_quotas)

        @db.transaction do
            # oneadmin does not have quotas
            @db.fetch("SELECT * FROM old_group_quotas WHERE group_oid=0") do |row|
                @db[:group_quotas].insert(row)
            end

            @db.fetch("SELECT * FROM old_group_quotas WHERE group_oid>0") do |row|
                doc = Nokogiri::XML(row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

                calculate_quotas(doc, "gid=#{row[:group_oid]}", "Group")

                @db[:group_quotas].insert(
                    :group_oid   => row[:group_oid],
                    :body       => doc.root.to_s)
            end
        end

        @db.run "DROP TABLE old_group_quotas;"
    end

    def calculate_quotas(doc, where_filter, resource)
        oid = doc.root.at_xpath("ID").text.to_i

        # VM quotas
        cpu_used = 0
        mem_used = 0
        vms_used = 0
        sys_used = 0

        # VNet quotas
        vnet_usage = {}

        # Image quotas
        img_usage = {}
        datastore_usage = {}

        @db.fetch("SELECT body FROM vm_pool WHERE #{where_filter} AND state<>6") do |vm_row|
            vmdoc = nokogiri_doc(vm_row[:body])

            # VM quotas
            vmdoc.root.xpath("TEMPLATE/CPU").each { |e|
                # truncate to 2 decimals
                cpu = (e.text.to_f * 100).to_i
                cpu_used += cpu
            }

            vmdoc.root.xpath("TEMPLATE/MEMORY").each { |e|
                mem_used += e.text.to_i
            }

            vmdoc.root.xpath("TEMPLATE/DISK").each { |e|
                type = ""

                e.xpath("TYPE").each { |t_elem|
                    type = t_elem.text.upcase
                }

                size = 0

                if !e.at_xpath("SIZE").nil?
                    size = e.at_xpath("SIZE").text.to_i
                end

                if ( type == "SWAP" || type == "FS")
                    sys_used += size
                else
                    if !e.at_xpath("CLONE").nil?
                        clone = (e.at_xpath("CLONE").text.upcase == "YES")

                        target = nil

                        if clone
                            target = e.at_xpath("CLONE_TARGET").text if !e.at_xpath("CLONE_TARGET").nil?
                        else
                            target = e.at_xpath("LN_TARGET").text if !e.at_xpath("LN_TARGET").nil?
                        end

                        if !target.nil? && target == "SYSTEM"
                            sys_used += size

                            if !e.at_xpath("DISK_SNAPSHOT_TOTAL_SIZE").nil?
                                sys_used += e.at_xpath("DISK_SNAPSHOT_TOTAL_SIZE").text.to_i
                            end
                        elsif !target.nil? && target == "SELF"
                            datastore_id = e.at_xpath("DATASTORE_ID").text
                            datastore_usage[datastore_id] ||= 0
                            datastore_usage[datastore_id] += size

                            if !e.at_xpath("DISK_SNAPSHOT_TOTAL_SIZE").nil?
                                datastore_usage[datastore_id] += e.at_xpath("DISK_SNAPSHOT_TOTAL_SIZE").text.to_i
                            end
                        end
                    end
                end
            }

            vms_used += 1

            # VNet quotas
            vmdoc.root.xpath("TEMPLATE/NIC/NETWORK_ID").each { |e|
                vnet_usage[e.text] = 0 if vnet_usage[e.text].nil?
                vnet_usage[e.text] += 1
            }

            # Image quotas
            vmdoc.root.xpath("TEMPLATE/DISK/IMAGE_ID").each { |e|
                img_usage[e.text] = 0 if img_usage[e.text].nil?
                img_usage[e.text] += 1
            }
        end

        @db.fetch("SELECT body FROM vrouter_pool WHERE #{where_filter}") do |vrouter_row|
            vrouter_doc = Nokogiri::XML(vrouter_row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            # VNet quotas
            vrouter_doc.root.xpath("TEMPLATE/NIC").each { |nic|
                net_id = nil
                nic.xpath("NETWORK_ID").each do |nid|
                    net_id = nid.text
                end

                floating = false

                nic.xpath("FLOATING_IP").each do |floating_e|
                    floating = (floating_e.text.upcase == "YES")
                end

                if !net_id.nil? && floating
                    vnet_usage[net_id] = 0 if vnet_usage[net_id].nil?

                    vnet_usage[net_id] += 1
                end
            }
        end

        # VM quotas

        vm_elem = nil
        doc.root.xpath("VM_QUOTA/VM").each { |e| vm_elem = e }

        if vm_elem.nil?
            doc.root.xpath("VM_QUOTA").each { |e| e.remove }

            vm_quota  = doc.root.add_child(doc.create_element("VM_QUOTA"))
            vm_elem   = vm_quota.add_child(doc.create_element("VM"))

            vm_elem.add_child(doc.create_element("CPU")).content         = "-1"
            vm_elem.add_child(doc.create_element("CPU_USED")).content    = "0"

            vm_elem.add_child(doc.create_element("MEMORY")).content      = "-1"
            vm_elem.add_child(doc.create_element("MEMORY_USED")).content = "0"

            vm_elem.add_child(doc.create_element("VMS")).content         = "-1"
            vm_elem.add_child(doc.create_element("VMS_USED")).content    = "0"

            vm_elem.add_child(doc.create_element("SYSTEM_DISK_SIZE")).content       = "-1"
            vm_elem.add_child(doc.create_element("SYSTEM_DISK_SIZE_USED")).content  = "0"
        end

        vm_elem.xpath("CPU_USED").each { |e|
            # Because of bug http://dev.opennebula.org/issues/1567 the element
            # may contain a float number in scientific notation.

            # Check if the float value or the string representation mismatch,
            # but ignoring the precision

            cpu_used = (cpu_used / 100.0)

            different = ( e.text.to_f != cpu_used ||
                ![sprintf('%.2f', cpu_used), sprintf('%.1f', cpu_used), sprintf('%.0f', cpu_used)].include?(e.text)  )

            cpu_used_str = sprintf('%.2f', cpu_used)

            if different
                log_error("#{resource} #{oid} quotas: CPU_USED has #{e.text} \tis\t#{cpu_used_str}")
                e.content = cpu_used_str
            end
        }

        vm_elem.xpath("MEMORY_USED").each { |e|
            if e.text != mem_used.to_s
                log_error("#{resource} #{oid} quotas: MEMORY_USED has #{e.text} \tis\t#{mem_used}")
                e.content = mem_used.to_s
            end
        }

        vm_elem.xpath("VMS_USED").each { |e|
            if e.text != vms_used.to_s
                log_error("#{resource} #{oid} quotas: VMS_USED has #{e.text} \tis\t#{vms_used}")
                e.content = vms_used.to_s
            end
        }

        vm_elem.xpath("SYSTEM_DISK_SIZE_USED").each { |e|
            if e.text != sys_used.to_s
                log_error("#{resource} #{oid} quotas: SYSTEM_DISK_SIZE_USED has #{e.text} \tis\t#{sys_used}")
                e.content = sys_used.to_s
            end
        }

        # VNet quotas

        net_quota = nil
        doc.root.xpath("NETWORK_QUOTA").each { |e| net_quota = e }

        if net_quota.nil?
            net_quota = doc.root.add_child(doc.create_element("NETWORK_QUOTA"))
        end

        net_quota.xpath("NETWORK").each { |net_elem|
            vnet_id = net_elem.at_xpath("ID").text

            leases_used = vnet_usage.delete(vnet_id)

            leases_used = 0 if leases_used.nil?

            net_elem.xpath("LEASES_USED").each { |e|
                if e.text != leases_used.to_s
                    log_error("#{resource} #{oid} quotas: VNet #{vnet_id}\tLEASES_USED has #{e.text} \tis\t#{leases_used}")
                    e.content = leases_used.to_s
                end
            }
        }

        vnet_usage.each { |vnet_id, leases_used|
            log_error("#{resource} #{oid} quotas: VNet #{vnet_id}\tLEASES_USED has 0 \tis\t#{leases_used}")

            new_elem = net_quota.add_child(doc.create_element("NETWORK"))

            new_elem.add_child(doc.create_element("ID")).content = vnet_id
            new_elem.add_child(doc.create_element("LEASES")).content = "-1"
            new_elem.add_child(doc.create_element("LEASES_USED")).content = leases_used.to_s
        }

        # Image quotas

        img_quota = nil
        doc.root.xpath("IMAGE_QUOTA").each { |e| img_quota = e }

        if img_quota.nil?
            img_quota = doc.root.add_child(doc.create_element("IMAGE_QUOTA"))
        end

        img_quota.xpath("IMAGE").each { |img_elem|
            img_id = img_elem.at_xpath("ID").text

            rvms = img_usage.delete(img_id)

            rvms = 0 if rvms.nil?

            img_elem.xpath("RVMS_USED").each { |e|
                if e.text != rvms.to_s
                    log_error("#{resource} #{oid} quotas: Image #{img_id}\tRVMS has #{e.text} \tis\t#{rvms}")
                    e.content = rvms.to_s
                end
            }
        }

        img_usage.each { |img_id, rvms|
            log_error("#{resource} #{oid} quotas: Image #{img_id}\tRVMS has 0 \tis\t#{rvms}")

            new_elem = img_quota.add_child(doc.create_element("IMAGE"))

            new_elem.add_child(doc.create_element("ID")).content = img_id
            new_elem.add_child(doc.create_element("RVMS")).content = "-1"
            new_elem.add_child(doc.create_element("RVMS_USED")).content = rvms.to_s
        }

        # Datastore quotas
        ds_usage = {}

        @db.fetch("SELECT body FROM image_pool WHERE #{where_filter}") do |img_row|
            img_doc = Nokogiri::XML(img_row[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}

            img_doc.root.xpath("DATASTORE_ID").each { |e|
                ds_usage[e.text] = [0,0] if ds_usage[e.text].nil?
                ds_usage[e.text][0] += 1

                img_doc.root.xpath("SIZE").each { |size|
                    ds_usage[e.text][1] += size.text.to_i
                }

                img_doc.root.xpath("SNAPSHOTS/SNAPSHOT/SIZE").each { |size|
                    ds_usage[e.text][1] += size.text.to_i
                }
            }
        end

        ds_quota = nil
        doc.root.xpath("DATASTORE_QUOTA").each { |e| ds_quota = e }

        if ds_quota.nil?
            ds_quota = doc.root.add_child(doc.create_element("DATASTORE_QUOTA"))
        end

        ds_quota.xpath("DATASTORE").each { |ds_elem|
            ds_id = ds_elem.at_xpath("ID").text

            images_used,size_used = ds_usage.delete(ds_id)

            images_used = 0 if images_used.nil?
            size_used   = 0 if size_used.nil?

            cloned_usage = datastore_usage[ds_id] || 0
            size_used += cloned_usage

            ds_elem.xpath("IMAGES_USED").each { |e|
                if e.text != images_used.to_s
                    log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tIMAGES_USED has #{e.text} \tis\t#{images_used}")
                    e.content = images_used.to_s
                end
            }

            ds_elem.xpath("SIZE_USED").each { |e|
                if e.text != size_used.to_s
                    log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tSIZE_USED has #{e.text} \tis\t#{size_used}")
                    e.content = size_used.to_s
                end
            }
        }

        ds_usage.each { |ds_id, array|
            images_used,size_used = array

            log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tIMAGES_USED has 0 \tis\t#{images_used}")
            log_error("#{resource} #{oid} quotas: Datastore #{ds_id}\tSIZE_USED has 0 \tis\t#{size_used}")

            new_elem = ds_quota.add_child(doc.create_element("DATASTORE"))

            new_elem.add_child(doc.create_element("ID")).content = ds_id

            new_elem.add_child(doc.create_element("IMAGES")).content = "-1"
            new_elem.add_child(doc.create_element("IMAGES_USED")).content = images_used.to_s

            new_elem.add_child(doc.create_element("SIZE")).content = "-1"
            new_elem.add_child(doc.create_element("SIZE_USED")).content = size_used.to_s
        }
    end
end

