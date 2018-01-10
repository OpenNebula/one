module VCenterDriver
class Importer

VNC_ESX_HOST_FOLDER = "/tmp"

def self.import_wild(host_id, vm_ref, one_vm, template)

    begin
        vi_client = VCenterDriver::VIClient.new_from_host(host_id)
        vc_uuid   = vi_client.vim.serviceContent.about.instanceUuid
        vc_name   = vi_client.vim.host

        dpool = VCenterDriver::VIHelper.one_pool(OpenNebula::DatastorePool)
        if dpool.respond_to?(:message)
            raise "Could not get OpenNebula DatastorePool: #{dpool.message}"
        end
        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        if ipool.respond_to?(:message)
            raise "Could not get OpenNebula ImagePool: #{ipool.message}"
        end
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool)
        if npool.respond_to?(:message)
            raise "Could not get OpenNebula VirtualNetworkPool: #{npool.message}"
        end
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool)
        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        vcenter_vm = VCenterDriver::VirtualMachine.new_from_ref(vm_ref, vi_client)
        vm_name    = vcenter_vm["name"]

        wild     = true
        sunstone = false

        type = {:object => "VM", :id => vm_name}
        error, template_disks = vcenter_vm.import_vcenter_disks(vc_uuid, dpool, ipool, type, sunstone)
        return OpenNebula::Error.new(error) if !error.empty?

        template << template_disks

        # Create images or get nics information for template
        error, template_nics = vcenter_vm.import_vcenter_nics(vc_uuid,
                                                              npool,
                                                              hpool,
                                                              vc_name,
                                                              vm_ref,
                                                              wild,
                                                              sunstone,
                                                              vm_name)
        
        return OpenNebula::Error.new(error) if !error.empty?

        template << template_nics

        # Get DS_ID for the deployment, the wild VM needs a System DS
        dc_ref = vcenter_vm.get_dc.item._ref
        ds_ref = template.match(/^VCENTER_DS_REF *= *"(.*)" *$/)[1]

        ds_one = dpool.select do |e|
            e["TEMPLATE/TYPE"]                == "SYSTEM_DS" &&
            e["TEMPLATE/VCENTER_DS_REF"]      == ds_ref &&
            e["TEMPLATE/VCENTER_DC_REF"]      == dc_ref &&
            e["TEMPLATE/VCENTER_INSTANCE_ID"] == vc_uuid
        end.first
        
        return OpenNebula::Error.new("DS with ref #{ds_ref} is not imported in OpenNebula, aborting Wild VM import.") if !ds_one

        rc = one_vm.allocate(template)
        return rc if OpenNebula.is_error?(rc)

        rc = one_vm.deploy(host_id, false, ds_one.id)
        return rc if OpenNebula.is_error?(rc)

        # Set reference to template disks and nics in VM template
        vcenter_vm.one_item = one_vm
        vcenter_vm.reference_unmanaged_devices(vm_ref)

        # Set vnc configuration F#5074
        vnc_port  = one_vm["TEMPLATE/GRAPHICS/PORT"]
        elapsed_seconds = 0

        # Let's update the info to gather VNC port
        until vnc_port || elapsed_seconds > 30
            sleep(1)
            one_vm.info
            vnc_port  = one_vm["TEMPLATE/GRAPHICS/PORT"]
            elapsed_seconds += 1
        end

        if vnc_port
            vcenter_vm.one_item = one_vm
            extraconfig   = []
            extraconfig  += vcenter_vm.extraconfig_vnc
            spec_hash     = { :extraConfig  => extraconfig }
            spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
            vcenter_vm.item.ReconfigVM_Task(:spec => spec).wait_for_completion
        end

        # Add VCENTER_ESX_HOST to MONITOR info so VNC works for running VMs F#4242
        esx_host = vcenter_vm["runtime.host.name"].to_s
        f = File.open(File.join(VNC_ESX_HOST_FOLDER, "vcenter_vnc_#{one_vm.id}"), 'w')
        f.write(esx_host)
        f.close

        return one_vm.id

    rescue Exception => e
        vi_client.close_connection if vi_client
        return OpenNebula::Error.new("#{e.message}/#{e.backtrace}")
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
        vc_uuid   = vi_client.vim.serviceContent.about.instanceUuid

        # OpenNebula's ClusterPool
        cpool = VCenterDriver::VIHelper.one_pool(OpenNebula::ClusterPool, false)
        if cpool.respond_to?(:message)
            raise "Could not get OpenNebula ClusterPool: #{cpool.message}"
        end

        cluster_list = {}
        cpool.each do |c|
            cluster_list[c["ID"]] = c["NAME"] if c["ID"].to_i != 0
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
                    STDOUT.print "\n  * vCenter cluster found:\n"\
                                 "      - Name       : \e[92m#{cluster[:simple_name]}\e[39m\n"\
                                 "      - Location   : #{cluster[:cluster_location]}\n"\
                                 "    Import cluster (y/[n])? "
                    next if STDIN.gets.strip.downcase != 'y'

                    if cluster_list.size > 0
                        STDOUT.print "\n    In which OpenNebula cluster do you want the vCenter cluster to be included?\n "

                        cluster_list_str = "\n"
                        cluster_list.each do |key, value|
                            cluster_list_str << "      - \e[94mID: " << key << "\e[39m - NAME: " << value << "\n"
                        end

                        STDOUT.print "\n    #{cluster_list_str}"
                        STDOUT.print "\n    Specify the ID of the cluster or press Enter if you want OpenNebula to create a new cluster for you: "

                        answer = STDIN.gets.strip
                        if !answer.empty?
                            one_cluster_id = answer
                        end
                    end

                    if !one_cluster_id
                        one_cluster = VCenterDriver::VIHelper.new_one_item(OpenNebula::Cluster)
                        rc = one_cluster.allocate("#{cluster[:cluster_name]}")
                        if ::OpenNebula.is_error?(rc)
                            STDOUT.puts "    Error creating OpenNebula cluster: #{rc.message}\n"
                            next
                        end
                        one_cluster_id = one_cluster.id
                    end
                else
                    # Defaults, add host to new cluster
                    one_cluster = VCenterDriver::VIHelper.new_one_item(OpenNebula::Cluster)
                    rc = one_cluster.allocate("#{cluster[:cluster_name]}")
                    if ::OpenNebula.is_error?(rc)
                        STDOUT.puts "    Error creating OpenNebula cluster: #{rc.message}\n"
                        next
                    end
                    one_cluster_id = one_cluster.id
                end



                # Generate the template and create the host in the pool
                one_host = VCenterDriver::ClusterComputeResource.to_one(cluster,
                                                                        con_ops,
                                                                        rpool,
                                                                        one_cluster_id)

                STDOUT.puts "\n    OpenNebula host \e[92m#{cluster[:cluster_name]}\e[39m with"\
                            " ID \e[94m#{one_host.id}\e[39m successfully created."
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
        if dpool.respond_to?(:message)
            raise "Could not get OpenNebula DatastorePool: #{dpool.message}"
        end
        ipool = VCenterDriver::VIHelper.one_pool(OpenNebula::ImagePool)
        if ipool.respond_to?(:message)
            raise "Could not get OpenNebula ImagePool: #{ipool.message}"
        end
        npool = VCenterDriver::VIHelper.one_pool(OpenNebula::VirtualNetworkPool)
        if npool.respond_to?(:message)
            raise "Could not get OpenNebula VirtualNetworkPool: #{npool.message}"
        end
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool)
        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        # Get vcenter intance uuid as moref is unique for each vcenter
        vc_uuid = vi_client.vim.serviceContent.about.instanceUuid

        # Init vars
        allocated_images  = []
        allocated_nets    = []
        one_t             = nil
        template_copy_ref = nil

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
                                    "      - Name       : \e[92m#{t[:template_name]}\e[39m\n"\
                                    "      - Cluster    : \e[96m#{t[:cluster_name]}\e[39m\n"\
                                    "      - Location   : #{t[:template_location]}\n"\
                                    "    Import this VM template (y/[n])? "

                    next if STDIN.gets.strip.downcase != 'y'
                end

                allocated_images = []
                allocated_nets   = []

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
                                         " depending on the size of disks. \e[96mPlease wait...\e[39m\n"


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
                            STDOUT.print "\n    Delta disks are being created, \e[96please be patient...\e[39m"

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


                # Create template object
                one_t = VCenterDriver::VIHelper.new_one_item(OpenNebula::Template)

                rc = one_t.allocate(t[:one])

                if OpenNebula.is_error?(rc)
                    STDOUT.puts "    Error creating template: #{rc.message}\n"
                    template.delete_template if template_copy_ref
                    next
                end

                one_t.info

                ## Add existing disks to template (OPENNEBULA_MANAGED)

                STDOUT.print "\n    The existing disks and networks in the template"\
                             " are being imported, \e[96mplease be patient...\e[39m\n"

                template = t[:template] if !template


                type = {:object => "template", :id => one_t["ID"]}
                error, template_disks, allocated_images = template.import_vcenter_disks(vc_uuid,
                                                                                        dpool,
                                                                                        ipool,
                                                                                        type,
                                                                                        false)

                if error.empty?
                    t[:one] << template_disks
                else
                    STDOUT.puts error
                    # Rollback
                    template.delete_template if template_copy_ref
                    one_t.delete if one_t
                    one_t = nil
                    next
                end

                template_moref = template_copy_ref ? template_copy_ref : t[:vcenter_ref]

                wild = false # We are not importing from a Wild VM
                error, template_nics, allocated_nets = template.import_vcenter_nics(vc_uuid,
                                                                                    npool,
                                                                                    hpool,
                                                                                    options[:vcenter],
                                                                                    template_moref,
                                                                                    wild,
                                                                                    false,
                                                                                    template["name"],
                                                                                    one_t["ID"],
                                                                                    dc)

                if error.empty?
                    t[:one] << template_nics
                else
                    STDOUT.puts error
                    # Rollback
                    allocated_images.each do |i| i.delete end
                    allocated_images = []
                    template.delete_template if template_copy_ref
                    one_t.delete if one_t
                    one_t = nil
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

                rc = one_t.update(t[:one])

                if OpenNebula.is_error?(rc)
                    STDOUT.puts "    Error creating template: #{rc.message}\n"

                    # Rollback
                    template.delete_template if template_copy_ref
                    allocated_images.each do |i| i.delete end
                    allocated_images = []
                    allocated_nets.each do |n| n.delete end
                    allocated_nets = []
                    one_t.delete if one_t
                    one_t = nil
                else
                    STDOUT.puts "\n    OpenNebula template \e[92m#{t[:name]}\e[39m with ID \e[94m#{one_t.id}\e[39m created!\n"
                end
            }
        }
    rescue Interrupt => e
        puts "\n"
        exit 0 #Ctrl+C
    rescue Exception => e
        STDOUT.puts "There was an error trying to import a vcenter template: #{e.message}/\n#{e.backtrace}"

         # Rollback
        allocated_images.each do |i| i.delete end
        allocated_images = []
        allocated_nets.each do |n| n.delete end
        allocated_nets = []
        one_t.delete if one_t
        template.delete_template if template_copy_ref
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

        # Get OpenNebula's host pool
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)
        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        rs = dc_folder.get_unimported_networks(npool,options[:vcenter],hpool)

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
                if !use_defaults
                    message = false
                    print_str =  "\n  * Network found:\n"\
                                 "      - Name                        : \e[92m#{n[:name]}\e[39m\n"\
                                 "      - Type                        : #{n[:type]}\n"\
                                 "      - Vcenter Clusters(cluster id): "

                    unimported = ""
                    import = false

                    for i in 0..(n[:clusters][:refs].size-1)
                        if n[:clusters][:one_ids][i] != -1
                            import = true
                            print_str << "\e[96m#{n[:clusters][:names][i]}(#{n[:clusters][:one_ids][i]})\e[39m "
                        else
                            message = true
                            print_str << "\e[91m#{n[:clusters][:names][i]}\e[39m "
                            unimported << "#{n[:clusters][:names][i]} "
                        end
                    end

                    if !import
                        print_str << "\n    You need to at least 1 vcenter cluster as one host first!"
                    else
                        print_str << "\n    Import this Network (y/[n])? "
                    end

                    STDOUT.print print_str
                    next if STDIN.gets.strip.downcase != 'y' || !import
                end

                # we try to retrieve once we know the desired net
                net = VCenterDriver::Network.new_from_ref(n[:vcenter_net_ref], vi_client)
                vid = VCenterDriver::Network.retrieve_vlanid(net.item) if net

                if vid
                    vlanid = VCenterDriver::Network.vlanid(vid)

                    # we have vlan id
                    if /\A\d+\z/.match(vlanid)
                        n[:one] << "VCENTER_VLAN_ID=\"#{vlanid}\"\n"
                        STDOUT.print "      - vcenter vlan id = #{vlanid}\n"
                    end

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

                if !use_defaults && message
                    STDOUT.print "\n\e[93mWarning: you have unimported clusters for this network: #{unimported}\n"\
                                 "cancel this process(ctrl-C) if you want to import them first\e[39m\n\n"
                end

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
                                ",[E]thernet)?"

                    type_answer = STDIN.gets.strip
                    type_answer = "e" if type_answer.empty?
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
                opts_net = {
                    one_object: n[:one],
                    refs: n[:clusters][:refs],
                    one_ids: n[:clusters][:one_ids]
                }

                one_vn = VCenterDriver::Network.create_one_network(opts_net)

                STDOUT.puts "\n    OpenNebula virtual network \e[92m#{n[:import_name]}\e[39m " +
                            "with ID \e[94m#{one_vn.id}\e[39m !\n"
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

        # OpenNebula's HostPool
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)
        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        rs = dc_folder.get_unimported_datastores(dpool, options[:vcenter], hpool)

        STDOUT.print "done!\n"

        rs.each {|dc, tmps|
            if !use_defaults
                STDOUT.print "\nDo you want to process datacenter \e[95m#{dc}\e[39m (y/[n])? "

                next if STDIN.gets.strip.downcase != 'y'
            end

            if tmps.empty?
                STDOUT.print "    No new Datastores or StoragePods found in #{dc}...\n\n"
                next
            end

            tmps.each{ |d|
                if !use_defaults
                    datastore_str = "\n  * Datastore found:\n"\
                                    "      - Name                  : \e[92m#{d[:simple_name]}\e[39m\n"\
                                    "      - Total MB              : #{d[:total_mb]}\n"\
                                    "      - Free  MB              : #{d[:free_mb]}\n"\
                                    "      - OpenNebula Cluster IDs: #{d[:cluster].join(',')}\n"
                    if d[:cluster].empty?
                        datastore_str << "You need to import the associated vcenter cluster as one host first!"
                    else
                        datastore_str << "   Import this datastore [y/n]? "
                    end
                    STDOUT.print datastore_str

                    next if STDIN.gets.strip.downcase != 'y' || d[:cluster].empty?


                    STDOUT.print "\n    NOTE: For each vCenter datastore a SYSTEM and IMAGE datastore\n"\
                                 "    will be created in OpenNebula except for a StorageDRS which is \n"\
                                 "    represented as a SYSTEM datastore only.\n"

                end

                d[:ds].each do |ds|
                    one_d = VCenterDriver::VIHelper.new_one_item(OpenNebula::Datastore)
                    rc = one_d.allocate(ds[:one])
                    if ::OpenNebula.is_error?(rc)
                        STDOUT.puts "    \n    Error creating datastore: #{rc.message}"
                    else
                        # Update template with credentials
                        one = ""
                        one << "VCENTER_HOST=\"#{con_ops[:host]}\"\n"
                        one << "VCENTER_USER=\"#{con_ops[:user]}\"\n"
                        one << "VCENTER_PASSWORD=\"#{con_ops[:password]}\"\n"

                        rc = one_d.update(one,true)
                        if ::OpenNebula.is_error?(rc)
                            STDOUT.puts "    \n    Error updating datastore: \e[91m#{rc.message}\e[39m"
                        else
                            STDOUT.puts "    \n    OpenNebula datastore \e[92m#{d[:name]}\e[39m with ID \e[94m#{one_d.id}\e[39m created!\n"

                            # Let's add it to clusters
                            d[:cluster].each do |cid|
                                one_cluster = VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, cid.to_s, false)
                                if ::OpenNebula.is_error?(one_cluster)
                                    STDOUT.puts "    \n    Error retrieving cluster #{cid}: #{rc.message}"
                                end
                                rc = one_cluster.adddatastore(one_d.id)
                                if ::OpenNebula.is_error?(rc)
                                    STDOUT.puts "    \n    Error adding datastore #{one_d.id} to OpenNebula cluster #{cid}: #{rc.message}. You may have to place this datastore in the right cluster by hand"
                                end
                            end

                            if !d[:cluster].empty?
                                one_cluster = VCenterDriver::VIHelper.one_item(OpenNebula::Cluster, "0", false)
                                if ::OpenNebula.is_error?(one_cluster)
                                    STDOUT.puts "    \n    Error retrieving default cluster: #{rc.message}"
                                end
                                rc = one_cluster.deldatastore(one_d.id)
                                if ::OpenNebula.is_error?(rc)
                                    STDOUT.puts "    \n    Error removing datastore #{one_d.id} from default datastore."
                                end
                            end
                        end
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
        vc_uuid   = vi_client.vim.serviceContent.about.instanceUuid
        one_ds_instance_id = one_ds['TEMPLATE/VCENTER_INSTANCE_ID']

        if one_ds_instance_id != vc_uuid
            raise "Datastore is not in the same vCenter instance provided in credentials"
        end

        images = ds.get_images

        STDOUT.print "done!\n"

        images.each{ |i|

                if !use_defaults
                    STDOUT.print "\n  * Image found:\n"\
                                    "      - Name      : #{i[:name]}\n"\
                                    "      - Path      : #{i[:path]}\n"\
                                    "      - Type      : #{i[:type]}\n"\
                                    "      - Size (MB) : #{i[:size]}\n"\
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
