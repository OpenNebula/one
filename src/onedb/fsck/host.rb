
module OneDBFsck
    # Initialize all the host counters to 0
    def init_host_counters
        @db.fetch("SELECT oid, name FROM host_pool") do |row|
            counters[:host][row[:oid]] = {
                :name   => row[:name],
                :memory => 0,
                :cpu    => 0,
                :rvms   => Set.new
            }
        end
    end

    def check_host_cluster
        cluster = @data_cluster
        hosts_fix = @fixes_host_cluster = {}

        @db.fetch("SELECT oid,body,cid FROM host_pool") do |row|
            doc = Document.new(row[:body])

            cluster_id = doc.root.get_text('CLUSTER_ID').to_s.to_i
            cluster_name = doc.root.get_text('CLUSTER')

            if cluster_id != row[:cid]
                log_error("Host #{row[:oid]} is in cluster #{cluster_id}, " <<
                          "but cid column has cluster #{row[:cid]}")
                hosts_fix[row[:oid]] = {:body => row[:body], :cid => cluster_id}
            end

            if cluster_id != -1
                cluster_entry = cluster[cluster_id]

                if cluster_entry.nil?
                    log_error("Host #{row[:oid]} is in cluster " <<
                              "#{cluster_id}, but it does not exist")

                    doc.root.each_element('CLUSTER_ID') do |e|
                        e.text = "-1"
                    end

                    doc.root.each_element('CLUSTER') do |e|
                        e.text = ""
                    end

                    hosts_fix[row[:oid]] = {:body => doc.root.to_s, :cid => -1}
                else
                    if cluster_name != cluster_entry[:name]
                        log_error("Host #{row[:oid]} has a wrong name for " <<
                              "cluster #{cluster_id}, #{cluster_name}. " <<
                              "It will be changed to #{cluster_entry[:name]}")

                        doc.root.each_element('CLUSTER') do |e|
                            e.text = cluster_entry[:name]
                        end

                        hosts_fix[row[:oid]] = {
                            body: doc.root.to_s,
                            cid: cluster_id
                        }
                    end

                    cluster_entry[:hosts] << row[:oid]
                end
            end
        end
    end

    def fix_host_cluster
        @db.transaction do
            @fixes_host_cluster.each do |id, entry|
                @db[:host_pool].where(oid: id).update(
                    body: entry[:body],
                    cid: entry[:cid]
                )
            end
        end
    end

    def check_host
        @fixes_host = {}

        # DATA: FIX: Calculate the host's xml and write them to host_pool_new
        @db[:host_pool].each do |row|
            host_doc = nokogiri_doc(row[:body])

            error = false

            hid = row[:oid]

            counters_host = counters[:host][hid]

            rvms        = counters_host[:rvms].size
            cpu_usage   = (counters_host[:cpu]*100).to_i
            mem_usage   = counters_host[:memory]*1024

            # rewrite running_vms
            host_doc.root.xpath("HOST_SHARE/RUNNING_VMS").each {|e|
                if e.text != rvms.to_s
                    log_error(
                        "Host #{hid} RUNNING_VMS has #{e.text} \tis\t#{rvms}")
                    e.content = rvms
                    error = true
                end
            }

            # re-do list of VM IDs
            vms_elem = host_doc.root.at_xpath("VMS").remove

            vms_new_elem = host_doc.create_element("VMS")
            host_doc.root.add_child(vms_new_elem)

            counters_host[:rvms].each do |id|
                id_elem = vms_elem.at_xpath("ID[.=#{id}]")

                if id_elem.nil?
                    log_error(
                        "VM #{id} is missing from Host #{hid} VM id list")
                    error = true
                else
                    id_elem.remove
                end

                vms_new_elem.add_child(host_doc.create_element("ID")).content = id.to_s
            end

            vms_elem.xpath("ID").each do |id_elem|
                log_error(
                    "VM #{id_elem.text} is in Host #{hid} VM id list, "<<
                    "but it should not")
                error = true
            end

            host_doc.root.xpath("HOST_SHARE/PCI_DEVICES/PCI").each do |pci|
                if !pci.at_xpath("VMID").nil?
                    vmid = pci.at_xpath("VMID").text.to_i

                    if vmid != -1 && !counters_host[:rvms].include?(vmid)
                        log_error("VM #{vmid} has a PCI device assigned in host #{hid}, but it should not. Device: #{pci.at_xpath('DEVICE_NAME').text}")
                        pci.at_xpath("VMID").content = "-1"
                        error = true
                    end
                end
            end

            # rewrite cpu
            host_doc.root.xpath("HOST_SHARE/CPU_USAGE").each {|e|
                if e.text != cpu_usage.to_s
                    log_error(
                        "Host #{hid} CPU_USAGE has #{e.text} "<<
                        "\tis\t#{cpu_usage}")
                    e.content = cpu_usage
                    error = true
                end
            }

            # rewrite memory
            host_doc.root.xpath("HOST_SHARE/MEM_USAGE").each {|e|
                if e.text != mem_usage.to_s
                    log_error("Host #{hid} MEM_USAGE has #{e.text} "<<
                        "\tis\t#{mem_usage}")
                    e.content = mem_usage
                    error = true
                end
            }

            @fixes_host[hid] = host_doc.root.to_s if error
        end
    end

    def fix_host
        @db.transaction do
            @fixes_host.each do |id, body|
                @db[:host_pool].where(oid: id).update(body: body)
            end
        end
    end
end

