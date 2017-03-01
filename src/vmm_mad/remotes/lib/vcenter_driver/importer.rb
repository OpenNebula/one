module VCenterDriver

class Importer

def self.import_clusters(con_ops, options)
    begin
        STDOUT.print "\nConnecting to vCenter: #{options[:vcenter]}..."

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Exploring vCenter resources..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        # Get vcenter intance uuid as moref is unique for each vcenter
        vc_uuid = vi_client.vim.serviceContent.about.instanceUuid

        # Get vcenter API version
        vc_version = vi_client.vim.serviceContent.about.apiVersion

        rs = dc_folder.get_unimported_hosts

        STDOUT.print "done!\n\n"

        rs.each {|dc, clusters|
            STDOUT.print "Do you want to process datacenter #{dc} (y/[n])? "

            next if STDIN.gets.strip.downcase != 'y'

            if clusters.empty?
                STDOUT.puts "    No new clusters found in #{dc}..."
                next
            end

            clusters.each{ |cluster|
                STDOUT.print "  * Import cluster #{cluster[:cluster_name]} (y/[n])? "

                next if STDIN.gets.strip.downcase != 'y'

                one_host = VCenterDriver::ClusterComputeResource.to_one(cluster,
                                                                        con_ops)

                STDOUT.puts "    OpenNebula host #{cluster[:cluster_name]} with "\
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

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Looking for VM Templates..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        rs = dc_folder.get_unimported_templates(vi_client)

        STDOUT.print "done!\n"

        rs.each {|dc, tmps|
            STDOUT.print "\nDo you want to process datacenter #{dc}"\
                            " (y/[n])? "

            next if STDIN.gets.strip.downcase != 'y'

            if tmps.empty?
                STDOUT.print "    No new VM Templates found in #{dc}...\n\n"
                next
            end

            tmps.each{ |t|

                STDOUT.print "\n  * VM Template found:\n"\
                                "      - Name   : #{t[:name]}\n"\
                                "      - Moref  : #{t[:vcenter_ref]}\n"\
                                "      - Cluster: #{t[:cluster_name]}\n"\
                                "    Import this VM template (y/[n])? "

                next if STDIN.gets.strip.downcase != 'y'


                ds_input = ""

                STDOUT.print "\n    This template is currently set to be "\
                                "deployed in datastore #{t[:default_ds]}."\
                            "\n    Press y to keep the default, n to select"\
                            " a new default datastore or d to delegate "\
                            " the choice to the user ([y]/n/d)? "

                answer =  STDIN.gets.strip.downcase

                case answer
                when 'd'
                    ds_split     = t[:ds].split("|")
                    list_of_ds   = ds_split[-2]
                    default_ds   = ds_split[-1]
                    ds_input     = ds_split[0] + "|" + ds_split[1] + "|" +
                                    ds_split[2] + "|"

                    # Available list of datastores

                    input_str = "    The list of available datastores to be"\
                                " presented to the user are \"#{list_of_ds}\""
                    input_str+= "\n    Press y to agree, or input a comma"\
                                " separated list of datastores to edit "\
                                "[y/comma separated list] "
                    STDOUT.print input_str

                    answer = STDIN.gets.strip

                    if answer.downcase == 'y'
                        ds_input += ds_split[3] + "|"
                    else
                        ds_input += answer + "|"
                    end

                    # Default
                    input_str   = "    The default datastore presented to "\
                                "the end user is set to \"#{default_ds}\"."
                    input_str+= "\n    Press y to agree, or input a new "\
                                "datastore [y/datastore name] "
                    STDOUT.print input_str

                    answer = STDIN.gets.strip

                    if answer.downcase == 'y'
                        ds_input += ds_split[4]
                    else
                        ds_input += answer
                    end
                when 'n'
                    ds_split     = t[:ds].split("|")
                    list_of_ds   = ds_split[-2]

                    input_str = "    The list of available datastores is:\n"

                    STDOUT.print input_str

                    dashes = ""
                    100.times do
                        dashes << "-"
                    end

                    list_str = "\n    [Index] Datastore :"\
                                "\n    #{dashes}\n"

                    STDOUT.print list_str

                    index = 1
                    t[:ds_list].each do |ds|
                        list_str = "    [#{index}] #{ds[:name]}\n"
                        index += 1
                        STDOUT.print list_str
                    end

                    input_str = "\n    Please input the new default"\
                                " datastore index in the list (e.g 1): "

                    STDOUT.print input_str

                    answer = STDIN.gets.strip

                    t[:one] += "VCENTER_DS_REF=\"#{t[:ds_list][answer.to_i - 1][:ref]}\"\n"
                end

                # Resource Pools
                rp_input = ""
                rp_split = t[:rp].split("|")

                if rp_split.size > 3
                    STDOUT.print "\n    This template is currently set to "\
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
                                    "[y/comma separated list] "
                        STDOUT.print input_str

                        answer = STDIN.gets.strip

                        if answer.downcase == 'y'
                            rp_input += rp_split[3] + "|"
                        else
                            rp_input += answer + "|"
                        end

                        # Default
                        input_str   = "    The default resource pool presented "\
                                        "to the end user is set to"\
                                        " \"#{default_rp}\"."
                        input_str+= "\n    Press y to agree, or input a new "\
                                    "resource pool [y/resource pool name] "
                        STDOUT.print input_str

                        answer = STDIN.gets.strip

                        if answer.downcase == 'y'
                            rp_input += rp_split[4]
                        else
                            rp_input += answer
                        end
                    when 'n'

                        list_of_rp   = rp_split[-2]

                        input_str = "    The list of available resource pools is:\n"

                        STDOUT.print input_str

                        dashes = ""
                        100.times do
                            dashes << "-"
                        end

                        list_str = "\n    [Index] Resource pool :"\
                                    "\n    #{dashes}\n"

                        STDOUT.print list_str

                        index = 1
                        t[:rp_list].each do |rp|
                            list_str = "    [#{index}] #{rp[:name]}\n"
                            index += 1
                            STDOUT.print list_str
                        end

                        input_str = "\n    Please input the new default"\
                                    " resource pool index in the list (e.g 1): "

                        STDOUT.print input_str

                        answer = STDIN.gets.strip

                        t[:one] << "VCENTER_RP_REF=\"#{t[:rp_list][answer.to_i - 1][:ref]}\"\n"
                    end
                end

                if !ds_input.empty? || !rp_input.empty?
                    t[:one] << "USER_INPUTS=["
                    t[:one] << "VCENTER_DS_LIST=\"#{ds_input}\"," if !ds_input.empty?
                    t[:one] << "VCENTER_RP_LIST=\"#{rp_input}\"," if !rp_input.empty?
                    t[:one] = t[:one][0..-2]
                    t[:one] << "]"
                end

                one_t = VCenterDriver::VIHelper.new_one_item(OpenNebula::Template)

                rc = one_t.allocate(t[:one])

                if ::OpenNebula.is_error?(rc)
                    STDOUT.puts "    Error creating template: #{rc.message}\n"
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

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Looking for vCenter networks..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        rs = dc_folder.get_unimported_networks

        STDOUT.print "done!\n"

        rs.each {|dc, tmps|
            STDOUT.print "\nDo you want to process datacenter #{dc} [y/n]? "

            next if STDIN.gets.strip.downcase != 'y'

            if tmps.empty?
                STDOUT.print "    No new Networks found in #{dc}...\n\n"
                next
            end

            tmps.each do |n|
                print_str =  "\n  * Network found:\n"\
                                "      - Name    : #{n[:name]}\n"\
                                "      - Type    : #{n[:type]}\n"
                print_str << "      - VLAN ID : #{n[:vlan_id]}\n" if !n[:vlan_id].empty?
                print_str << "      - Cluster : #{n[:cluster]}\n"
                print_str << "    Import this Network (y/[n])? "

                STDOUT.print print_str

                next if STDIN.gets.strip.downcase != 'y'

                size="255"
                ar_type=nil
                first_ip=nil
                first_mac=nil
                global_prefix=nil
                ula_prefix=nil

                # Size
                STDOUT.print "    How many VMs are you planning"\
                            " to fit into this network [255]? "
                size_answer = STDIN.gets.strip
                if !size_answer.empty?
                    size = size_answer.to_i.to_s rescue "255"
                end

                # Type
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

                    STDOUT.print "    Please input the GLOBAL PREFIX "\
                                    "[Enter for default]: "
                    gp_answer = STDIN.gets.strip
                    global_prefix = gp_answer if !gp_answer.empty?

                    STDOUT.print "    Please input the ULA PREFIX "\
                                    "[Enter for default]: "
                    ula_answer = STDIN.gets.strip
                    ula_prefix = ula_answer if !ula_answer.empty?
                when "e"
                    STDOUT.print "    Please input the first MAC "\
                            "in the range [Enter for default]: "
                    mac_answer = STDIN.gets.strip
                    first_mac = first_mac_answer if !mac_answer.empty?
                end

                ar_str =  "\nAR=[TYPE=\""

                case ar_type
                when "4"
                    ar_str << "IP4\""
                    ar_str << ",IP=" + first_ip if first_ip
                    ar_str << ",MAC=" + first_mac if first_mac
                when "6"
                    ar_str << "IP6\""
                    ar_str << ",MAC=" + first_mac if first_mac
                    ar_str << ",GLOBAL_PREFIX=" + global_prefix if global_prefix
                    ar_str << ",ULA_PREFIX=" + ula_prefix if ula_prefix?
                when "e"
                    ar_str << "ETHER\""
                    ar_str << ",MAC=" + first_mac if first_mac
                end

                ar_str << ",SIZE = \"#{size}\"]"

                n[:one] << ar_str

                one_vn = VCenterDriver::VIHelper.new_one_item(OpenNebula::VirtualNetwork)

                rc = one_vn.allocate(n[:one])

                if ::OpenNebula.is_error?(rc)
                    STDOUT.puts "    Error creating virtual network: " +
                                " #{rc.message}\n"
                else
                    STDOUT.puts "    OpenNebula virtual network " +
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

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Looking for Datastores..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        rs = dc_folder.get_unimported_datastores

        STDOUT.print "done!\n"

        rs.each {|dc, tmps|
            STDOUT.print "\nDo you want to process datacenter #{dc} (y/[n])? "

            next if STDIN.gets.strip.downcase != 'y'

            if tmps.empty?
                STDOUT.print "    No new Datastores or StoragePods found in #{dc}...\n\n"
                next
            end

            tmps.each{ |d|
                STDOUT.print "\n  * Datastore found:\n"\
                                "      - Name      : #{d[:name]}\n"\
                                "      - Total MB  : #{d[:total_mb]}\n"\
                                "      - Free  MB  : #{d[:free_mb]}\n"\
                                "      - Cluster   : #{d[:cluster]}\n"\
                                "    Import this as Datastore [y/n]? "

                next if STDIN.gets.strip.downcase != 'y'

                one_d = VCenterDriver::VIHelper.new_one_item(OpenNebula::Datastore)

                rc = one_d.allocate(d[:one])

                if ::OpenNebula.is_error?(rc)
                    STDOUT.puts "    Error creating datastore: #{rc.message}\n"\
                                "    One datastore can exist only once, and "\
                                "can be used in any vCenter Cluster that "\
                                "has access to it. Also, no spaces allowed "\
                                "in datastore name (rename it in vCenter "\
                                "and try again)"
                else
                    STDOUT.puts "    OpenNebula datastore #{one_d.id} created!\n"
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

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Looking for Images..."

        one_ds = VCenterDriver::VIHelper.find_by_name(OpenNebula::DatastorePool,
                                                        ds_name)
        one_ds_ref = one_ds['TEMPLATE/VCENTER_DS_REF']

        ds = VCenterDriver::Datastore.new_from_ref(one_ds_ref, vi_client)

        vcenter_uuid = vi_client.vim.serviceContent.about.instanceUuid

        images = ds.get_images(vcenter_uuid)

        STDOUT.print "done!\n"

        images.each{ |i|
                STDOUT.print "\n  * Image found:\n"\
                                "      - Name      : #{i[:name]}\n"\
                                "      - Path      : #{i[:path]}\n"\
                                "      - Type      : #{i[:type]}\n"\
                                "    Import this Image (y/[n])? "

                next if STDIN.gets.strip.downcase != 'y'

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