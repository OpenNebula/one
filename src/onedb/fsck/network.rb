# Network module
module OneDBFsck

    # Check that network cluster really exists
    def check_network_cluster
        cluster = @data_cluster

        @fixes_host_cluster = {}

        @db.fetch('SELECT oid,body FROM network_pool') do |row|
            doc = nokogiri_doc(row[:body], 'network_pool')

            doc.root.xpath('CLUSTERS/ID').each do |e|
                cluster_id    = e.text.to_i
                cluster_entry = cluster[cluster_id]

                if cluster_entry.nil?
                    e.remove

                    log_error("VNet #{row[:oid]} is in cluster " \
                              "#{cluster_id}, but it does not exist")

                    @fixes_host_cluster[row[:oid]] = { :body => doc.root.to_s }
                else
                    cluster_entry[:vnets] << row[:oid]
                end
            end
        end
    end

    # Check network information
    def check_network
        @fixes_network = {}

        @db[:network_pool].each do |row|
            doc = nokogiri_doc(row[:body], 'network_pool')
            oid = row[:oid]

            check_ugid(doc)

            used_leases   = doc.root.at_xpath('USED_LEASES').text.to_i
            counter_no_ar = counters[:vnet][row[:oid]][:no_ar_leases]
            ar_leases     = counters[:vnet][row[:oid]][:ar_leases]

            error, new_used_leases = check_ar_leases(oid,
                                                     doc,
                                                     ar_leases,
                                                     counter_no_ar)

            if new_used_leases != used_leases
                log_error("VNet #{oid} has #{used_leases} used leases, " \
                          "but it is actually #{new_used_leases}")

                error = true

                doc.root.at_xpath('USED_LEASES').content = new_used_leases.to_s
            end

            counter_no_ar.each do |_, counter_lease|
                log_error("VM #{counter_lease[:vm]} has a lease from " \
                          "VNet #{oid}, but it could not be matched " \
                          'to any AR', false)
            end

            error = check_vn_mad(doc, oid, error)

            error ||= fix_permissions('VNET', row[:oid], doc)

            @fixes_network[oid] = doc.root.to_s if error
        end
    end

    # Fix network cluster
    def fix_network_cluster
        @db.transaction do
            @fixes_host_cluster.each do |id, entry|
                body = entry[:body]

                @db.fetch('SELECT cid FROM cluster_network_relation where ' \
                          "oid=#{id}") do |row|
                    doc      = nokogiri_doc(body, 'cluster_network_relation')
                    clusters = doc.root.at_xpath('CLUSTERS').children

                    if clusters.find {|n| n.text == row[:cid].to_s }.nil?
                        cluster_e = doc.create_element('ID')

                        doc.root.at_xpath('CLUSTERS')
                           .add_child(cluster_e).content = row[:cid]
                    end

                    @data_cluster[row[:cid]][:vnets] << id

                    body = doc.root.to_s

                    @db[:network_pool].where(:oid => id).update(:body => body)
                end
            end
        end
    end

    # Fix network errors
    def fix_network
        @db.transaction do
            @fixes_network.each do |id, body|
                @db[:network_pool].where(:oid => id).update(:body => body)
            end
        end
    end

    # Init vnet counters
    def init_network_counters
        @db.fetch('SELECT oid,body FROM network_pool') do |row|
            doc = nokogiri_doc(row[:body], 'network_pool')

            ar_leases = {}

            doc.root.xpath('AR_POOL/AR/AR_ID').each do |ar_id|
                ar_leases[ar_id.text.to_i] = {}
            end

            counters[:vnet][row[:oid]] = {
                :ar_leases      => ar_leases,
                :no_ar_leases   => {}
            }
        end
    end

    # Init network leases counters
    def init_network_lease_counters
        query = 'SELECT oid,body,pid FROM network_pool WHERE pid<>-1'

        @db.fetch(query) do |row|
            doc = nokogiri_doc(row[:body], 'network_pool')

            parent_vnet = doc.root.at_xpath('PARENT_NETWORK_ID').text.to_i

            if row[:pid] != parent_vnet
                # TODO
            end

            doc.root.xpath('AR_POOL/AR').each do |ar|
                parent_ar_e = ar.at_xpath('PARENT_NETWORK_AR_ID')

                next if parent_ar_e.nil? || parent_ar_e.text.empty?

                parent_ar = parent_ar_e.text.to_i

                if counters[:vnet][parent_vnet][:ar_leases][parent_ar].nil?
                    log_error("VNet #{row[:oid]} is using parent " \
                              "VNet #{parent_vnet}, AR #{parent_ar}, " \
                              'but the AR does not exist', false)
                end

                # MAC
                first_mac = mac_s_to_i(ar.at_xpath('MAC').text)

                # IP
                unless ar.at_xpath('IP').nil?
                    first_ip = IPAddr.new(ar.at_xpath('IP').text.strip,
                                          Socket::AF_INET)
                end

                # IP6
                ipv6 = get_ipv6(ar)

                addrs = { :mac => first_mac, :ip => first_ip, :ipv6 => ipv6 }

                # Parent vnet has a lease for each address of this reservation
                calculate_leases(ar, row[:oid], addrs, parent_vnet, parent_ar)
            end
        end
    end

    # Get lease information
    #
    # @param oid   [Integer] VNet ID
    # @param mac   [String]  VNet mac address
    # @param ip    [String]  VNet IPv4 address
    # @param ipv6  [Object]  VNet IPv6 object with all information about v6
    # @param index [Integer] Index of the lease to calculate the mac and IP
    #
    # @return      [Object]  Object with lease information
    def get_lease(oid, mac, ip, ipv6, index)
        lease = {
            :ip         => nil,
            :ip6_global => nil,
            :ip6_link   => nil,
            :ip6_ula    => nil,
            :mac        => nil,
            :mac_index  => nil,
            :vm         => nil,
            :vnet       => oid,
            :vrouter    => nil
        }

        # MAC
        mac = (mac & 0xFFFF00000000) +
              (((mac & 0xFFFFFFFF) + index) %
              0x100000000)

        lease[:mac]       = mac_i_to_s(mac)
        lease[:mac_index] = mac

        # IP
        begin
            unless ip.nil?
                lease[:ip] = IPAddr.new(ip.to_i + index, Socket::AF_INET).to_s
            end
        rescue StandardError
            lease[:ip] = [ip.to_i + index].pack('N').unpack('CCCC').join('.')
        end

        # IP6
        ip6_suffix = mac_to_ip6_suffix(mac)

        g_pref = ipv6[:global_prefix]
        u_pref = ipv6[:ula_prefix]
        l_pref = ipv6[:link_prefix]

        unless g_pref.nil?
            pref = (g_pref << 64) | ip6_suffix
            lease[:ip6_global] = IPAddr.new(pref, Socket::AF_INET6).to_s
        end

        unless u_pref.nil?
            pref = (u_pref << 64) | ip6_suffix
            lease[:ip6_ula] = IPAddr.new(pref, Socket::AF_INET6).to_s
        end

        unless l_pref.nil?
            pref = (l_pref << 64) | ip6_suffix
            lease[:ip6_link] = IPAddr.new(pref, Socket::AF_INET6).to_s
        end

        lease
    end

    # Calculate ar leases
    #
    # @param ar     [XML]      Address range information
    # @param oid    [Interger] VNet ID
    # @param addrs  [Object]   Object with mac, IP and IPv6 addresses
    # @param p_vnet [String]   Parent VNet
    # @param p_ar   [String]   Parent address range
    def calculate_leases(address_range, oid, addrs, p_vnet, p_ar)
        address_range.at_xpath('SIZE').text.to_i.times do |index|
            lease = get_lease(oid, addrs[:mac], addrs[:ip], addrs[:ipv6], index)

            counters[:vnet][p_vnet][:ar_leases][p_ar][lease[:mac_index]] = lease
        end
    end

    # Get IPv6 information
    #
    # @param address_range [XML element] Address range information
    #
    # @return              [Object]      Object with IPv6 information
    def get_ipv6(address_range)
        ipv6 = { :global_prefix => nil,
                 :ula_prefix    => nil,
                 :link_prefix   => nil }

        unless address_range.at_xpath('GLOBAL_PREFIX').nil?
            g_prefix             = address_range.at_xpath('GLOBAL_PREFIX').text
            ipv6[:global_prefix] = ip6_prefix_s_to_i(g_prefix)
        end

        unless address_range.at_xpath('ULA_PREFIX').nil?
            u_prefix          = address_range.at_xpath('ULA_PREFIX').text
            ipv6[:ula_prefix] = ip6_prefix_s_to_i(u_prefix)
        end

        type = address_range.at_xpath('TYPE').text

        if ['IP6', 'IP4_6'].include? type
            ipv6[:link_prefix] = 0xfe80000000000000
        end

        ipv6
    end

    # Check that the IP address is valid
    #
    # @param oid    [Integer]     VNet ID
    # @param ar_id  [Integer]     Address range ID
    # @param ip     [String]      IP address
    # @param net_ar [XML element] Address range information
    # @param error  [Boolean]     True if there was an error, false if not
    #
    # @return       [Boolean/IP]  The current value of error and the fixed IP
    def check_ip(oid, ar_id, ip, net_ar, error)
        if ip != ip.delete(' ')
            log_error("VNet #{oid} AR #{ar_id} " \
                      "IP \"#{ip}\" contains whitespaces")

            error = true

            ip = ip.delete(' ')

            net_ar.at_xpath('IP').content = ip
        end

        [error, IPAddr.new(ip, Socket::AF_INET)]
    end

    # Check VNet VN_MAD
    #
    # @param doc   [XML element] XML document with all the information
    # @param oid   [Integer]     VNet ID
    # @param error [Boolean]     True if there was an error, false if not
    #
    # @return      [Booleam]     The current value of error
    def check_vn_mad(doc, oid, error)
        vn_mad_e = doc.root.at_xpath('VN_MAD')

        if vn_mad_e.nil?
            log_error("VNet #{oid} VN_MAD element is missing", false)
        else
            vn_mad        = vn_mad_e.text
            vn_mad_tmpl_e = doc.root.at_xpath('TEMPLATE/VN_MAD')

            if vn_mad_tmpl_e.nil? || vn_mad_tmpl_e.text != vn_mad
                log_error("VNet #{oid} VN_MAD element is missing " \
                          'from the TEMPLATE')

                error = true

                doc.root.at_xpath('TEMPLATE')
                   .add_child(doc.create_element('VN_MAD')).content = vn_mad
            end
        end

        error
    end

    # Check ar leases
    #
    # @param oid           [Integer]     VNet ID
    # @param doc           [XML element] XML document with all the information
    # @param ar_leasses    [Array]       Address range leases to check
    # @param counter_no_ar [Array]       Counters for no address range info
    #
    # @return              [Boolean/Interger] error if any, number leases used
    def check_ar_leases(oid, doc, ar_leases, counter_no_ar)
        new_used_leases = 0
        error           = false

        ar_leases.each do |ar_id, counter_ar|
            net_ar = doc.root.at_xpath("AR_POOL/AR[AR_ID=#{ar_id}]")

            if net_ar.nil?
                # TODO: shouldn't happen?
            end

            # MAC
            first_mac = mac_s_to_i(net_ar.at_xpath('MAC').text)

            # IP
            unless net_ar.at_xpath('IP').nil?
                ip              = net_ar.at_xpath('IP').text
                error, first_ip = check_ip(oid, ar_id, ip, net_ar, error)
            end

            # IP6
            ipv6 = get_ipv6(net_ar)

            # Allocated leases
            allocated_e = net_ar.at_xpath('ALLOCATED')

            allocated_e.nil? ? allocated = '' : allocated = allocated_e.text

            leases = allocated.scan(/(\d+) (\d+)/)

            size = net_ar.at_xpath('SIZE').text.to_i

            if leases.length > size
                log_error("VNet #{oid} AR #{ar_id} allocated leases " \
                          "(#{leases.length}) is greater than the " \
                          "AR size (#{size}). SIZE can be increased " \
                          "with onevnet updatear #{oid} #{ar_id}")

                error = true

                net_ar.at_xpath('SIZE').content = leases.length.to_s
            end

            ids      = { :o => oid, :ar => ar_id }
            addrs    = { :mac => first_mac, :ip => first_ip, :ipv6 => ipv6 }
            counters = { :ar => counter_ar, :no_ar => counter_no_ar }

            error, new_leases = calculate_new_leases(leases,
                                                     ids,
                                                     addrs,
                                                     counters,
                                                     error)

            counter_ar.each do |mac, counter_lease|
                next if mac.nil?

                index = ((mac & 0xFFFFFFFF) -
                        (first_mac & 0xFFFFFFFF)) %
                        0x100000000

                parameters = fix_parameters(counter_lease)

                log_error("VNet #{oid} AR #{ar_id} does not have a lease " \
                          "for #{mac_i_to_s(mac)}, but it is in use by " \
                          "#{parameters[:new_lease_obj]} " \
                          "#{parameters[:new_lease_oid]}")

                error = true

                new_leases << [index.to_s, parameters[:new_binary_magic].to_s]
            end

            new_used_leases += new_leases.size

            allocated_e.remove if allocated_e

            unless new_leases.empty?
                add_cdata(net_ar, 'ALLOCATED', " #{new_leases.join(' ')}")
            end
        end

        [error, new_used_leases]
    end

    # Fix paramters of the lease
    #
    # @param counter_lease [Object] Counters of the lease
    #
    # @return              [Object] Object with new lease parameters
    def fix_parameters(counter_lease)
        params = { :new_lease_obj    => '',
                   :new_lease_oid    => 0,
                   :new_binary_magic => 0 }

        if !counter_lease[:vm].nil?
            new_lease_obj    = 'VM'
            new_lease_oid    = counter_lease[:vm].to_i
            new_binary_magic = (VM_BIN | (new_lease_oid & 0xFFFFFFFF))
        elsif !counter_lease[:vnet].nil?
            new_lease_obj    = 'VNet'
            new_lease_oid    = counter_lease[:vnet].to_i
            new_binary_magic = (NET_BIN | (new_lease_oid & 0xFFFFFFFF))
        else
            new_lease_obj    = 'VRouter'
            new_lease_oid    = counter_lease[:vrouter].to_i
            new_binary_magic = (VROUTER_BIN | (new_lease_oid & 0xFFFFFFFF))
        end

        params[:new_lease_obj]    = new_lease_obj
        params[:new_lease_oid]    = new_lease_oid
        params[:new_binary_magic] = new_binary_magic

        params
    end

    # Calculate new leases information
    #
    # @param leases   [Array]   Array with address range leases
    # @param ids      [Object]  Object with VNet ID and AR ID
    # @param addrs    [Object]  Object with mac, IP and IPv6 addresses
    # @param counters [Object]  Object with ar and no_ar counters
    # @param error    [Boolean] True if there was an error, false if not
    #
    # @return         [Boolean/Leases] The current value of error and new leases
    def calculate_new_leases(leases, ids, addrs, counters, error)
        new_leases = []

        leases.each do |lease_str|
            index        = lease_str[0].to_i
            binary_magic = lease_str[1].to_i

            lease = get_lease(nil, addrs[:mac], addrs[:ip], addrs[:ipv6], index)

            # OID
            lease_oid = binary_magic & 0x00000000FFFFFFFF
            lease_obj = ''

            if binary_magic & VM_BIN != 0
                lease[:vm] = lease_oid
                lease_obj  = 'VM'
            elsif binary_magic & NET_BIN != 0
                lease[:vnet] = lease_oid
                lease_obj    = 'VNet'
            else
                lease[:vrouter] = lease_oid
                lease_obj       = 'VRouter'
            end

            counter_lease = counters[:ar][lease[:mac_index]]
            counters[:ar].delete(lease[:mac_index])

            if counter_lease.nil?
                counter_lease = counters[:no_ar][lease[:mac_index]]
                counters[:no_ar].delete(lease[:mac_index])
            end

            if counter_lease.nil?
                if lease[:vm] != HOLD
                    log_error("VNet #{ids[:o]} AR #{ids[:ar]} has " \
                              "leased #{lease_to_s(lease)} to #{lease_obj} " \
                              "#{lease_oid}, but it is actually free")

                    error = true
                else
                    new_leases << lease_str
                end
            else
                new_leases << lease_str

                next if counter_lease == lease

                # Things that can be fixed
                if counter_lease[:vm]      != lease[:vm] ||
                   counter_lease[:vnet]    != lease[:vnet] ||
                   counter_lease[:vrouter] != lease[:vrouter]

                    parameters = fix_parameters(counter_lease)

                    if lease[:vm] == HOLD
                        log_error("VNet #{ids[:o]} AR #{ids[:ar]} has lease " \
                                  "#{lease_to_s(lease)} on hold, but it is " \
                                  'actually used by ' \
                                  "#{parameters[:new_lease_obj]} " \
                                  "#{parameters[:new_lease_oid]}")
                    else
                        log_error("VNet #{ids[:o]} AR #{ids[:ar]} has leased " \
                                  "#{lease_to_s(lease)} to #{lease_obj} " \
                                  "#{lease_oid}, but it is actually used by " \
                                  "#{parameters[:new_lease_obj]} " \
                                  "#{parameters[:new_lease_oid]}")
                    end

                    error        = true
                    lease_str[1] = parameters[:new_binary_magic].to_s
                end

                # Things that can't be fixed
                [:ip, :ip6_global, :ip6_link, :ip6_ula].each do |key|
                    next if counter_lease[key] == lease[key]

                    log_error("VNet #{ids[:o]} AR #{ids[:ar]} has a wrong " \
                              "lease for #{lease_obj} #{lease_oid}. " \
                              "#{key.to_s.upcase} does not match: " \
                              "#{counter_lease[key]} != #{lease[key]}. " \
                              'This can\'t be fixed', false)
                end
            end
        end

        [error, new_leases]
    end

end
