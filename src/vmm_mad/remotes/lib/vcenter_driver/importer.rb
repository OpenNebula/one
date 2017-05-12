module VCenterDriver

class Importer

def self.import_wild(host_id, vm_ref, one_vm, template)

    begin
        vi_client = VCenterDriver::VIClient.new_from_host(host_id)
        vc_uuid   = vi_client.vim.serviceContent.about.instanceUuid
        vc_name   = vi_client.vim.host

        dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool)
        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool)

        vcenter_vm = VCenterDriver::VirtualMachine.new_from_ref(vm_ref, vi_client)

        error, template_disks = vcenter_vm.import_vcenter_disks(vc_uuid, dpool, ipool)
        return OpenNebula::Error.new(error) if !error.empty?

        template << template_disks

        # Create images or get nics information for template
        error, template_nics = vcenter_vm.import_vcenter_nics(vc_uuid,
                                                              npool,
                                                              vm_ref,
                                                              vc_name)
        return OpenNebula::Error.new(error) if !error.empty?

        template << template_nics

        rc = one_vm.allocate(template)
        return rc if OpenNebula.is_error?(rc)

        one_vm.deploy(host_id, false)

        # Set reference to template disks and nics in VM template
        vcenter_vm.one_item = one_vm
        vcenter_vm.reference_unmanaged_devices(vm_ref)

        # Set vnc configuration F#5074
        vnc_port  = one_vm["TEMPLATE/GRAPHICS/PORT"]
        elapsed_seconds = 0

        # Let's update the info to gather VNC port
        until vnc_port || elapsed_seconds > 30
            sleep(2)
            one_vm.info
            vnc_port  = one_vm["TEMPLATE/GRAPHICS/PORT"]
            elapsed_seconds += 2
        end

        if vnc_port
            vcenter_vm.one_item = one_vm
            extraconfig   = []
            extraconfig  += vcenter_vm.extraconfig_vnc
            spec_hash     = { :extraConfig  => extraconfig }
            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
            vcenter_vm.item.ReconfigVM_Task(:spec => spec).wait_for_completion
        end

        return one_vm.id

    rescue Exception => e
        vi_client.close_connection if vi_client
        return OpenNebula::Error.new(e.message)
    end
end

def self.import_clusters(con_ops, options)
    begin
        STDOUT.print "\nConnecting to vCenter: #{options[:vcenter]}..."

        use_defaults = options.key?(:defaults)

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Exploring vCenter resources..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        vcenter_instance_name = vi_client.vim.host

        # OpenNebula's ClusterPool
        cpool = VCenterDriver::VIHelper.one_pool(OpenNebula::ClusterPool, false)

        if cpool.respond_to?(:message)
            raise "Could not get OpenNebula ClusterPool: #{cpool.message}"
        end

        cluster_list = {}
        cpool.each do |c|
            cluster_list[c["ID"]] = c["NAME"]
        end

        # Get OpenNebula's host pool
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)

        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        rs = dc_folder.get_unimported_hosts(hpool,vcenter_instance_name)

        STDOUT.print "done!\n\n"

        rs.each {|dc, clusters|

            if !use_defaults
                STDOUT.print "Do you want to process datacenter #{dc} (y/[n])? "
                next if STDIN.gets.strip.downcase != 'y'
            end

            if clusters.empty?
                STDOUT.puts "\n    No new clusters found in #{dc}..."
                next
            end

            clusters.each{ |cluster|
                one_cluster_id = nil
                rpool = nil
                if !use_defaults
                    STDOUT.print "\n  * Import cluster #{cluster[:cluster_name]} (y/[n])? "
                    next if STDIN.gets.strip.downcase != 'y'

                    if cluster_list.size > 1
                        STDOUT.print "\n    In which OpenNebula cluster do you want the vCenter cluster to be included?\n "

                        cluster_list_str = "\n"
                        cluster_list.each do |key, value|
                            cluster_list_str << "      - ID: " << key << " - NAME: " << value << "\n"
                        end

                        STDOUT.print "\n    #{cluster_list_str}"
                        STDOUT.print "\n    Specify the ID of the cluster or Enter to use the default cluster: "

                        answer = STDIN.gets.strip
                        one_cluster_id = answer if !answer.empty?
                    end
                end

                one_host = VCenterDriver::ClusterComputeResource.to_one(cluster,
                                                                        con_ops,
                                                                        rpool,
                                                                        one_cluster_id)

                STDOUT.puts "\n    OpenNebula host #{cluster[:cluster_name]} with"\
                            " id #{one_host.id} successfully created."
                STDOUT.puts
            }
        }
    rescue Interrupt => e
        puts "\n"
        exit 0 #Ctrl+C
    rescue Exception => e
        STDOUT.puts "    Error: #{e.message}/\n#{e.backtrace}"
    ensure
        vi_client.close_connection if vi_client
    end

