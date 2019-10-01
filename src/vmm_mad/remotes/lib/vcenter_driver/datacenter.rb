# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'set'
require 'digest'

module VCenterDriver

class DatacenterFolder

    attr_accessor :items

    def initialize(vi_client)
        @vi_client = vi_client
        @items = {}
    end

    ########################################################################
    # Builds a hash with Datacenter-Ref / Datacenter to be used as a cache
    # @return [Hash] in the form
    #   { dc_ref [Symbol] => Datacenter object }
    ########################################################################
    def fetch!
        VIClient.get_entities(@vi_client.vim.root, 'Datacenter').each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = Datacenter.new(item)
        end
    end

    ########################################################################
    # Returns a Datacenter. Uses the cache if available.
    # @param ref [Symbol] the vcenter ref
    # @return Datacenter
    ########################################################################
    def get(ref)
        if !@items[ref.to_sym]
            rbvmomi_dc = RbVmomi::VIM::Datacenter.new(@vi_client.vim, ref)
            @items[ref.to_sym] = Datacenter.new(rbvmomi_dc)
        end

        @items[ref.to_sym]
    end

    def get_vcenter_instance_uuid
        @vi_client.vim.serviceContent.about.instanceUuid
    end

    def get_vcenter_api_version
        @vi_client.vim.serviceContent.about.apiVersion
    end

    def get_unimported_hosts(hpool, vcenter_instance_name)
        host_objects = {}

        vcenter_uuid = get_vcenter_instance_uuid
        vcenter_version = get_vcenter_api_version

        fetch! if @items.empty? # Get datacenters

        # Loop through datacenters
        @items.values.each do |dc|
            dc_name = dc.item.name
            host_objects[dc_name] = []

            # Get clusters inside a datacenter
            host_folder = dc.host_folder
            host_folder.fetch_clusters!
            host_folder.items.values.each do |ccr|

                # Check if the cluster is a host in OpenNebula's pool
                one_host = VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                               "TEMPLATE/VCENTER_CCR_REF",
                                                               ccr['_ref'],
                                                               vcenter_uuid,
                                                               hpool)
                next if one_host

                # Get a ClusterComputeResource object
                cluster = VCenterDriver::ClusterComputeResource.new_from_ref(ccr['_ref'], @vi_client)

                # Obtain a list of resource pools found in the cluster
                rpools = cluster.get_resource_pool_list.select {|rp| !rp[:name].empty?}

                # Determine a host location (folder and subfolders)
                item = cluster.item
                folders = []
                while !item.instance_of? RbVmomi::VIM::Datacenter
                    item = item.parent
                    if !item.instance_of? RbVmomi::VIM::Datacenter
                        folders << item.name if item.name != "host"
                    end
                    raise "Could not find the host's location" if item.nil?
                end
                location   = folders.reverse.join("/")
                location = "/" if location.empty?

                # Setting host import name and replace spaces and weird characters
                cluster_name = "#{ccr['name']}".tr(" ", "_")
                cluster_name = VCenterDriver::VIHelper.one_name(OpenNebula::HostPool, cluster_name, ccr['_ref']+vcenter_uuid, hpool)


                # Prepare hash for import tool
                host_info = {}
                host_info[:simple_name]      = ccr['name']
                host_info[:cluster_name]     = cluster_name
                host_info[:cluster_ref]      = ccr['_ref']
                host_info[:cluster_location] = location
                host_info[:vcenter_uuid]     = vcenter_uuid
                host_info[:vcenter_version]  = vcenter_version
                host_info[:rp_list]          = rpools

                # Add the hash to current datacenter
                host_objects[dc_name] << host_info
            end
        end

        return host_objects
    end

    def get_unimported_datastores(dpool, vcenter_instance_name, hpool)

        import_id = 0
        ds_objects = {}
        vcenter_uuid = get_vcenter_instance_uuid

        #Get datacenters
        fetch! if @items.empty?

        @items.values.each do |dc|
            clusters_in_ds = {}
            dc_name = dc.item.name
            dc_ref  = dc.item._ref

            datastore_folder = dc.datastore_folder
            datastore_folder.fetch!

            datastore_folder.items.values.each do |ds|

                name, capacity, freeSpace = ds.item.collect("name", "summary.capacity", "summary.freeSpace")

                ds_name     = "#{name}"
                ds_total_mb = ((capacity.to_i / 1024) / 1024)
                ds_free_mb  = ((freeSpace.to_i / 1024) / 1024)
                ds_ref      = ds['_ref']

                ds_objects[ds_ref] = {}
                ds_objects[ds_ref][:ref]         = ds_ref
                ds_objects[ds_ref][:import_id]   = import_id
                ds_objects[ds_ref][:datacenter]  = dc_name
                ds_objects[ds_ref][:simple_name] = "#{ds_name}"
                ds_objects[ds_ref][:total_mb]    = ds_total_mb
                ds_objects[ds_ref][:free_mb]     = ds_free_mb
                ds_objects[ds_ref][:ds]          = []
                ds_objects[ds_ref][:cluster]     = []

                if ds.instance_of? VCenterDriver::Datastore
                    hosts = ds["host"]
                    hosts.each do |host|
                        cluster_ref = host.key.parent._ref
                        if !clusters_in_ds.key?(cluster_ref)
                            clusters_in_ds[cluster_ref] = nil

                            # Try to locate cluster ref in host's pool
                            one_cluster = VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                               "TEMPLATE/VCENTER_CCR_REF",
                                                               cluster_ref,
                                                               vcenter_uuid,
                                                               hpool)
                            if one_cluster
                                ds_objects[ds_ref][:cluster] << one_cluster["CLUSTER_ID"].to_i
                                clusters_in_ds[cluster_ref] = one_cluster["CLUSTER_ID"].to_i
                            end
                        else
                            ds_objects[ds_ref][:cluster] << clusters_in_ds[cluster_ref] if clusters_in_ds[cluster_ref] && !ds_objects[ds_ref][:cluster].include?(clusters_in_ds[cluster_ref])
                        end
                    end

                    already_image_ds = VCenterDriver::Storage.exists_one_by_ref_dc_and_type?(ds_ref, dc_ref, vcenter_uuid, "IMAGE_DS", dpool)

                    key = ds_ref+vcenter_uuid
                    if !already_image_ds
                        ds_objects[ds_ref][:name] = VCenterDriver::VIHelper.one_name(OpenNebula::DatastorePool, "#{ds_name}(IMG)", key)
                        object = ds.to_one_template(ds_objects[ds_ref], vcenter_uuid, dc_name, dc_ref, "IMAGE_DS")
                        ds_objects[ds_ref][:ds] << object if !object.nil?
                    end

                    already_system_ds = VCenterDriver::Storage.exists_one_by_ref_dc_and_type?(ds_ref, dc_ref, vcenter_uuid, "SYSTEM_DS", dpool)

                    if !already_system_ds
                        ds_objects[ds_ref][:name] = VCenterDriver::VIHelper.one_name(OpenNebula::DatastorePool, "#{ds_name}(SYS)", key)
                        object = ds.to_one_template(ds_objects[ds_ref], vcenter_uuid, dc_name, dc_ref, "SYSTEM_DS")
                        ds_objects[ds_ref][:ds] << object if !object.nil?
                    end

                    ds_objects[ds_ref][:name] = "#{ds_name}"
                elsif ds.instance_of? VCenterDriver::StoragePod
                    ds['children'].each do |sp_ds|
                        hosts = sp_ds.host
                        hosts.each do |host|
                            cluster_ref = host.key.parent._ref
                            if !clusters_in_ds.include?(cluster_ref)
                                clusters_in_ds[cluster_ref] = nil
                                # Try to locate cluster ref in cluster's pool
                                one_cluster = VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                                "TEMPLATE/VCENTER_CCR_REF",
                                                                cluster_ref,
                                                                vcenter_uuid,
                                                                hpool)
                                if one_cluster
                                    ds_objects[ds_ref][:cluster] << one_cluster["CLUSTER_ID"].to_i
                                    clusters_in_ds[cluster_ref] = one_cluster["CLUSTER_ID"].to_i
                                end
                            else
                                ds_objects[ds_ref][:cluster] << clusters_in_ds[cluster_ref] if clusters_in_ds[cluster_ref] && !ds_objects[ds_ref][:cluster].include?(clusters_in_ds[cluster_ref])
                            end
                        end
                    end

                    already_system_ds = VCenterDriver::Storage.exists_one_by_ref_dc_and_type?(ds_ref, dc_ref, vcenter_uuid, "SYSTEM_DS", dpool)

                    if !already_system_ds
                        ds_objects[ds_ref][:name] = "#{ds_name} [#{vcenter_instance_name} - #{dc_name}] (StorDRS)"
                        object = ds.to_one_template(ds_objects[ds_ref], vcenter_uuid, dc_name, dc_ref, "SYSTEM_DS")
                        ds_objects[ds_ref][:ds] << object if !object.nil?
                    end
                end

                if ds_objects[ds_ref][:ds].empty?
                    ds_objects.delete(ds_ref)
                else
                    import_id += 1
                end

            end
        end

        { vcenter_instance_name => ds_objects }
    end

    def get_unimported_templates(vi_client, tpool)
        template_objects = {}
        import_id = 0
        vcenter_uuid = get_vcenter_instance_uuid

        vcenter_instance_name = vi_client.vim.host

        fetch! if @items.empty? #Get datacenters

        @items.values.each do |dc|
            rp_cache = {}
            dc_name = dc.item.name

            view = vi_client.vim.serviceContent.viewManager.CreateContainerView({
                container: dc.item.vmFolder,
                type:      ['VirtualMachine'],
                recursive: true
            })

            pc = vi_client.vim.serviceContent.propertyCollector

            filterSpec = RbVmomi::VIM.PropertyFilterSpec(
            :objectSet => [
                :obj => view,
                :skip => true,
                :selectSet => [
                RbVmomi::VIM.TraversalSpec(
                    :name => 'traverseEntities',
                    :type => 'ContainerView',
                    :path => 'view',
                    :skip => false
                )
                ]
            ],
            :propSet => [
                { :type => 'VirtualMachine', :pathSet => ['config.template'] }
            ]
            )

            result = pc.RetrieveProperties(:specSet => [filterSpec])

            vms = {}
                result.each do |r|
                vms[r.obj._ref] = r.to_hash if r.obj.is_a?(RbVmomi::VIM::VirtualMachine)
            end
            templates = []
            vms.each do |ref,value|
                if value["config.template"]
                    templates << VCenterDriver::Template.new_from_ref(ref, vi_client)
                end
            end

            view.DestroyView # Destroy the view

            templates.each do |template|

                tref      = template['_ref']
                next if template_objects[tref]

                one_template = VCenterDriver::VIHelper.find_by_ref(OpenNebula::TemplatePool,
                                                                   "TEMPLATE/VCENTER_TEMPLATE_REF",
                                                                   template['_ref'],
                                                                   vcenter_uuid,
                                                                   tpool)

                next if one_template #If the template has been already imported

                one_template = VCenterDriver::Template.get_xml_template(template, vcenter_uuid, vi_client, vcenter_instance_name, dc_name, rp_cache)

                if !!one_template
                    one_template[:import_id] = import_id
                    one_template[:vcenter] = vcenter_instance_name
                    import_id += 1
                    template_objects[tref] = one_template
                end
            end
        end

        { vcenter_instance_name => template_objects }
    end

    def get_unimported_networks(npool,vcenter_instance_name, hpool)
        vcenter_uuid = get_vcenter_instance_uuid
        pc = @vi_client.vim.serviceContent.propertyCollector

        #Get all port groups and distributed port groups in vcenter instance
        view = @vi_client.vim.serviceContent.viewManager.CreateContainerView({
                container: @vi_client.vim.rootFolder,
                type:      ['Network','DistributedVirtualPortgroup','OpaqueNetwork'],
                recursive: true
        })

        filterSpec = RbVmomi::VIM.PropertyFilterSpec(
            :objectSet => [
                :obj => view,
                :skip => true,
                :selectSet => [
                RbVmomi::VIM.TraversalSpec(
                    :name => 'traverseEntities',
                    :type => 'ContainerView',
                    :path => 'view',
                    :skip => false
                )
                ]
            ],
            :propSet => [
                { :type => 'Network', :pathSet => ['name'] },
                { :type => 'DistributedVirtualPortgroup', :pathSet => ['name'] },
                { :type => 'OpaqueNetwork', :pathSet => ['name'] }
            ]
        )
        result = pc.RetrieveProperties(:specSet => [filterSpec])

        networks = {}
        result.each do |r|
            exist = VCenterDriver::VIHelper.find_by_ref(OpenNebula::VirtualNetworkPool,
                    "TEMPLATE/VCENTER_NET_REF",
                    r.obj._ref,
                    vcenter_uuid,
                    npool)

            next if exist

            networks[r.obj._ref] = r.to_hash if r.obj.is_a?(RbVmomi::VIM::DistributedVirtualPortgroup) || r.obj.is_a?(RbVmomi::VIM::Network) || r.obj.is_a?(RbVmomi::VIM::OpaqueNetwork)

            if r.obj.is_a?(RbVmomi::VIM::DistributedVirtualPortgroup)
                # Here can be NETWORK_TYPE_DPG or NETWORK_TYPE_NSXV
                if r['name'].match(/^vxw-dvs-(.*)-virtualwire-(.*)-sid-(.*)/)
                    networks[r.obj._ref][:network_type] = VCenterDriver::Network::NETWORK_TYPE_NSXV
                else
                    networks[r.obj._ref][:network_type] = VCenterDriver::Network::NETWORK_TYPE_DPG
                end
            elsif r.obj.is_a?(RbVmomi::VIM::OpaqueNetwork)
                networks[r.obj._ref][:network_type] = VCenterDriver::Network::NETWORK_TYPE_NSXT
            elsif r.obj.is_a?(RbVmomi::VIM::Network)
                networks[r.obj._ref][:network_type] = VCenterDriver::Network::NETWORK_TYPE_PG
            else
                networks[r.obj._ref][:network_type] = VCenterDriver::Network::NETWORK_TYPE_UNKNOWN
            end
            networks[r.obj._ref][:uplink] = false
            networks[r.obj._ref][:processed] = false

            #Multicluster nets support
            networks[r.obj._ref][:clusters] = {}
            networks[r.obj._ref][:clusters][:refs] = []
            networks[r.obj._ref][:clusters][:one_ids] = []
            networks[r.obj._ref][:clusters][:names] = []
        end
        view.DestroyView # Destroy the view

        #Get datacenters
        fetch! if @items.empty?

        #Iterate over datacenters
        @items.values.each do |dc|
            dc_name = dc.item.name
            view = @vi_client.vim.serviceContent.viewManager.CreateContainerView({
                container: dc.item,
                type:      ['ClusterComputeResource'],
                recursive: true
            })

            filterSpec = RbVmomi::VIM.PropertyFilterSpec(
                :objectSet => [
                    :obj => view,
                    :skip => true,
                    :selectSet => [
                    RbVmomi::VIM.TraversalSpec(
                        :name => 'traverseEntities',
                        :type => 'ContainerView',
                        :path => 'view',
                        :skip => false
                    )
                    ]
                ],
                :propSet => [
                    { :type => 'ClusterComputeResource', :pathSet => ['name','network'] }
                ]
            )

            result = pc.RetrieveProperties(:specSet => [filterSpec])

            clusters = {}
            result.each do |r|
                browser = r.obj.environmentBrowser || nil
                if browser
                    browser.QueryConfigTarget.distributedVirtualPortgroup.each do |s|
                        next if !networks.key?(s.portgroupKey) || networks[s.portgroupKey][:processed]

                        networks[s.portgroupKey][:uplink] = s.uplinkPortgroup
                        networks[s.portgroupKey][:processed] = true
                    end
                end
                clusters[r.obj._ref] = r.to_hash if r.obj.is_a?(RbVmomi::VIM::ClusterComputeResource)
            end

            view.DestroyView # Destroy the view

            #general net_info related to datacenter
            opts = {}
            opts[:vcenter_uuid]           = vcenter_uuid
            opts[:vcenter_instance_name]  = vcenter_instance_name
            opts[:dc_name]                = dc_name

            clusters.each do |ref, info|
                one_host = VCenterDriver::VIHelper.find_by_ref(OpenNebula::HostPool,
                                                               "TEMPLATE/VCENTER_CCR_REF",
                                                               ref,
                                                               vcenter_uuid,
                                                               hpool)

                if !one_host || !one_host['CLUSTER_ID']
                    cluster_id = -1
                else
                    cluster_id = one_host['CLUSTER_ID']
                end

                one_cluster = VCenterDriver::ClusterComputeResource.new_from_ref(ref, @vi_client)
                location = VCenterDriver::VIHelper.get_location(one_cluster.item)

                network_obj = info['network']
                cname = info['name']

                network_obj.each do |n|
                    network_ref  = n._ref

                    next unless networks[network_ref]

                    if !networks[network_ref][:uplink]

                        # network can belong to more than 1 cluster
                        networks[network_ref][:clusters][:refs] << ref
                        networks[network_ref][:clusters][:one_ids] << cluster_id.to_i
                        networks[network_ref][:clusters][:names] << cname
                        networks[network_ref][:vcenter] = vcenter_instance_name

                        next if networks[network_ref][:clusters][:refs].size > 1

                        opts[:network_name] = networks[network_ref]['name']
                        opts[:network_ref]  = network_ref
                        opts[:network_type] = networks[network_ref][:network_type]

                        networks[network_ref] = networks[network_ref].merge(VCenterDriver::Network.to_one_template(opts))
                    else
                        networks.delete(network_ref)
                    end

                end #networks loop
            end #clusters loop
        end # datacenters loop

        imid = -1
        networks.map{ |k,v| v[:import_id] = imid += 1 }

        { vcenter_instance_name => networks }
    end

