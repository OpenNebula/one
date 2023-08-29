# Host module
module OneDBFsck

    # Initialize all the host counters to 0
    def init_host_counters
        @db.fetch('SELECT oid, name FROM host_pool') do |row|
            counters[:host][row[:oid]] = {
                :name   => row[:name],
                :memory => 0,
                :cpu    => 0,
                :rvms   => Set.new
            }
        end
    end

    # Check hosts clusters
    def check_host_cluster
        cluster   = @data_cluster
        hosts_fix = @fixes_host_cluster = {}

        @db.fetch('SELECT oid,body,cid FROM host_pool') do |row|
            doc   = nokogiri_doc(row[:body], 'host_pool')

            cid   = doc.root.xpath('CLUSTER_ID').text.to_i
            cname = doc.root.xpath('CLUSTER').text

            if cid != row[:cid]
                log_error("Host #{row[:oid]} is in cluster #{cid}, but cid " \
                          "column has cluster #{row[:cid]}")

                hosts_fix[row[:oid]] = { :body => row[:body], :cid => cid }
            end

            next if cid == -1

            cluster_entry = cluster[cid]

            if cluster_entry.nil?
                log_error("Host #{row[:oid]} is in cluster #{cid}, " \
                          'but it does not exist')

                doc.root.xpath('CLUSTER_ID').each do |e|
                    e.content = '-1'
                end

                doc.root.xpath('CLUSTER').each do |e|
                    e.content = ''
                end

                hosts_fix[row[:oid]] = { :body => doc.root.to_s, :cid => -1 }
            else
                if cname != cluster_entry[:name]
                    new_cluster = cluster_entry[:name]

                    log_error("Host #{row[:oid]} has a wrong name for " \
                              "cluster #{cid}, #{cname}. " \
                              "It will be changed to #{new_cluster}")

                    doc.root.xpath('CLUSTER').each do |e|
                        e.content = new_cluster
                    end

                    hosts_fix[row[:oid]] = { :body => doc.root.to_s,
                                             :cid => cid }
                end

                cluster_entry[:hosts] << row[:oid]
            end
        end
    end

    # Fix hosts clusters
    def fix_host_cluster
        @db.transaction do
            @fixes_host_cluster.each do |id, entry|
                obj = { :body => entry[:body], :cid => entry[:cid] }

                @db[:host_pool].where(:oid => id).update(obj)
            end
        end
    end

    # Check hosts information
    def check_host
        @fixes_host = {}

        # DATA: FIX: Calculate the host's xml and write them to host_pool_new
        @db[:host_pool].each do |row|
            host_doc      = nokogiri_doc(row[:body], 'host_pool')
            hid           = row[:oid]
            counters_host = counters[:host][hid]

            rvms      = counters_host[:rvms].size
            cpu_usage = (counters_host[:cpu] * 100).to_i
            mem_usage = counters_host[:memory] * 1024

            error = false

            host_doc, error = check_running_vms(host_doc, hid, rvms, error)

            host_doc, error = check_vms_ids(host_doc,
                                            hid,
                                            counters_host[:rvms],
                                            error)

            host_doc, error = check_pcis(host_doc,
                                         hid,
                                         counters_host[:rvms],
                                         error)

            host_doc, error = check_usage(host_doc,
                                          hid,
                                          'CPU',
                                          cpu_usage,
                                          error)

            host_doc, error = check_usage(host_doc,
                                          hid,
                                          'MEM',
                                          mem_usage,
                                          error)

            @fixes_host[hid] = host_doc.root.to_s if error
        end
    end

    # Check running vms on host
    #
    # @param doc   [Document] Hosts information
    # @param hid   [String]   Host ID
    # @param rvms  [Integer]  Running VMs on host
    # @param error [Boolean]  True if there has been an error, false otherwise
    #
    # @return [Document,Boolean] Updated hosts information and error if any
    def check_running_vms(doc, hid, rvms, error)
        doc.root.xpath('HOST_SHARE/RUNNING_VMS').each do |e|
            next unless e.text != rvms.to_s

            log_error("Host #{hid} RUNNING_VMS has #{e.text} \tis\t#{rvms}")

            e.content = rvms
            error     = true
        end

        [doc, error]
    end

    # Check vms ids on host
    #
    # @param doc   [Document] Hosts information
    # @param hid   [String]   Host ID
    # @param rvms  [Integer]  Running VMs on host
    # @param error [Boolean]  True if there has been an error, false otherwise
    #
    # @return [Document,Boolean] Updated hosts information and error if any
    def check_vms_ids(doc, hid, rvms, error)
        vms_elem     = doc.root.at_xpath('VMS').remove
        vms_new_elem = doc.create_element('VMS')

        doc.root.add_child(vms_new_elem)

        rvms.each do |id|
            id_elem = vms_elem.at_xpath("ID[.=#{id}]")

            if id_elem.nil?
                log_error("VM #{id} is missing from Host #{hid} VM id list")

                error = true
            else
                id_elem.remove
            end

            h_e = doc.create_element('ID')
            vms_new_elem.add_child(h_e).content = id.to_s
        end

        vms_elem.xpath('ID').each do |id_elem|
            log_error("VM #{id_elem.text} is in Host #{hid} VM id list, " \
                      'but it should not')

            error = true
        end

        [doc, error]
    end

    # Check host pcis
    #
    # @param doc   [Document] Hosts information
    # @param hid   [String]   Host ID
    # @param rvms  [Integer]  Running VMs on host
    # @param error [Boolean]  True if there has been an error, false otherwise
    #
    # @return [Document,Boolean] Updated hosts information and error if any
    def check_pcis(doc, hid, rvms, error)
        doc.root.xpath('HOST_SHARE/PCI_DEVICES/PCI').each do |pci|
            next if pci.at_xpath('VMID').nil?

            vmid = pci.at_xpath('VMID').text.to_i

            next unless vmid != -1 && !rvms.include?(vmid)

            pci_name                     = pci.at_xpath('DEVICE_NAME').text
            pci.at_xpath('VMID').content = '-1'
            error                        = true

            log_error("VM #{vmid} has a PCI device assigned in host " \
                      "#{hid}, but it should not. Device: #{pci_name}")
        end

        [doc, error]
    end

    # Check host usages
    #
    # @param doc   [Document] Hosts information
    # @param hid   [String]   Host ID
    # @param type  [String]   CPU for cpu_usage, MEM for memory_usage
    # @param usage [Integer]  Host usage
    # @param error [Boolean]  True if there has been an error, false otherwise
    #
    # @return [Document,Boolean] Updated hosts information and error if any
    def check_usage(doc, hid, type, usage, error)
        doc.root.xpath("HOST_SHARE/#{type}_USAGE").each do |e|
            next unless e.text != usage.to_s

            log_error("Host #{hid} #{type}_USAGE has #{e.text} \tis\t#{usage}")

            e.content = usage
            error     = true
        end

        [doc, error]
    end

    # Fix hosts information
    def fix_host
        @db.transaction do
            @fixes_host.each do |id, body|
                @db[:host_pool].where(:oid => id).update(:body => body)
            end
        end
    end

end