end

def self.import_templates(con_ops, options)
    begin
        STDOUT.print "\nConnecting to vCenter: #{options[:vcenter]}..."

        use_defaults = options.key?(:defaults)

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Looking for VM Templates..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        # Get OpenNebula's templates pool
        tpool = VCenterDriver::VIHelper.one_pool(OpenNebula::TemplatePool, false)

        if tpool.respond_to?(:message)
            raise "Could not get OpenNebula TemplatePool: #{tpool.message}"
        end

        rs = dc_folder.get_unimported_templates(vi_client, tpool)

        STDOUT.print "done!\n"

        # Create OpenNebula pools
        dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool)
        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool)

        # Get vcenter intance uuid as moref is unique for each vcenter
        vc_uuid = vi_client.vim.serviceContent.about.instanceUuid

        rs.each {|dc, tmps|

            if !use_defaults
                STDOUT.print "\nDo you want to process datacenter #{dc} (y/[n])? "
                next if STDIN.gets.strip.downcase != 'y'
            end

            if tmps.empty?
                STDOUT.print "    No new VM Templates found in #{dc}...\n\n"
                next
            end

            tmps.each{ |t|
                template = nil
                template_copy_ref = nil

                if !use_defaults
                    STDOUT.print "\n  * VM Template found:\n"\
                                    "      - Name   : #{t[:name]}\n"\
                                    "      - Moref  : #{t[:vcenter_ref]}\n"\
                                    "      - Cluster: #{t[:cluster_name]}\n"\
                                    "    Import this VM template (y/[n])? "

                    next if STDIN.gets.strip.downcase != 'y'
                end

                # Linked Clones
                if !use_defaults

                    template = VCenterDriver::Template.new_from_ref(t[:vcenter_ref], vi_client)

                    STDOUT.print "\n    For faster deployment operations"\
                                 " and lower disk usage, OpenNebula"\
                                 " can create new VMs as linked clones."\
                                 "\n    Would you like to use Linked Clones with VMs based on this template (y/[n])? "

                    if STDIN.gets.strip.downcase == 'y'

                        STDOUT.print "\n    Linked clones requires that delta"\
                                     " disks must be created for each disk in the template."\
                                     " This operation may change the template contents."\
                                     " \n    Do you want OpenNebula to create a copy of the template,"\
                                     " so the original template remains untouched ([y]/n)? "

                        template = t[:template]
                        if STDIN.gets.strip.downcase != 'n'

                            STDOUT.print "\n    The new template will be named"\
                                         " adding a one- prefix to the name"\
                                         " of the original template. \n"\
                                         "    If you prefer a different name"\
                                         " please specify or press Enter"\
                                         " to use defaults: "

                            template_name = STDIN.gets.strip.downcase

                            STDOUT.print "\n    WARNING!!! The cloning operation can take some time"\
                                         " depending on the size of disks. Please wait...\n"


                            error, template_copy_ref = template.create_template_copy(template_name)

                            if template_copy_ref

                                template = VCenterDriver::Template.new_from_ref(template_copy_ref, vi_client)

                                one_template = VCenterDriver::Template.get_xml_template(template, vc_uuid, vi_client, options[:vcenter], dc)

                                if one_template
                                    #Now create delta disks
                                    STDOUT.print "\n    Delta disks are being created, please be patient..."

                                    lc_error, use_lc = template.create_delta_disks
                                    if lc_error
                                        STDOUT.print "\n    ERROR. Something was wrong with the create delta disks on the template operation: #{lc_error}.\n"\
                                                    "\n    Linked Clones will not be used with this template.\n"
                                    else
                                        one_template[:one] << "\nVCENTER_LINKED_CLONES=\"YES\"\n"
                                        t = one_template
                                    end
                                else
                                    STDOUT.print "\n    ERROR. Something was wrong obtaining the info from the template's copy.\n"\
                                                 "\n    Linked Clones will not be used with this template.\n"
                                    template.delete_template if template_copy_ref
                                end

                            else
                                STDOUT.print "\n    ERROR. #{error}\n"
                            end

                        else
                            # Create linked clones on top of the existing template
                            # Create a VirtualMachine object from the template_copy_ref
                            STDOUT.print "\n    Delta disks are being created, please be patient..."

                            lc_error, use_lc = template.create_delta_disks
                            if lc_error
                                STDOUT.print "\n    ERROR. Something was wrong with the create delta disks on the template operation: #{lc_error}.\n"\
                                             "\n    Linked Clones will not be used with this template.\n"
                            end
                            t[:one] << "\nVCENTER_LINKED_CLONES=\"YES\"\n" if use_lc
                        end
                    end
                end

                vcenter_vm_folder = ""
                if !use_defaults
                    STDOUT.print "\n\n    Do you want to specify a folder where"\
                                    " the deployed VMs based on this template will appear"\
                                    " in vSphere's VM and Templates section?"\
                                    "\n    If no path is set, VMs will be placed in the same"\
                                    " location where the template lives."\
                                    "\n    Please specify a path using slashes to separate folders"\
                                    " e.g /Management/VMs or press Enter to use defaults: "\

                    vcenter_vm_folder = STDIN.gets.strip
                    t[:one] << "VCENTER_VM_FOLDER=\"#{vcenter_vm_folder}\"\n" if !vcenter_vm_folder.empty?
                end

                ## Add existing disks to template (OPENNEBULA_MANAGED)

                STDOUT.print "\n    The existing disks and networks in the template"\
                             " are being imported, please be patient..."

                template = t[:template] if !template


                error, template_disks = template.import_vcenter_disks(vc_uuid,
                                                                      dpool,
                                                                      ipool)

                if error.empty?
                    t[:one] << template_disks
                else
                    STDOUT.puts error
                    template.delete_template if template_copy_ref
                    next
                end

                template_moref = template_copy_ref ? template_copy_ref : t[:vcenter_ref]

                error, template_nics = template.import_vcenter_nics(vc_uuid,
                                                                    npool,
                                                                    options[:vcenter],
                                                                    template_moref,
                                                                    dc)
                if error.empty?
                    t[:one] << template_nics
                else
                    STDOUT.puts error
                    template.delete_template if template_copy_ref
                    next
                end

                # Resource Pools
                rp_input = ""
                rp_split = t[:rp].split("|")

                if !use_defaults

                    if rp_split.size > 3
                        STDOUT.print "\n\n    This template is currently set to "\
                            "launch VMs in the default resource pool."\
                            "\n    Press y to keep this behaviour, n to select"\
                            " a new resource pool or d to delegate the choice"\
                            " to the user ([y]/n/d)? "

                        answer =  STDIN.gets.strip.downcase

                        case answer
                        when 'd'
                            list_of_rp   = rp_split[-2]
                            default_rp   = rp_split[-1]
                            rp_input     = rp_split[0] + "|" + rp_split[1] + "|" +
                                            rp_split[2] + "|"

                            # Available list of resource pools
                            input_str = "    The list of available resource pools "\
                                        "to be presented to the user are "\
                                        "\"#{list_of_rp}\""
                            input_str+= "\n    Press y to agree, or input a comma"\
                                        " separated list of resource pools to edit "\
                                        "([y]/comma separated list) "
                            STDOUT.print input_str

                            answer = STDIN.gets.strip

                            if !answer.empty? && answer.downcase != 'y'
                                rp_input += answer + "|"
                            else
                                rp_input += rp_split[3] + "|"
                            end

                            # Default
                            input_str   = "    The default resource pool presented "\
                                            "to the end user is set to"\
                                            " \"#{default_rp}\"."
                            input_str+= "\n    Press y to agree, or input a new "\
                                        "resource pool ([y]/resource pool name) "
                            STDOUT.print input_str

                            answer = STDIN.gets.strip

                            if !answer.empty? && answer.downcase != 'y'
                                rp_input += answer
                            else
                                rp_input += rp_split[4]
                            end
                        when 'n'

                            list_of_rp   = rp_split[-2]

                            STDOUT.print "    The list of available resource pools is:\n\n"

                            index = 1
                            t[:rp_list].each do |r|
                                list_str = "    - #{r[:name]}\n"
                                index += 1
                                STDOUT.print list_str
                            end

                            input_str = "\n    Please input the new default"\
                                        " resource pool name: "

                            STDOUT.print input_str

                            answer = STDIN.gets.strip

                            t[:one] << "VCENTER_RESOURCE_POOL=\"#{answer}\"\n"
                        end
                    end
                end

                if !rp_input.empty?
                    t[:one] << "USER_INPUTS=["
                    t[:one] << "VCENTER_RESOURCE_POOL=\"#{rp_input}\"," if !rp_input.empty?
                    t[:one] = t[:one][0..-2]
                    t[:one] << "]"
                end

                one_t = VCenterDriver::VIHelper.new_one_item(OpenNebula::Template)

                rc = one_t.allocate(t[:one])

                if ::OpenNebula.is_error?(rc)
                    STDOUT.puts "    Error creating template: #{rc.message}\n"
                    template.delete_template if template_copy_ref
                else
                    STDOUT.puts "    OpenNebula template #{one_t.id} created!\n"
                end
            }
        }
    rescue Interrupt => e
        puts "\n"
        exit 0 #Ctrl+C
    rescue Exception => e
        STDOUT.puts "    Error: #{e.message}/\n#{e.backtrace}"
    ensure
        vi_client.close_connection if vi_client
    end
