
module OneDBFsck
    def check_vm
        vms_fix = @fixes_vm = {}
        @fixes_vm_history = {}

        @data_vm = {}
        cluster_vnc = @data_vm[:vnc] = {}

        @vms_ports = {}

        # DATA: Aggregate information of the RUNNING vms
        @db.fetch("SELECT oid,body FROM vm_pool WHERE state<>6") do |row|
            vm_doc = nokogiri_doc(row[:body], 'vm_pool')

            check_ugid(vm_doc)

            state     = vm_doc.root.at_xpath('STATE').text.to_i
            lcm_state = vm_doc.root.at_xpath('LCM_STATE').text.to_i

            # DATA: VNC ports per cluster
            cid = vm_doc.root.at_xpath("HISTORY_RECORDS/HISTORY[last()]/CID").text.to_i rescue nil
            port = vm_doc.root.at_xpath('TEMPLATE/GRAPHICS[translate(TYPE,"vnc","VNC")="VNC"]/PORT').text.to_i rescue nil
            # DATA: TODO: get also spice port

            # Do not add port if the VM is in one of these states:
            #   * init
            #   * pending
            #   * hold
            #   * stopped
            #   * undeployed
            if cid && port && ![0, 1, 2, 4, 9].include?(state)
                cluster_vnc[cid] ||= Set.new
                cluster_vnc[cid] << port
            end

            # Check if two or more VMs have the same VNC port within a cluster
            if cid && port && ![0, 1, 2, 4, 9].include?(state)
                @vms_ports[port]      = {} unless @vms_ports[port]
                @vms_ports[port][cid] = [] unless @vms_ports[port][cid]

                @vms_ports[port][cid] << vm_doc.root.at_xpath('ID').text.to_i
            end

            fix_permissions('VM', row[:oid], vm_doc)

            # DATA: Images used by this VM
            vm_doc.root.xpath("TEMPLATE/DISK/IMAGE_ID").each do |e|
                img_id = e.text.to_i

                if counters[:image][img_id].nil?
                    log_error("VM #{row[:oid]} is using Image #{img_id}, but "<<
                        "it does not exist", false)
                else
                    counters[:image][img_id][:vms].add(row[:oid])
                end
            end

            # DATA: VNets used by this VM
            nics = vm_doc.root.xpath("TEMPLATE/NIC")

            # Nic Alias used by this VM
            vm_doc.root.xpath("TEMPLATE/NIC_ALIAS").each do |nic|
                nics << nic
            end

            # NIC PCI used by this VM
            vm_doc.root.xpath('TEMPLATE/PCI').each do |nic|
                next unless nic.xpath('NETWORK_ID')

                nics << nic
            end

            nics.each do |nic|
                net_id = nil
                nic.xpath("NETWORK_ID").each do |nid|
                    net_id = nid.text.to_i
                end

                if !net_id.nil?
                    if counters[:vnet][net_id].nil?
                        log_error("VM #{row[:oid]} is using VNet #{net_id}, "<<
                            "but it does not exist", false)
                    else

                        mac = nic.at_xpath("MAC").nil? ? nil : nic.at_xpath("MAC").text

                        ar_id_e = nic.at_xpath('AR_ID')

                        if ar_id_e.nil?
                            if !counters[:vnet][net_id][:no_ar_leases][mac_s_to_i(mac)].nil?
                                log_error("VNet #{net_id} has more than one lease with the same MAC address (#{mac}). "<<
                                    "FSCK can't handle this, and consistency is not guaranteed", false)
                            end

                            # DATA: IPs per network no ar
                            counters[:vnet][net_id][:no_ar_leases][mac_s_to_i(mac)] = {
                                :ip         => nic.at_xpath("IP").nil? ? nil : nic.at_xpath("IP").text,
                                :ip6_global => nic.at_xpath("IP6_GLOBAL").nil? ? nil : nic.at_xpath("IP6_GLOBAL").text,
                                :ip6_link   => nic.at_xpath("IP6_LINK").nil? ? nil : nic.at_xpath("IP6_LINK").text,
                                :ip6_ula    => nic.at_xpath("IP6_ULA").nil? ? nil : nic.at_xpath("IP6_ULA").text,
                                :mac        => mac,
                                :vm         => row[:oid],
                                :vnet       => nil,
                                :vrouter    => nil
                            }
                        else
                            ar_id = ar_id_e.text.to_i

                            if counters[:vnet][net_id][:ar_leases][ar_id].nil?
                                log_error("VM #{row[:oid]} is using VNet #{net_id}, AR #{ar_id}, "<<
                                    "but the AR does not exist", false)
                                # DATA: why these are not added to counters?
                            else
                                # DATA: IPs per network with ar
                                counters[:vnet][net_id][:ar_leases][ar_id][mac_s_to_i(mac)] = {
                                    :ip         => nic.at_xpath("IP").nil? ? nil : nic.at_xpath("IP").text,
                                    :ip6_global => nic.at_xpath("IP6_GLOBAL").nil? ? nil : nic.at_xpath("IP6_GLOBAL").text,
                                    :ip6_link   => nic.at_xpath("IP6_LINK").nil? ? nil : nic.at_xpath("IP6_LINK").text,
                                    :ip6_ula    => nic.at_xpath("IP6_ULA").nil? ? nil : nic.at_xpath("IP6_ULA").text,
                                    :mac        => mac,
                                    :vm         => row[:oid],
                                    :vnet       => nil,
                                    :vrouter    => nil
                                }
                            end
                        end
                    end
                end
            end

            # See if it's part of a Virtual Router
            vrouter_e = vm_doc.root.at_xpath("TEMPLATE/VROUTER_ID")

            # DATA: add vrouter counters
            if !vrouter_e.nil?
                vr_id = vrouter_e.text.to_i
                counters_vrouter = counters[:vrouter][vr_id]

                if counters_vrouter.nil?
                    log_error("VM #{row[:oid]} is part of VRouter #{vr_id}, but "<<
                        "it does not exist", false)
                else
                    counters_vrouter[:vms].add(row[:oid])
                end
            end

            # DATA: Host resources

            # Only states that add to Host resources consumption are
            # ACTIVE, SUSPENDED, POWEROFF
            next if !([3,5,8].include? state)

            # DATA: Get memory (integer)
            memory = vm_doc.root.at_xpath("TEMPLATE/MEMORY").text.to_i

            # DATA: Get CPU (float)
            cpu = vm_doc.root.at_xpath("TEMPLATE/CPU").text.to_f

            # DATA: Get hostid, hostname
            hid = -1
            vm_doc.root.xpath("HISTORY_RECORDS/HISTORY[last()]/HID").each { |e|
                hid = e.text.to_i
            }

            hostname = ""
            vm_doc.root.xpath("HISTORY_RECORDS/HISTORY[last()]/HOSTNAME").each { |e|
                hostname = e.text
            }

            counters_host = counters[:host][hid]

            if counters_host.nil?
                log_error("VM #{row[:oid]} is using Host #{hid}, "<<
                    "but it does not exist", false)
            else
                # DATA: FIX: hostname is wrong, fix inline
                if counters_host[:name] != hostname
                    log_error("VM #{row[:oid]} has a wrong hostname for "<<
                        "Host #{hid}, #{hostname}. It will be changed to "<<
                        "#{counters_host[:name]}")

                    vm_doc.root.xpath(
                        "HISTORY_RECORDS/HISTORY[last()]/HOSTNAME").each { |e|
                        e.content = counters_host[:name]
                    }

                    vms_fix[row[:oid]] = vm_doc.root.to_s
                else
                    @db[:vm_pool].where(
                        :oid => row[:oid]
                    ).update(:body => vm_doc.root.to_s)
                end

                # DATA: add resources to host counters
                counters_host[:memory] += memory
                counters_host[:cpu]    += cpu
                counters_host[:rvms].add(row[:oid])
            end

            # DATA: search history for VMMMAD and TMMAD to translate
            @db.fetch("SELECT * FROM history WHERE vid=#{row[:oid]}") do |hrow|
                # hdoc = Nokogiri::XML(hrow[:body],nil,NOKOGIRI_ENCODING){|c| c.default_xml.noblanks}
                hdoc = nokogiri_doc(hrow[:body], 'history')

                found = false

                # Rename VMMMAD -> VM_MAD and TMMAD -> TM_MAD
                hdoc.root.xpath("VMMMAD").each {|e|
                    e.name = "VM_MAD"
                    found = true
                }

                hdoc.root.xpath("TMMAD").each  {|e|
                    e.name = "TM_MAD"
                    found = true
                }

                # DATA: translate VMMMAD and TMMAD to VM_MAD and TM_MAD
                if found
                    index = [hrow[:vid], hrow[:seq]]
                    @fixes_vm_history[index] = hdoc.root.to_s
                end
            end
        end
    end

    def check_vnc_ports
        @vms_ports.each do |port, cid|
            cid.each do |cid, vms|
                next if vms.size == 1

                log_error(
                    "VMs #{vms.join(', ')} have the same VNC port #{port} " \
                    "in cluster #{cid}",
                    false
                )
            end
        end
    end

    def fix_vm
        # DATA: FIX: do vm_pool fixes
        @db.transaction do
            @fixes_vm.each do |id, body|
                @db[:vm_pool].where(:oid => id).update(:body => body)
            end

            @fixes_vm_history.each do |index, body|
                vid, seq = index
                @db[:history].where(vid: vid, seq: seq).update(body: body)
            end
        end
    end
end
