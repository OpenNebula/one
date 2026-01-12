# Quotas module
# rubocop:disable Style/FormatStringToken
module OneDBFsck

    # Check quotas
    #
    # @param resource [String] user/group
    def check_quotas(resource)
        fix_quotas = @fix_quotas[resource] = {}

        table = "#{resource}_quotas"

        query = "SELECT * FROM #{table} WHERE #{resource}_oid>0"

        @db.fetch(query) do |row|
            @error = false
            doc = nokogiri_doc(row[:body], table)

            # resource[0] = u if user, g if group
            id_field = "#{resource[0]}id"
            oid      = row["#{resource}_oid".to_sym]
            params   = [doc, "#{id_field}=#{oid}", resource.capitalize]

            calculate_running_quotas(*params)
            calculate_quotas(*params)

            fix_quotas[oid] = doc.root.to_s if @error
        end
    end

    def fix_quotas(resource)
        @db.transaction do
            @fix_quotas[resource].each do |id, body|
                @db["#{resource}_quotas".to_sym].where("#{resource}_oid".to_sym => id).update(
                    :body => body
                )
            end
        end
    end

    # Calculate normal quotas
    #
    # @param doc      [Nokogiri::XML] xml document with all user/group quota information
    # @param filter   [String]        filter for where clause
    # @param resource [String]        OpenNebula object
    def calculate_quotas(doc, filter, resource)
        # VM quotas
        query = "SELECT body FROM vm_pool WHERE #{filter} AND state<>6"

        resources = { :CPU => 'CPU', :MEMORY => 'MEMORY', :VMS => 'VMS',
                      :PCI_DEV => 'PCI_DEV', :PCI_NIC => 'PCI_NIC' }

        @generic_quotas.each {|q| resources[q] = q }

        vm_elems = calculate_vm_quotas(doc, query, resource, resources)

        # System quotas
        query = "SELECT body FROM vm_pool WHERE #{filter} AND state<>6"

        datastore_usage = calculate_system_quotas(doc, query, resource, vm_elems)

        # VNet quotas
        queries = []

        queries << "SELECT body FROM vm_pool WHERE #{filter} AND state<>6"
        queries << "SELECT body FROM vrouter_pool WHERE #{filter}"
        queries << "SELECT body FROM network_pool WHERE #{filter}"

        calculate_vnet_quotas(doc, queries, resource)

        # Image quotas
        query = "SELECT body FROM vm_pool WHERE #{filter} AND state<>6"

        calculate_image_quotas(doc, query, resource)

        # Datastore quotas
        query = "SELECT body FROM image_pool WHERE #{filter}"

        calculate_ds_quotas(doc, 'image_pool', query, resource, datastore_usage)
    end

    # Calculate running quotas
    #
    # @param doc      [Nokogiri::XML] xml document with all information
    # @param filter   [String]        filter for where clause
    # @param resource [String]        OpenNebula object
    def calculate_running_quotas(doc, filter, resource)
        running_states = '(state = 1 OR state = 2 OR state = 3 or state = 10)'

        query = "SELECT body FROM vm_pool WHERE #{filter} AND #{running_states}"

        resources = { :CPU => 'RUNNING_CPU',
                      :MEMORY => 'RUNNING_MEMORY',
                      :VMS => 'RUNNING_VMS',
                      :PCI_DEV => 'RUNNING_PCI_DEV',
                      :PCI_NIC => 'RUNNING_PCI_NIC' }

        @generic_quotas.each {|q| resources[q] = "RUNNING_#{q}" }

        calculate_vm_quotas(doc, query, resource, resources)
    end

    # Calculate datastore quotas
    #
    # @param doc      [Nokogiri::XML] xml document with all information
    # @param table    [String]        database table
    # @param query    [String]        database query
    # @param resource [String]        OpenNebula object
    # @param datastore_usage [Object] object with datastore usage information
    def calculate_ds_quotas(doc, table, query, resource, datastore_usage)
        oid = doc.root.at_xpath('ID').text.to_i

        ds_usage = {}

        @db.fetch(query) do |img_row|
            img_doc = nokogiri_doc(img_row[:body], table)

            img_doc.root.xpath('DATASTORE_ID').each do |e|
                ds_usage[e.text] = [0, 0] if ds_usage[e.text].nil?
                ds_usage[e.text][0] += 1

                img_doc.root.xpath('SIZE').each do |size|
                    ds_usage[e.text][1] += size.text.to_i
                end

                img_doc.root.xpath('SNAPSHOTS/SNAPSHOT/SIZE').each do |size|
                    ds_usage[e.text][1] += size.text.to_i
                end
            end
        end

        ds_quota = nil
        doc.root.xpath('DATASTORE_QUOTA').each {|e| ds_quota = e }

        if ds_quota.nil?
            ds_quota = doc.root.add_child(doc.create_element('DATASTORE_QUOTA'))
        end

        ds_quota.xpath('DATASTORE').each do |ds_elem|
            ds_id = ds_elem.at_xpath('ID').text

            images_used, size_used = ds_usage.delete(ds_id)

            images_used = 0 if images_used.nil?
            size_used   = 0 if size_used.nil?

            cloned_usage = datastore_usage[ds_id] || 0
            size_used += cloned_usage

            ds_elem.xpath('IMAGES_USED').each do |e|
                next if e.text == images_used.to_s

                @error = true

                log_error("#{resource} #{oid} quotas: Datastore " \
                          "#{ds_id}\tIMAGES_USED has #{e.text} " \
                          "\tis\t#{images_used}")
                e.content = images_used.to_s
            end

            ds_elem.xpath('SIZE_USED').each do |e|
                next if e.text == size_used.to_s

                @error = true

                log_error("#{resource} #{oid} quotas: Datastore " \
                          "#{ds_id}\tSIZE_USED has #{e.text} " \
                          "\tis\t#{size_used}")
                e.content = size_used.to_s
            end
        end

        ds_usage.each do |ds_id, array|
            @error = true

            images_used, size_used = array

            log_error("#{resource} #{oid} quotas: Datastore " \
                      "#{ds_id}\tIMAGES_USED has 0 \tis\t#{images_used}")
            log_error("#{resource} #{oid} quotas: Datastore " \
                      "#{ds_id}\tSIZE_USED has 0 \tis\t#{size_used}")

            new_elem = ds_quota.add_child(doc.create_element('DATASTORE'))

            new_elem.add_child(doc.create_element('ID')).content = ds_id

            images_el = doc.create_element('IMAGES_USED')
            new_elem.add_child(doc.create_element('IMAGES')).content = '-1'
            new_elem.add_child(images_el).content = images_used.to_s

            size_el = doc.create_element('SIZE_USED')
            new_elem.add_child(doc.create_element('SIZE')).content = '-1'
            new_elem.add_child(size_el).content = size_used.to_s
        end
    end

    # Calculate image quotas
    #
    # @param doc      [Nokogiri::XML] xml document with all information
    # @param query    [String]        database query
    # @param resource [String]        OpenNebula object
    def calculate_image_quotas(doc, query, resource)
        oid = doc.root.at_xpath('ID').text.to_i

        img_usage = {}

        @db.fetch(query) do |vm_row|
            vmdoc = nokogiri_doc(vm_row[:body], 'vm_pool')

            vmdoc.root.xpath('TEMPLATE/DISK/IMAGE_ID').each do |e|
                img_usage[e.text] = 0 if img_usage[e.text].nil?
                img_usage[e.text] += 1
            end
        end

        img_quota = nil
        doc.root.xpath('IMAGE_QUOTA').each {|e| img_quota = e }

        if img_quota.nil?
            img_quota = doc.root.add_child(doc.create_element('IMAGE_QUOTA'))
        end

        img_quota.xpath('IMAGE').each do |img_elem|
            img_id = img_elem.at_xpath('ID').text

            rvms = img_usage.delete(img_id)

            rvms = 0 if rvms.nil?

            img_elem.xpath('RVMS_USED').each do |e|
                next if e.text == rvms.to_s

                @error = true

                log_error("#{resource} #{oid} quotas: Image " \
                          "#{img_id}\tRVMS has #{e.text} \tis\t#{rvms}")
                e.content = rvms.to_s
            end
        end

        img_usage.each do |img_id, rvms|
            @error = true

            log_error("#{resource} #{oid} quotas: Image " \
                      "#{img_id}\tRVMS has 0 \tis\t#{rvms}")

            new_elem = img_quota.add_child(doc.create_element('IMAGE'))

            rvms_el = doc.create_element('RVMS_USED')
            new_elem.add_child(doc.create_element('ID')).content = img_id
            new_elem.add_child(doc.create_element('RVMS')).content = '-1'
            new_elem.add_child(rvms_el).content = rvms.to_s
        end
    end

    # Calculate system quotas
    #
    # @param doc      [Nokogiri::XML] xml document with all information
    # @param query    [String]        database query
    # @param resource [String]        OpenNebula object
    # @param vm_elems [Object]        VM quota information in the form {cluster_ids: VM_QUOTA}
    #
    # @return         [Object]        datastore usage
    def calculate_system_quotas(doc, query, resource, vm_elems)
        oid             = doc.root.at_xpath('ID').text.to_i
        sys_used        = {}
        datastore_usage = {}

        vm_elems.keys.each {|cid| sys_used[cid] = 0 }

        @db.fetch(query) do |vm_row|
            vmdoc = nokogiri_doc(vm_row[:body], 'vm_pool')

            cid = vmdoc.root.at_xpath('//HISTORY/CID')

            cid = vm_elems.keys.find {|key| key.to_s.split(',').include?(cid.text) } unless cid.nil?

            vmdoc.root.xpath('TEMPLATE/DISK').each do |e|
                type = ''

                e.xpath('TYPE').each {|t_elem| type = t_elem.text.upcase }

                size = 0

                if !e.at_xpath('SIZE').nil?
                    size = e.at_xpath('SIZE').text.to_i
                end

                if ['SWAP', 'FS'].include? type
                    sys_used[nil] += size
                    sys_used[cid] += size unless cid.nil?

                    next
                end

                next if e.at_xpath('CLONE').nil?

                clone = e.at_xpath('CLONE').text.casecmp('YES').zero?

                target = nil

                if clone && !e.at_xpath('CLONE_TARGET').nil?
                    target = e.at_xpath('CLONE_TARGET').text
                elsif !clone && !e.at_xpath('LN_TARGET').nil?
                    target = e.at_xpath('LN_TARGET').text
                end

                s_path = 'DISK_SNAPSHOT_TOTAL_SIZE'

                if !target.nil? && target == 'SYSTEM'
                    sys_used[nil] += size
                    sys_used[cid] += size unless cid.nil?

                    if !e.at_xpath(s_path).nil?
                        sys_used[nil] += e.at_xpath(s_path).text.to_i
                        sys_used[cid] += e.at_xpath(s_path).text.to_i unless cid.nil?
                    end
                elsif !target.nil? && target == 'SELF'
                    datastore_id = e.at_xpath('DATASTORE_ID').text
                    datastore_usage[datastore_id] ||= 0
                    datastore_usage[datastore_id] += size

                    if !e.at_xpath(s_path).nil?
                        s_size = e.at_xpath(s_path).text.to_i
                        datastore_usage[datastore_id] += s_size
                    end
                end
            end

            vmdoc.root.xpath('TEMPLATE/SNAPSHOT').each do |e|
                size = 0

                size_e = e.at_xpath('SYSTEM_DISK_SIZE')

                size = size_e.text.to_i unless size_e.nil?

                sys_used[nil] += size
                sys_used[cid] += size unless cid.nil?
            end
        end

        vm_elems.each do |cluster_ids, vm_elem|
            e = vm_elem.at_xpath('SYSTEM_DISK_SIZE_USED')
            next if e.nil?

            next if e.text == sys_used[cluster_ids].to_s

            @error = true

            log_error("#{resource} #{oid} (clusters #{cluster_ids}) quotas: " \
                "SYSTEM_DISK_SIZE_USED has #{e.text} \tis\t#{sys_used[cluster_ids]}")
            e.content = sys_used[cluster_ids].to_s
        end

        datastore_usage
    end

    # From a VM xml update one quota record, could be global or per cluster
    def calculate_vm_quota(vmdoc, quotas, resources)
        quotas ||= {}

        quota_pci = 0
        quota_pci_nic = 0

        vmdoc.xpath('VM/TEMPLATE/PCI').each do |pci|
            type = pci.xpath('TYPE')&.text&.upcase

            if type == 'NIC'
                quota_pci_nic += 1
            else
                quota_pci += 1
            end
        end

        resources.each do |att_name, quota_name|
            if att_name == :CPU
                cpu = vmdoc.root.at_xpath('TEMPLATE/CPU')
                cpu = cpu.nil? ? 0 : cpu.text.to_f

                # truncate to 2 decimals
                value = (cpu * 100)
            elsif att_name == :VMS
                value = 1
            elsif att_name == :PCI_DEV
                value = quota_pci
            elsif att_name == :PCI_NIC
                value = quota_pci_nic
            else
                value = vmdoc.root.at_xpath("TEMPLATE/#{att_name}") ||
                    vmdoc.root.at_xpath("USER_TEMPLATE/#{att_name}")
                value = value.text unless value.nil?
            end

            quotas[quota_name] += value.to_i
        end
    end

    # rubocop:disable Metrics/ParameterLists
    def check_vm_quota(doc, resource, cluster_ids, vm_elem, quotas, resources)
        oid = doc.root.at_xpath('ID').text.to_i

        resources.each do |att_name, quota_name|
            value = vm_elem.at_xpath("#{quota_name}_USED")
            real_value = quotas[quota_name]

            if value.nil?
                vm_elem.add_child(doc.create_element(quota_name)).content = '-1'
                value = doc.create_element("#{quota_name}_USED")
                vm_elem.add_child(value).content = '0'
            end

            if att_name == :CPU
                real_value /= 100.0

                different = value.text.to_f != real_value ||
                ![format('%.2f', real_value),
                  format('%.1f', real_value),
                  format('%.0f', real_value)].include?(value.text)

                next unless different
            else
                next if value.text.to_i == quotas[quota_name].to_i
            end

            @error = true

            log_error("#{resource} #{oid} (clusters: #{cluster_ids}) quotas: " \
                "#{quota_name}_USED has #{value.text} \tis\t#{real_value}")
            value.content = real_value.to_s
        end
    end
    # rubocop:enable Metrics/ParameterLists

    # Calculate VM quotas
    #
    # @param doc       [Nokogiri::XML] xml document with all information
    # @param query     [String]        database query
    # @param resource  [String]        OpenNebula object
    # @param resources [Object]        name of each quota resource
    #
    # @return          [Object]        VM information
    def calculate_vm_quotas(doc, query, resource, resources)
        # Read VM QUOTAS from user/group quotas
        vm_elems = {}
        doc.root.xpath('VM_QUOTA/VM').each do |q|
            cluster_ids = q.at_xpath('CLUSTER_IDS')
            cluster_ids = cluster_ids.text unless cluster_ids.nil?

            vm_elems[cluster_ids] = q
        end

        # Add global quota if it doesn't exists
        if vm_elems[nil].nil?
            vm_quota = doc.root.add_child(doc.create_element('VM_QUOTA'))
            vm_elems[nil] = vm_quota.add_child(doc.create_element('VM'))

            vm_elems[nil].add_child(doc.create_element('SYSTEM_DISK_SIZE')).content      = '-1'
            vm_elems[nil].add_child(doc.create_element('SYSTEM_DISK_SIZE_USED')).content = '0'
        end

        # Init quota counters
        quotas = {} # This should count also quotas per cluster

        vm_elems.each do |cluster_ids, _|
            quotas[cluster_ids] = {}

            resources.each {|_, q| quotas[cluster_ids][q] = 0 }
        end

        # Calculate real VM quotas from VM instances
        @db.fetch(query) do |vm_row|
            vmdoc = nokogiri_doc(vm_row[:body], 'vm_pool')

            calculate_vm_quota(vmdoc, quotas[nil], resources)

            cid = vmdoc.root.at_xpath('//HISTORY/CID')

            next if cid.nil?

            cid = cid.text

            vm_elems.each do |cluster_ids, _quota|
                next if cluster_ids.nil?

                if cluster_ids.split(',').include?(cid)
                    calculate_vm_quota(vmdoc, quotas[cluster_ids], resources)
                end
            end
        end

        # Check quotas: Compare stored values with real values
        vm_elems.each do |cluster_ids, quota|
            check_vm_quota(doc, resource, cluster_ids, quota, quotas[cluster_ids], resources)
        end

        vm_elems
    end

    # Calculate vnet quotas
    #
    # @param doc      [Nokogiri::XML] xml document with all information
    # @param query    [String]        database query
    # @param resource [String]        OpenNebula object
    def calculate_vnet_quotas(doc, queries, resource)
        oid = doc.root.at_xpath('ID').text.to_i

        vnet_usage = {}

        @db.fetch(queries[0]) do |vm_row|
            vmdoc = nokogiri_doc(vm_row[:body], 'vm_pool')

            vmdoc.root.xpath('TEMPLATE/NIC/NETWORK_ID').each do |e|
                next if e.text.empty?

                vnet_usage[e.text] = 0 if vnet_usage[e.text].nil?
                vnet_usage[e.text] += 1
            end

            vmdoc.root.xpath('TEMPLATE/PCI/NETWORK_ID').each do |e|
                next if e.text.empty?

                vnet_usage[e.text] = 0 if vnet_usage[e.text].nil?
                vnet_usage[e.text] += 1
            end
        end

        @db.fetch(queries[1]) do |vrouter_row|
            vrouter_doc = nokogiri_doc(vrouter_row[:body], 'vrouter_pool')

            vrouter_doc.root.xpath('TEMPLATE/NIC').each do |nic|
                net_id = nic.at_xpath('NETWORK_ID')&.text
                floating = nic.at_xpath('FLOATING_IP')&.text&.upcase == 'YES'

                if !net_id.nil? && floating
                    vnet_usage[net_id] = 0 if vnet_usage[net_id].nil?
                    vnet_usage[net_id] += 1
                end
            end
        end

        # Calculate quotas for reserved networks
        @db.fetch(queries[2]) do |vnet_row|
            vnet_doc = nokogiri_doc(vnet_row[:body], 'network_pool')

            parent_id = vnet_doc.root.xpath('PARENT_NETWORK_ID')
            parent_id = parent_id.text unless parent_id.nil?

            next if parent_id.nil? || parent_id.empty?

            vnet_doc.xpath('VNET/AR_POOL').each do |ar|
                vnet_usage[parent_id] = 0 if vnet_usage[parent_id].nil?

                ar.xpath('AR/SIZE').each do |size|
                    vnet_usage[parent_id] += size.text.to_i
                end
            end
        end

        net_quota = doc.root.xpath('NETWORK_QUOTA').remove

        new_net_quota = doc.root.add_child(doc.create_element('NETWORK_QUOTA'))

        net_quota = new_net_quota if net_quota.nil?

        net_quota.xpath('NETWORK').each do |net_elem|
            # Check ID exists
            unless net_elem.at_xpath('ID')
                log_error("#{resource} #{oid} quotas: NETWORK doesn't have ID", false)
                next
            end

            # Check leases
            vnet_id = net_elem.at_xpath('ID').text

            leases_used = vnet_usage.delete(vnet_id)

            leases_used = 0 if leases_used.nil?

            net_elem.xpath('LEASES_USED').each do |e|
                next if e.text == leases_used.to_s

                @error = true

                log_error("#{resource} #{oid} quotas: VNet " \
                          "#{vnet_id}\tLEASES_USED has #{e.text} " \
                          "\tis\t#{leases_used}")
                e.content = leases_used.to_s
            end

            new_net_quota.add_child(net_elem)
        end

        vnet_usage.each do |vnet_id, leases_used|
            @error = true

            log_error("#{resource} #{oid} quotas: VNet " \
                      "#{vnet_id}\tLEASES_USED has 0 \tis\t#{leases_used}")

            new_elem = new_net_quota.add_child(doc.create_element('NETWORK'))

            leases_el = doc.create_element('LEASES_USED')
            new_elem.add_child(doc.create_element('ID')).content = vnet_id
            new_elem.add_child(doc.create_element('LEASES')).content = '-1'
            new_elem.add_child(leases_el).content = leases_used.to_s
        end
    end
    # rubocop:enable Style/FormatStringToken

end