end

def self.import_networks(con_ops, options)
    begin
        STDOUT.print "\nConnecting to vCenter: #{options[:vcenter]}..."

        use_defaults = options.key?(:defaults)

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Looking for vCenter networks..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        # OpenNebula's VirtualNetworkPool
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool, false)

        if npool.respond_to?(:message)
            raise "Could not get OpenNebula VirtualNetworkPool: #{npool.message}"
        end

        rs = dc_folder.get_unimported_networks(npool,options[:vcenter])

        STDOUT.print "done!\n"

        rs.each {|dc, tmps|

            if !use_defaults
                STDOUT.print "\nDo you want to process datacenter #{dc} [y/n]? "

                next if STDIN.gets.strip.downcase != 'y'
            end

            if tmps.empty?
                STDOUT.print "    No new Networks found in #{dc}...\n\n"
                next
            end

            tmps.each do |n|
                one_cluster_id = nil
                if !use_defaults
                    print_str =  "\n  * Network found:\n"\
                                 "      - Name    : #{n[:name]}\n"\
                                 "      - Type    : #{n[:type]}\n"
                    print_str << "      - Cluster : #{n[:cluster]}\n"
                    print_str << "    Import this Network (y/[n])? "

                    STDOUT.print print_str

                    next if STDIN.gets.strip.downcase != 'y'
                end

                size="255"
                ar_type="e"
                first_ip=nil
                first_mac=nil
                slaac=nil
                global_prefix=nil
                ula_prefix=nil
                ip6_address = nil
                prefix_length = nil

                # Size
                if !use_defaults
                    STDOUT.print "    How many VMs are you planning"\
                                " to fit into this network [255]? "
                    size_answer = STDIN.gets.strip
                    if !size_answer.empty?
                        size = size_answer.to_i.to_s rescue "255"
                    end
                end

                # Type
                if !use_defaults
                    STDOUT.print "    What type of Virtual Network"\
                                " do you want to create (IPv[4],IPv[6]"\
                                ",[E]thernet) ?"

                    type_answer = STDIN.gets.strip
                    if ["4","6","e"].include?(type_answer.downcase)
                        ar_type = type_answer.downcase
                    else
                        ar_type = "e"
                        STDOUT.puts "    Type [#{type_answer}] not supported,"\
                                    " defaulting to Ethernet."
                    end

                    case ar_type.downcase
                    when "4"
                        STDOUT.print "    Please input the first IP "\
                                        "in the range: "
                        first_ip = STDIN.gets.strip

                        STDOUT.print "    Please input the first MAC "\
                                        "in the range [Enter for default]: "
                        mac_answer = STDIN.gets.strip
                        first_mac = first_mac_answer if !mac_answer.empty?
                    when "6"
                        STDOUT.print "    Please input the first MAC "\
                                        "in the range [Enter for default]: "
                        mac_answer = STDIN.gets.strip
                        first_mac = first_mac_answer if !mac_answer.empty?

                        STDOUT.print "    Do you want to use SLAAC "\
                                     "Stateless Address Autoconfiguration? ([y]/n): "
                        slaac_answer = STDIN.gets.strip.strip.downcase

                        if slaac_answer == 'n'
                            slaac = false
                            STDOUT.print "    Please input the IPv6 address (cannot be empty): "
                            ip6_address = STDIN.gets.strip
                            ip6_address = ip6_address if !ip6_address.empty?

                            STDOUT.print "    Please input the Prefix length (cannot be empty): "
                            prefix_length = STDIN.gets.strip
                            prefix_length = prefix_length if !prefix_length.empty?
                        else
                            slaac = true
                            STDOUT.print "    Please input the GLOBAL PREFIX "\
                                        "[Enter for default]: "
                            gp_answer = STDIN.gets.strip
                            global_prefix = gp_answer if !gp_answer.empty?

                            STDOUT.print "    Please input the ULA PREFIX "\
                                            "[Enter for default]: "
                            ula_answer = STDIN.gets.strip
                            ula_prefix = ula_answer if !ula_answer.empty?
                        end
                    when "e"
                        STDOUT.print "    Please input the first MAC "\
                                "in the range [Enter for default]: "
                        mac_answer = STDIN.gets.strip
                        first_mac = first_mac_answer if !mac_answer.empty?
                    end
                end

                ar_str =  "\nAR=[TYPE=\""

                case ar_type
                when "4"
                    ar_str << "IP4\""
                    ar_str << ",IP=" + first_ip if first_ip
                    ar_str << ",MAC=" + first_mac if first_mac
                when "6"
                    if slaac
                        ar_str << "IP6\""
                        ar_str << ",MAC=" + first_mac if first_mac
                        ar_str << ",GLOBAL_PREFIX=" + global_prefix if global_prefix
                        ar_str << ",ULA_PREFIX=" + ula_prefix if ula_prefix
                    else
                        ar_str << "IP6_STATIC\""
                        ar_str << ",MAC=" + first_mac if first_mac
                        ar_str << ",IP6=" + ip6_address if ip6_address
                        ar_str << ",PREFIX_LENGTH=" + prefix_length if prefix_length
                    end
                when "e"
                    ar_str << "ETHER\""
                    ar_str << ",MAC=" + first_mac if first_mac
                end

                ar_str << ",SIZE = \"#{size}\"]"

                n[:one] << ar_str

                one_vn = VCenterDriver::VIHelper.new_one_item(OpenNebula::VirtualNetwork)

                rc = one_vn.allocate(n[:one])

                if ::OpenNebula.is_error?(rc)
                    STDOUT.puts "\n    Error creating virtual network: " +
                                " #{rc.message}\n"
                else
                    STDOUT.puts "\n    OpenNebula virtual network " +
                                "#{one_vn.id} created with size #{size}!\n"
                end
            end
        }
    rescue Interrupt => e
        puts "\n"
        exit 0 #Ctrl+C
    rescue Exception => e
        STDOUT.puts "    Error: #{e.message}/\n#{e.backtrace}"
    ensure
        vi_client.close_connection if vi_client
    end
