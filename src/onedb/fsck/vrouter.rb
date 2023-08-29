
module OneDBFsck
    def check_vrouter
        vrouters_fix = @fixes_vrouter = {}

        # DATA: Aggregate information of the RUNNING vms
        @db.fetch("SELECT oid,body FROM vrouter_pool") do |row|
            vrouter_doc = nokogiri_doc(row[:body], 'vrouter_pool')

            check_ugid(vrouter_doc)

            # DATA: VNets used by this Virtual Router
            vrouter_doc.root.xpath("TEMPLATE/NIC").each do |nic|
                net_id = nil
                nic.xpath("NETWORK_ID").each do |nid|
                    net_id = nid.text.to_i
                end

                floating = false

                nic.xpath("FLOATING_IP").each do |floating_e|
                    floating = (floating_e.text.upcase == "YES")
                end

                if !net_id.nil? && floating
                    if counters[:vnet][net_id].nil?
                        log_error("VRouter #{row[:oid]} is using VNet #{net_id}, "<<
                            "but it does not exist", false)
                    else
                        # DATA: this part is copied from "VNets used by this VM"
                        mac = nic.at_xpath("MAC").nil? ? nil : nic.at_xpath("MAC").text

                        ar_id_e = nic.at_xpath('AR_ID')

                        if ar_id_e.nil?
                            if !counters[:vnet][net_id][:no_ar_leases][mac_s_to_i(mac)].nil?
                                log_error("VNet #{net_id} has more than one lease with the same MAC address (#{mac}). "<<
                                    "FSCK can't handle this, and consistency is not guaranteed", false)
                            end

                            counters[:vnet][net_id][:no_ar_leases][mac_s_to_i(mac)] = {
                                :ip         => nic.at_xpath("IP").nil? ? nil : nic.at_xpath("IP").text,
                                :ip6_global => nic.at_xpath("IP6_GLOBAL").nil? ? nil : nic.at_xpath("IP6_GLOBAL").text,
                                :ip6_link   => nic.at_xpath("IP6_LINK").nil? ? nil : nic.at_xpath("IP6_LINK").text,
                                :ip6_ula    => nic.at_xpath("IP6_ULA").nil? ? nil : nic.at_xpath("IP6_ULA").text,
                                :mac        => mac,
                                :vm         => nil,
                                :vnet       => nil,
                                :vrouter    => row[:oid],
                            }
                        else
                            ar_id = ar_id_e.text.to_i

                            if counters[:vnet][net_id][:ar_leases][ar_id].nil?
                                log_error("VRouter #{row[:oid]} is using VNet #{net_id}, AR #{ar_id}, "<<
                                    "but the AR does not exist", false)
                            else
                                counters[:vnet][net_id][:ar_leases][ar_id][mac_s_to_i(mac)] = {
                                    :ip         => nic.at_xpath("IP").nil? ? nil : nic.at_xpath("IP").text,
                                    :ip6_global => nic.at_xpath("IP6_GLOBAL").nil? ? nil : nic.at_xpath("IP6_GLOBAL").text,
                                    :ip6_link   => nic.at_xpath("IP6_LINK").nil? ? nil : nic.at_xpath("IP6_LINK").text,
                                    :ip6_ula    => nic.at_xpath("IP6_ULA").nil? ? nil : nic.at_xpath("IP6_ULA").text,
                                    :mac        => mac,
                                    :vm         => nil,
                                    :vnet       => nil,
                                    :vrouter    => row[:oid],
                                }
                            end
                        end
                    end
                end
            end

            # DATA: re-do list of VM IDs per vrouter
            error = fix_permissions('VROUTER', row[:oid], vrouter_doc)

            counters_vrouter = counters[:vrouter][row[:oid]]

            vms_elem = vrouter_doc.root.at_xpath("VMS").remove

            vms_new_elem = vrouter_doc.create_element("VMS")
            vrouter_doc.root.add_child(vms_new_elem)

            counters_vrouter[:vms].each do |id|
                id_elem = vms_elem.at_xpath("ID[.=#{id}]")

                if id_elem.nil?
                    log_error(
                        "VM #{id} is missing from VRouter #{row[:oid]} VM id list")

                    error = true
                else
                    id_elem.remove
                end

                vms_new_elem.add_child(vrouter_doc.create_element("ID")).content = id.to_s
            end

            vms_elem.xpath("ID").each do |id_elem|
                log_error(
                    "VM #{id_elem.text} is in VRouter #{row[:oid]} VM id list, "<<
                    "but it should not")

                error = true
            end

            if (error)
                vrouters_fix[row[:oid]] = vrouter_doc.root.to_s
            end
        end
    end

    def fix_vrouter
        # DATA: FIX: update vrouter_pool with regenerated documents (ids)
        @db.transaction do
            @fixes_vrouter.each do |id, body|
                @db[:vrouter_pool].where(oid: id).update(body: body)
            end
        end
    end
end

