
module OneDBFsck

    # Init vnet counters
    def init_network_counters
        @db.fetch("SELECT oid,body FROM network_pool") do |row|
            doc = nokogiri_doc(row[:body])

            ar_leases = {}

            doc.root.xpath("AR_POOL/AR/AR_ID").each do |ar_id|
                ar_leases[ar_id.text.to_i] = {}
            end

            counters[:vnet][row[:oid]] = {
                :ar_leases      => ar_leases,
                :no_ar_leases   => {}
            }
        end
    end

    def check_network_cluster
        cluster = @data_cluster
        @fixes_host_cluster = {}

        @db.fetch("SELECT oid,body FROM network_pool") do |row|
            doc = nokogiri_doc(row[:body])

            doc.root.xpath("CLUSTERS/ID").each do |e|
                cluster_id = e.text.to_i

                cluster_entry = cluster[cluster_id]

                if cluster_entry.nil?
                    log_error("VNet #{row[:oid]} is in cluster " <<
                              "#{cluster_id}, but it does not exist")

                    e.remove

                    @fixes_host_cluster[row[:oid]] = { body: doc.root.to_s }
                else
                    cluster_entry[:vnets] << row[:oid]
                end
            end
        end
    end

    def fix_network_cluster
        @db.transaction do
            @fixes_host_cluster.each do |id, entry|
                @db[:host_pool].where(oid: id).update(body: entry[:body])
            end
        end
    end

    def init_network_lease_counters
        @db.fetch("SELECT oid,body,pid FROM network_pool WHERE pid<>-1") do |row|
            doc = nokogiri_doc(row[:body])

            parent_vnet = doc.root.at_xpath("PARENT_NETWORK_ID").text.to_i

            if (row[:pid] != parent_vnet)
                # TODO
            end

            doc.root.xpath("AR_POOL/AR").each do |ar|
                parent_ar_e = ar.at_xpath("PARENT_NETWORK_AR_ID")
                if !(parent_ar_e.nil? || parent_ar_e.text == "")

                    parent_ar = parent_ar_e.text.to_i

                    if counters[:vnet][parent_vnet][:ar_leases][parent_ar].nil?
                        log_error(
                            "VNet #{row[:oid]} is using parent "<<
                            "VNet #{parent_vnet}, AR #{parent_ar}, "<<
                            "but the AR does not exist", false)
                    end

                    # MAC
                    first_mac = mac_s_to_i(ar.at_xpath("MAC").text)

                    # IP
                    first_ip = nil
                    if (!ar.at_xpath("IP").nil?)
                        first_ip = IPAddr.new(ar.at_xpath("IP").text.strip, Socket::AF_INET)
                    end

                    # IP6
                    global_prefix = nil
                    if !ar.at_xpath("GLOBAL_PREFIX").nil?
                        global_prefix = ip6_prefix_s_to_i(
                                    ar.at_xpath("GLOBAL_PREFIX").text)
                    end

                    ula_prefix = nil
                    if !ar.at_xpath("ULA_PREFIX").nil?
                        ula_prefix = ip6_prefix_s_to_i(
                                    ar.at_xpath("ULA_PREFIX").text)
                    end

                    link_prefix = nil
                    type = ar.at_xpath("TYPE").text
                    if ( type == "IP6" || type == "IP4_6" )
                        link_prefix = 0xfe80000000000000
                    end

                    # Parent vnet has a lease for each address of this reservation
                    ar.at_xpath("SIZE").text.to_i.times do |index|

                        lease = {
                            :ip         => nil,
                            :ip6_global => nil,
                            :ip6_link   => nil,
                            :ip6_ula    => nil,
                            :mac        => nil,
                            :vm         => nil,
                            :vnet       => row[:oid],
                            :vrouter    => nil
                        }

                        #MAC
                        mac = (first_mac & 0xFFFF00000000) +
                              (((first_mac & 0xFFFFFFFF) + index) % 0x100000000)
                        lease[:mac] = mac_i_to_s(mac)

                        # IP
                        if (!first_ip.nil?)
                            lease[:ip] = IPAddr.new(first_ip.to_i + index,
                                                    Socket::AF_INET).to_s
                        end

                        # IP6
                        ip6_suffix = mac_to_ip6_suffix(mac)

                        if (!global_prefix.nil?)
                            lease[:ip6_global] = IPAddr.new(
                                (global_prefix << 64) | ip6_suffix,
                                Socket::AF_INET6 ).to_s
                        end

                        if (!ula_prefix.nil?)
                            lease[:ip6_ula] = IPAddr.new(
                                (ula_prefix << 64) | ip6_suffix,
                                Socket::AF_INET6 ).to_s
                        end

                        if (!link_prefix.nil?)
                            lease[:ip6_link] = IPAddr.new(
                                (link_prefix << 64) | ip6_suffix,
                                Socket::AF_INET6 ).to_s
                        end

                        counters[:vnet][parent_vnet][
                            :ar_leases][parent_ar][mac] = lease
                    end
                end
            end
        end
    end

    def check_network
        @fixes_network = {}

        @db[:network_pool].each do |row|
            doc = nokogiri_doc(row[:body])
            oid = row[:oid]

            used_leases = doc.root.at_xpath("USED_LEASES").text.to_i
            new_used_leases = 0

            counter_no_ar = counters[:vnet][row[:oid]][:no_ar_leases]

            error = false
            counters[:vnet][row[:oid]][:ar_leases].each do |ar_id, counter_ar|
                net_ar = doc.root.at_xpath("AR_POOL/AR[AR_ID=#{ar_id}]")

                if (net_ar.nil?)
                    # TODO shouldn't happen?
                end

                # MAC
                first_mac = mac_s_to_i(net_ar.at_xpath("MAC").text)

                # IP
                first_ip = nil
                if !net_ar.at_xpath("IP").nil?
                    first_ip_st = net_ar.at_xpath("IP").text

                    if (first_ip_st != first_ip_st.strip)
                        log_error("VNet #{oid} AR #{ar_id} "<<
                            "IP \"#{first_ip_st}\" contains whitespaces")
                        error = true

                        first_ip_st.strip!

                        net_ar.at_xpath("IP").content = first_ip_st
                    end

                    first_ip = IPAddr.new(first_ip_st, Socket::AF_INET)
                end

                # IP6
                global_prefix = nil
                if !net_ar.at_xpath("GLOBAL_PREFIX").nil?
                    global_prefix = ip6_prefix_s_to_i(
                                net_ar.at_xpath("GLOBAL_PREFIX").text)
                end

                ula_prefix = nil
                if !net_ar.at_xpath("ULA_PREFIX").nil?
                    ula_prefix = ip6_prefix_s_to_i(
                                net_ar.at_xpath("ULA_PREFIX").text)
                end

                link_prefix = nil
                type = net_ar.at_xpath("TYPE").text
                if ( type == "IP6" || type == "IP4_6" )
                    link_prefix = 0xfe80000000000000
                end

                # Allocated leases
                allocated_e = net_ar.at_xpath("ALLOCATED")

                allocated = allocated_e.nil? ? "" : allocated_e.text

                leases = allocated.scan(/(\d+) (\d+)/)

                size = net_ar.at_xpath("SIZE").text.to_i

                if leases.length > size
                    log_error("VNet #{oid} AR #{ar_id} allocated leases "\
                      "(#{leases.length}) is greater than the AR size (#{size}"\
                      "). SIZE can be increased with onevnet updatear"\
                      " #{oid} #{ar_id}")

                    error = true
                    net_ar.at_xpath("SIZE").content = leases.length.to_s
                end

                new_leases = []

                leases.each do |lease_str|
                    index = lease_str[0].to_i
                    binary_magic = lease_str[1].to_i

                    lease = {
                        :ip         => nil,
                        :ip6_global => nil,
                        :ip6_link   => nil,
                        :ip6_ula    => nil,
                        :mac        => nil,
                        :vm         => nil,
                        :vnet       => nil,
                        :vrouter    => nil
                    }

                    # MAC
                    mac = (first_mac & 0xFFFF00000000) +
                          (((first_mac & 0xFFFFFFFF) + index) % 0x100000000)

                    lease[:mac] = mac_i_to_s(mac)

                    # IP
                    if (!first_ip.nil?)
                        lease[:ip] = IPAddr.new(first_ip.to_i + index,
                                                Socket::AF_INET).to_s
                    end

                    # IP6
                    ip6_suffix = mac_to_ip6_suffix(mac)

                    if (!global_prefix.nil?)
                        lease[:ip6_global] = IPAddr.new(
                            (global_prefix << 64) | ip6_suffix,
                            Socket::AF_INET6 ).to_s
                    end

                    if (!ula_prefix.nil?)
                        lease[:ip6_ula] = IPAddr.new(
                            (ula_prefix << 64) | ip6_suffix,
                            Socket::AF_INET6 ).to_s
                    end

                    if (!link_prefix.nil?)
                        lease[:ip6_link] = IPAddr.new(
                            (link_prefix << 64) | ip6_suffix,
                            Socket::AF_INET6 ).to_s
                    end

                    # OID
                    lease_oid = binary_magic & 0x00000000FFFFFFFF
                    lease_obj = ""

                    if (binary_magic & VM_BIN != 0)
                        lease[:vm] = lease_oid
                        lease_obj = "VM"
                    elsif (binary_magic & NET_BIN != 0)
                        lease[:vnet] = lease_oid
                        lease_obj = "VNet"
                    else #(binary_magic & VROUTER_BIN != 0)
                        lease[:vrouter] = lease_oid
                        lease_obj = "VRouter"
                    end

                    counter_lease = counter_ar[mac]
                    counter_ar.delete(mac)

                    if counter_lease.nil?
                        counter_lease = counter_no_ar[mac]
                        counter_no_ar.delete(mac)
                    end

                    if counter_lease.nil?
                        if(lease[:vm] != HOLD)
                            log_error(
                            "VNet #{oid} AR #{ar_id} has leased #{lease_to_s(lease)} "<<
                            "to #{lease_obj} #{lease_oid}, but it is actually free")

                            error = true
                        else
                            new_leases << lease_str
                        end
                    else
                        if counter_lease != lease

                            # Things that can be fixed
                            if (counter_lease[:vm]      != lease[:vm] ||
                                counter_lease[:vnet]    != lease[:vnet] ||
                                counter_lease[:vrouter] != lease[:vrouter])

                                new_lease_obj = ""
                                new_lease_oid = 0
                                new_binary_magic = 0

                                if !counter_lease[:vm].nil?
                                    new_lease_obj = "VM"
                                    new_lease_oid = counter_lease[:vm].to_i

                                    new_binary_magic = (VM_BIN |
                                        (new_lease_oid & 0xFFFFFFFF))
                                elsif !counter_lease[:vnet].nil?
                                    new_lease_obj = "VNet"
                                    new_lease_oid = counter_lease[:vnet].to_i

                                    new_binary_magic = (NET_BIN |
                                        (new_lease_oid & 0xFFFFFFFF))
                                else #if !counter_lease[:vrouter].nil?
                                    new_lease_obj = "VRouter"
                                    new_lease_oid = counter_lease[:vrouter].to_i

                                    new_binary_magic = (VROUTER_BIN |
                                        (new_lease_oid & 0xFFFFFFFF))
                                end

                                if (lease[:vm] == HOLD)
                                    log_error(
                                        "VNet #{oid} AR #{ar_id} has lease "<<
                                        "#{lease_to_s(lease)} on hold, but it is "<<
                                        "actually used by "<<
                                        "#{new_lease_obj} #{new_lease_oid}")
                                    error = true
                                else
                                    log_error(
                                        "VNet #{oid} AR #{ar_id} has leased #{lease_to_s(lease)} "<<
                                        "to #{lease_obj} #{lease_oid}, but it is "<<
                                        "actually used by "<<
                                        "#{new_lease_obj} #{new_lease_oid}")
                                    error = true
                                end

                                lease_str[1] = new_binary_magic.to_s
                            end

                            # Things that can't be fixed

                            [:ip, :ip6_global, :ip6_link, :ip6_ula].each do |key|
                                if (counter_lease[key] != lease[key])
                                    log_error(
                                    "VNet #{oid} AR #{ar_id} has a wrong "<<
                                    "lease for "<<
                                    "#{lease_obj} #{lease_oid}. #{key.to_s.upcase} "<<
                                    "does not match: "<<
                                    "#{counter_lease[key]} != #{lease[key]}. "<<
                                    "This can't be fixed", false)
                                end
                            end
                        end

                        new_leases << lease_str
                    end
                end

                counter_ar.each do |mac, counter_lease|
                    index = ((mac & 0xFFFFFFFF) - (first_mac & 0xFFFFFFFF) ) % 0x100000000

                    new_lease_obj = ""
                    new_lease_oid = 0
                    new_binary_magic = 0

                    if !counter_lease[:vm].nil?
                        new_lease_obj = "VM"
                        new_lease_oid = counter_lease[:vm].to_i

                        new_binary_magic = (VM_BIN |
                            (new_lease_oid & 0xFFFFFFFF))
                    elsif !counter_lease[:vnet].nil?
                        new_lease_obj = "VNet"
                        new_lease_oid = counter_lease[:vnet].to_i

                        new_binary_magic = (NET_BIN |
                            (new_lease_oid & 0xFFFFFFFF))
                    else #if !counter_lease[:vrouter].nil?
                        new_lease_obj = "VRouter"
                        new_lease_oid = counter_lease[:vrouter].to_i

                        new_binary_magic = (VROUTER_BIN |
                            (new_lease_oid & 0xFFFFFFFF))
                    end

                    log_error("VNet #{oid} AR #{ar_id} does not have a lease "<<
                        "for #{mac_i_to_s(mac)}, but it is in use by "<<
                        "#{new_lease_obj} #{new_lease_oid}")

                    error = true

                    new_leases << [index.to_s, new_binary_magic.to_s]
                end

                new_used_leases += new_leases.size

                allocated_e.remove if allocated_e

                if new_leases.size > 0
                    add_cdata(net_ar, "ALLOCATED", " #{new_leases.join(" ")}")
                end
            end

            if (new_used_leases != used_leases)
                log_error("VNet #{oid} has #{used_leases} used leases, "<<
                "but it is actually #{new_used_leases}")

                error = true

                doc.root.at_xpath("USED_LEASES").content =
                                                new_used_leases.to_s
            end

            counter_no_ar.each do |mac, counter_lease|
                log_error("VM #{counter_lease[:vm]} has a lease from "<<
                    "VNet #{oid}, but it could not be matched to any AR", false)
            end

            vn_mad_e = doc.root.at_xpath("VN_MAD")
            if vn_mad_e.nil?
                log_error("VNet #{oid} VN_MAD element is missing", false)
            else
                vn_mad = vn_mad_e.text
                vn_mad_tmpl_e = doc.root.at_xpath("TEMPLATE/VN_MAD")

                if (vn_mad_tmpl_e.nil? || vn_mad_tmpl_e.text != vn_mad)
                    log_error("VNet #{oid} VN_MAD element is missing from the TEMPLATE")

                    error = true

                    doc.root.at_xpath("TEMPLATE").add_child(
                        doc.create_element("VN_MAD")).content = vn_mad
                end
            end

            @fixes_network[oid] = doc.root.to_s if error
        end
    end

    def fix_network
        @db.transaction do
            @fixes_network.each do |id, body|
                @db[:network_pool].where(oid: id).update(body: body)
            end
        end
    end
end