end

def self.import_datastore(con_ops, options)
    begin
        STDOUT.print "\nConnecting to vCenter: #{options[:vcenter]}..."

        use_defaults = options.key?(:defaults)

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Looking for Datastores..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool, false)

        if dpool.respond_to?(:message)
            raise "Could not get OpenNebula DatastorePool: #{dpool.message}"
        end

        # Get OpenNebula's host pool
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)

        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        rs = dc_folder.get_unimported_datastores(dpool, options[:vcenter], hpool)

        STDOUT.print "done!\n"

        rs.each {|dc, tmps|
            if !use_defaults
                STDOUT.print "\nDo you want to process datacenter #{dc} (y/[n])? "

                next if STDIN.gets.strip.downcase != 'y'
            end

            if tmps.empty?
                STDOUT.print "    No new Datastores or StoragePods found in #{dc}...\n\n"
                next
            end

            tmps.each{ |d|
                if !use_defaults
                    STDOUT.print "\n  * Datastore found:\n"\
                                    "      - Name      : #{d[:name]}\n"\
                                    "      - Total MB  : #{d[:total_mb]}\n"\
                                    "      - Free  MB  : #{d[:free_mb]}\n"\
                                    "      - Cluster   : #{d[:cluster]}\n"\
                                    "    Import this as Datastore [y/n]? "

                    next if STDIN.gets.strip.downcase != 'y'

                    STDOUT.print "\n    NOTE: For each vcenter datastore a SYSTEM and IMAGE datastore\n"\
                                 "    will be created in OpenNebula except for a StorageDRS which is \n"\
                                 "    represented as a SYSTEM datastore only.\n"

                end

                ds_allocate_error = false
                d[:ds].each do |ds|
                    one_d = VCenterDriver::VIHelper.new_one_item(OpenNebula::Datastore)
                    rc = one_d.allocate(ds[:one])
                    if ::OpenNebula.is_error?(rc)
                        STDOUT.puts "    \n    Error creating datastore: #{rc.message}"
                        ds_allocate_error = true
                    else
                        STDOUT.puts "    \n    OpenNebula datastore #{one_d.id} created!\n"
                    end
                end
            }
        }
    rescue Interrupt => e
        puts "\n"
        exit 0 #Ctrl+C
    rescue Exception => e
        STDOUT.puts "    Error: #{e.message}/\n#{e.backtrace}"
    ensure
        vi_client.close_connection if vi_client
    end
