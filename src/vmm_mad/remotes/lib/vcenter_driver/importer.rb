# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

module VCenterDriver
class Importer

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

        vcenter_vm = VCenterDriver::VirtualMachine.new_without_id(vi_client, vm_ref)
        vm_name    = vcenter_vm["name"]

        type = {:object => "VM", :id => vm_name}
        error, template_disks = vcenter_vm.import_vcenter_disks(vc_uuid, dpool, ipool, type)
        return OpenNebula::Error.new(error) if !error.empty?

        template << template_disks

        # Create images or get nics information for template
        error, template_nics, ar_ids = vcenter_vm
                                       .import_vcenter_nics(vc_uuid,
                                                            npool,
                                                            hpool,
                                                            vc_name,
                                                            vm_ref)

        if !error.empty?
            if !ar_ids.nil?
                ar_ids.each do |key, value|
                    network = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualNetworkPool,"TEMPLATE/VCENTER_NET_REF", key, vc_uuid, npool)
                    value.each do |ar|
                        network.rm_ar(ar)
                    end
                end
            end
            return OpenNebula::Error.new(error) if !error.empty?
        end

        template << template_nics
        template << "VCENTER_ESX_HOST = #{vcenter_vm["runtime.host.name"].to_s}\n"

        # Get DS_ID for the deployment, the wild VM needs a System DS
        dc_ref = vcenter_vm.get_dc.item._ref
        ds_ref = template.match(/^VCENTER_DS_REF *= *"(.*)" *$/)[1]

        ds_one = dpool.select do |e|
            e["TEMPLATE/TYPE"]                == "SYSTEM_DS" &&
            e["TEMPLATE/VCENTER_DS_REF"]      == ds_ref &&
            e["TEMPLATE/VCENTER_DC_REF"]      == dc_ref &&
            e["TEMPLATE/VCENTER_INSTANCE_ID"] == vc_uuid
        end.first

        if !ds_one
            if !ar_ids.nil?
                ar_ids.each do |key, value|
                    network = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualNetworkPool,"TEMPLATE/VCENTER_NET_REF", key, vc_uuid, npool)
                    value.each do |ar|
                        network.rm_ar(ar)
                    end
                end
            end
            return OpenNebula::Error.new("DS with ref #{ds_ref} is not imported in OpenNebula, aborting Wild VM import.")
        end

        rc = one_vm.allocate(template)
        if OpenNebula.is_error?(rc)
            if !ar_ids.nil?
                ar_ids.each do |key, value|
                    network = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualNetworkPool,"TEMPLATE/VCENTER_NET_REF", key, vc_uuid, npool)
                    value.each do |ar|
                        network.rm_ar(ar)
                    end
                end
            end
            return rc
        end

        rc = one_vm.deploy(host_id, false, ds_one.id)
        if OpenNebula.is_error?(rc)
            if !ar_ids.nil?
                ar_ids.each do |key, value|
                    network = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualNetworkPool,"TEMPLATE/VCENTER_NET_REF", key, vc_uuid, npool)
                    value.each do |ar|
                        network.rm_ar(ar)
                    end
                end
            end
            return rc
        end

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

end # Importer

end # module VCenterDriver