end # class DatatacenterFolder

class Datacenter
    attr_accessor :item

    DPG_CREATE_TIMEOUT = 240

    def initialize(item, vi_client=nil)

        check_item(item, RbVmomi::VIM::Datacenter)

        @vi_client = vi_client
        @item = item
        @net_rollback = []
        @locking = true
    end

    def datastore_folder
        DatastoreFolder.new(@item.datastoreFolder)
    end

    def host_folder
        HostFolder.new(@item.hostFolder)
    end

    def vm_folder
        VirtualMachineFolder.new(@item.vmFolder)
    end

    def network_folder
        NetworkFolder.new(@item.networkFolder)
    end

    # Locking function. Similar to flock
    def lock
        hostlockname = @item['name'].downcase.tr(" ", "_")
        if @locking
           @locking_file = File.open("/tmp/vcenter-dc-#{hostlockname}-lock","w")
           @locking_file.flock(File::LOCK_EX)
        end
    end

    # Unlock driver execution mutex
    def unlock
        if @locking
            @locking_file.close
        end
    end

    ########################################################################
    # Check if distributed virtual switch exists in host
    ########################################################################
    def dvs_exists(switch_name, net_folder)

        return net_folder.items.values.select{ |dvs|
            dvs.instance_of?(VCenterDriver::DistributedVirtualSwitch) &&
            dvs['name'] == switch_name
        }.first rescue nil
    end

    ########################################################################
    # Is the distributed switch for the distributed pg different?
    ########################################################################
    def pg_changes_sw?(dpg, switch_name)
        return dpg['config.distributedVirtualSwitch.name'] != switch_name
    end

    ########################################################################
    # Create a distributed vcenter switch in a datacenter
    ########################################################################
    def create_dvs(switch_name, pnics, mtu=1500)
        # Prepare spec for DVS creation
        spec = RbVmomi::VIM::DVSCreateSpec.new
        spec.configSpec = RbVmomi::VIM::VMwareDVSConfigSpec.new
        spec.configSpec.name = switch_name

        # Specify number of uplinks port for dpg
        if pnics
            pnics = pnics.split(",")
            if !pnics.empty?
                spec.configSpec.uplinkPortPolicy = RbVmomi::VIM::DVSNameArrayUplinkPortPolicy.new
                spec.configSpec.uplinkPortPolicy.uplinkPortName = []
                (0..pnics.size-1).each { |index|
                    spec.configSpec.uplinkPortPolicy.uplinkPortName[index]="dvUplink#{index+1}"
                }
            end
        end

        #Set maximum MTU
        spec.configSpec.maxMtu = mtu

        # The DVS must be created in the networkFolder of the datacenter
        begin
            dvs_creation_task = @item.networkFolder.CreateDVS_Task(:spec => spec)
            dvs_creation_task.wait_for_completion

            # If task finished successfuly we rename the uplink portgroup
            dvs = nil
            if dvs_creation_task.info.state == 'success'
                dvs = dvs_creation_task.info.result
                dvs.config.uplinkPortgroup[0].Rename_Task(:newName => "#{switch_name}-uplink-pg").wait_for_completion
            else
                raise "The Distributed vSwitch #{switch_name} could not be created. "
            end
        rescue Exception => e
            raise e
        end

        @net_rollback << {:action => :delete_dvs, :dvs => dvs, :name => switch_name}

        return VCenterDriver::DistributedVirtualSwitch.new(dvs, @vi_client)
    end

    ########################################################################
    # Update a distributed vcenter switch
    ########################################################################
    def update_dvs(dvs, pnics, mtu)
        # Prepare spec for DVS creation
        spec = RbVmomi::VIM::VMwareDVSConfigSpec.new
        changed = false

        orig_spec = RbVmomi::VIM::VMwareDVSConfigSpec.new
        orig_spec.maxMtu = dvs['config.maxMtu']
        orig_spec.uplinkPortPolicy = RbVmomi::VIM::DVSNameArrayUplinkPortPolicy.new
        orig_spec.uplinkPortPolicy.uplinkPortName = []
        (0..dvs['config.uplinkPortgroup'].length-1).each { |index|
                orig_spec.uplinkPortPolicy.uplinkPortName[index]="dvUplink#{index+1}"
        }

        # Add more uplinks to default uplink port group according to number of pnics
        if pnics
            pnics = pnics.split(",")
            if !pnics.empty? && dvs['config.uplinkPortgroup'].length != pnics.size
                spec.uplinkPortPolicy = RbVmomi::VIM::DVSNameArrayUplinkPortPolicy.new
                spec.uplinkPortPolicy.uplinkPortName = []
                (dvs['config.uplinkPortgroup'].length..num_pnics-1).each { |index|
                    spec.uplinkPortPolicy.uplinkPortName[index]="dvUplink#{index+1}"
                }
                changed = true
            end
        end

        #Set maximum MTU
        if mtu != dvs['config.maxMtu']
            spec.maxMtu = mtu
            changed = true
        end

        # The DVS must be created in the networkFolder of the datacenter
        if changed
            spec.configVersion = dvs['config.configVersion']

            begin
                dvs.item.ReconfigureDvs_Task(:spec => spec).wait_for_completion
            rescue Exception => e
                raise "The Distributed switch #{dvs['name']} could not be updated. "\
                      "Reason: #{e.message}"
            end

            @net_rollback << {:action => :update_dvs, :dvs => dvs.item, :name => dvs['name'], :spec => orig_spec}
        end
    end

    ########################################################################
    # Remove a distributed vcenter switch in a datacenter
    ########################################################################
    def remove_dvs(dvs)
        begin
            dvs.item.Destroy_Task.wait_for_completion
        rescue
            #Ignore destroy task exception
        end
    end

    ########################################################################
    # Check if distributed port group exists in datacenter
    ########################################################################
    def dpg_exists(pg_name, net_folder)
        return net_folder.items.values.select{ |dpg|
            dpg.instance_of?(VCenterDriver::DistributedPortGroup) &&
            dpg['name'] == pg_name
        }.first rescue nil
    end

    ########################################################################
    # Check if Opaque Network exists in datacenter
    ########################################################################
    def nsx_network(nsx_id, pgType)
        timeout = 180
        if pgType == VCenterDriver::Network::NETWORK_TYPE_NSXT
            while timeout > 0
                netFolder = self.network_folder
                netFolder.fetch!
                netFolder.items.values.each{ |net|
                    if net.instance_of?(VCenterDriver::OpaqueNetwork) &&
                      net.item.summary.opaqueNetworkId == nsx_id
                        return net.item._ref
                    end
                }
                sleep(1)
                timeout -= 1
            end
        # Not used right now, but maybe neccesary in the future.
        elsif pgType == VCenterDriver::Network::NETWORK_TYPE_NSXV
            while timeout > 0
                netFolder = self.network_folder
                netFolder.fetch!
                netFolder.items.values.each{ |net|
                    if net.instance_of?(VCenterDriver::DistributedPortGroup) &&
                      net.item.key == nsx_id
                        return net.item._ref
                    end
                }
                sleep(1)
                timeout -= 1
            end
        else
            raise "Unknown network Port Group type: #{pgType}"
        end
    end

    ########################################################################
    # Create a distributed vcenter port group
    ########################################################################
    def create_dpg(dvs, pg_name, vlan_id, num_ports)
        spec = RbVmomi::VIM::DVPortgroupConfigSpec.new

        # OpenNebula use DVS static port binding with autoexpand
        if num_ports
            spec.autoExpand = true
            spec.numPorts = num_ports
        end

        # Distributed port group name
        spec.name = pg_name

        # Set VLAN information
        spec.defaultPortConfig = RbVmomi::VIM::VMwareDVSPortSetting.new
        spec.defaultPortConfig.vlan = RbVmomi::VIM::VmwareDistributedVirtualSwitchVlanIdSpec.new
        spec.defaultPortConfig.vlan.vlanId = vlan_id
        spec.defaultPortConfig.vlan.inherited = false

        # earlyBinding. A free DistributedVirtualPort will be selected and
        # assigned to a VirtualMachine when the virtual machine is reconfigured
        # to connect to the portgroup.
        spec.type = "earlyBinding"

        begin
            dvs.item.AddDVPortgroup_Task(spec: [spec]).wait_for_completion
        rescue Exception => e
            raise "The Distributed port group #{pg_name} could not be created. "\
                  "Reason: #{e.message}"
        end

        # wait until the network is ready and we have a reference
        portgroups = dvs['portgroup'].select{ |dpg|
            dpg.instance_of?(RbVmomi::VIM::DistributedVirtualPortgroup) &&
            dpg['name'] == pg_name
        }

        (0..DPG_CREATE_TIMEOUT).each do
            break if !portgroups.empty?
            portgroups = dvs['portgroup'].select{ |dpg|
                dpg.instance_of?(RbVmomi::VIM::DistributedVirtualPortgroup) &&
                dpg['name'] == pg_name
            }
            sleep 1
        end

        raise "Cannot get VCENTER_NET_REF for new distributed port group" if portgroups.empty?

        @net_rollback << {:action => :delete_dpg, :dpg => portgroups.first, :name => pg_name}

        return portgroups.first._ref
    end

    ########################################################################
    # Update a distributed vcenter port group
    ########################################################################
    def update_dpg(dpg, vlan_id, num_ports)
        spec = RbVmomi::VIM::DVPortgroupConfigSpec.new

        changed = false

        orig_spec = RbVmomi::VIM::DVPortgroupConfigSpec.new
        orig_spec.numPorts = dpg['config.numPorts']
        orig_spec.defaultPortConfig = RbVmomi::VIM::VMwareDVSPortSetting.new
        orig_spec.defaultPortConfig.vlan = RbVmomi::VIM::VmwareDistributedVirtualSwitchVlanIdSpec.new
        orig_spec.defaultPortConfig.vlan.vlanId = dpg['config.defaultPortConfig.vlan.vlanId']
        orig_spec.defaultPortConfig.vlan.inherited = false

        if num_ports && num_ports != orig_spec.numPorts
            spec.numPorts = num_ports
            changed = true
        end

        # earlyBinding. A free DistributedVirtualPort will be selected and
        # assigned to a VirtualMachine when the virtual machine is reconfigured
        # to connect to the portgroup.
        spec.type = "earlyBinding"

        if vlan_id != orig_spec.defaultPortConfig.vlan.vlanId
            spec.defaultPortConfig = RbVmomi::VIM::VMwareDVSPortSetting.new
            spec.defaultPortConfig.vlan = RbVmomi::VIM::VmwareDistributedVirtualSwitchVlanIdSpec.new
            spec.defaultPortConfig.vlan.vlanId = vlan_id
            spec.defaultPortConfig.vlan.inherited = false
            changed = true
        end

        if changed

            spec.configVersion = dpg['config.configVersion']

            begin
                dpg.item.ReconfigureDVPortgroup_Task(:spec => spec).wait_for_completion
            rescue Exception => e
                raise "The Distributed port group #{dpg['name']} could not be created. "\
                      "Reason: #{e.message}"
            end

            @net_rollback << {:action => :update_dpg, :dpg => dpg.item, :name => dpg['name'], :spec => orig_spec}
        end

    end

    ########################################################################
    # Remove distributed port group from datacenter
    ########################################################################
    def remove_dpg(dpg)
        begin
            dpg.item.Destroy_Task.wait_for_completion
        rescue RbVmomi::VIM::ResourceInUse => e
            STDERR.puts "The distributed portgroup #{dpg["name"]} is in use so it cannot be deleted"
            return nil
        rescue Exception => e
            raise "The Distributed portgroup #{dpg["name"]} could not be deleted. Reason: #{e.message} "
        end
    end

    ########################################################################
    # Perform vcenter network rollback operations
    ########################################################################
    def network_rollback
        @net_rollback.reverse_each do |nr|

            case nr[:action]
                when :update_dpg
                    begin
                        nr[:dpg].ReconfigureDVPortgroup_Task(:spec => nr[:spec]).wait_for_completion
                    rescue Exception => e
                        raise "A rollback operation for distributed port group #{nr[:name]} could not be performed. Reason: #{e.message}"
                    end
                when :update_dvs
                    begin
                        nr[:dvs].ReconfigureDvs_Task(:spec => nr[:spec]).wait_for_completion
                    rescue Exception => e
                        raise "A rollback operation for distributed standard switch #{nr[:name]} could not be performed. Reason: #{e.message}"
                    end
                when :delete_dvs
                    begin
                        nr[:dvs].Destroy_Task.wait_for_completion
                    rescue RbVmomi::VIM::ResourceInUse
                        return #Ignore if switch in use
                    rescue RbVmomi::VIM::NotFound
                        return #Ignore if switch not found
                    rescue Exception => e
                        raise "A rollback operation for standard switch #{nr[:name]} could not be performed. Reason: #{e.message}"
                    end
                when :delete_dpg
                    begin
                        nr[:dpg].Destroy_Task.wait_for_completion
                    rescue RbVmomi::VIM::ResourceInUse
                        return #Ignore if pg in use
                    rescue RbVmomi::VIM::NotFound
                        return #Ignore if pg not found
                    rescue Exception => e
                        raise "A rollback operation for standard port group #{nr[:name]} could not be performed. Reason: #{e.message}"
                    end
            end
        end
    end

    ########################################################################
    # PowerOn VMs
    ########################################################################
    def power_on_vm(vm)
        @item.PowerOnMultiVM_Task({:vm => [vm]}).wait_for_completion
    end

    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::Datacenter.new(vi_client.vim, ref), vi_client)
    end
end

end # module VCenterDriver