end

def self.import_images(con_ops, ds_name, options)

    begin
        STDOUT.print "\nConnecting to vCenter: #{options[:vcenter]}..."

        use_defaults = options.key?(:defaults)

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Looking for Images..."

        one_ds = VCenterDriver::VIHelper.find_by_name(OpenNebula::DatastorePool,
                                                        ds_name)
        one_ds_ref = one_ds['TEMPLATE/VCENTER_DS_REF']

        ds = VCenterDriver::Datastore.new_from_ref(one_ds_ref, vi_client)
        ds.one_item = one_ds #Store opennebula template for datastore

        images = ds.get_images

        STDOUT.print "done!\n"

        images.each{ |i|

                if !use_defaults
                    STDOUT.print "\n  * Image found:\n"\
                                    "      - Name      : #{i[:name]}\n"\
                                    "      - Path      : #{i[:path]}\n"\
                                    "      - Type      : #{i[:type]}\n"\
                                    "    Import this Image (y/[n])? "

                    next if STDIN.gets.strip.downcase != 'y'
                end

                one_i = VCenterDriver::VIHelper.new_one_item(OpenNebula::Image)

                rc = one_i.allocate(i[:one], i[:dsid].to_i)

                if ::OpenNebula.is_error?(rc)
                    STDOUT.puts "Error creating image: #{rc.message}\n"
                    if rc.message == "[ImageAllocate] Not enough space "\
                                        "in datastore"
                        STDOUT.puts "Please disable DATASTORE_CAPACITY_"\
                                    "CHECK in /etc/one/oned.conf and "\
                                    "restart OpenNebula."
                    end
                else
                    STDOUT.puts "    OpenNebula image #{one_i.id} created!\n"
                end
        }
    rescue Interrupt => e
        puts "\n"
        exit 0 #Ctrl+C
    rescue Exception => e
        STDOUT.puts "    Error: #{e.message}/\n#{e.backtrace}"
    ensure
        vi_client.close_connection if vi_client
    end
end

end # Importer

end # module VCenterDriver