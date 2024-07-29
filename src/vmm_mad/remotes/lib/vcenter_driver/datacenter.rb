# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

##############################################################################
# Module VCenterDriver
##############################################################################
module VCenterDriver

    ##########################################################################
    # Class DatacenterFolder
    ##########################################################################
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
            VIClient
                .get_entities(
                    @vi_client.vim.root,
                    'Datacenter'
                ).each do |item|
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

        def vcenter_instance_uuid
            @vi_client.vim.serviceContent.about.instanceUuid
        end

        def vcenter_api_version
            @vi_client.vim.serviceContent.about.apiVersion
        end

        def get_unimported_hosts(hpool, _vcenter_instance_name)
            host_objects = {}

            vcenter_uuid = vcenter_instance_uuid
            vcenter_version = vcenter_api_version

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
                    one_host =
                        VCenterDriver::VIHelper
                        .find_by_ref(
                            OpenNebula::HostPool,
                            'TEMPLATE/VCENTER_CCR_REF',
                            ccr['_ref'],
                            vcenter_uuid,
                            hpool
                        )
                    next if one_host

                    # Get a ClusterComputeResource object
                    cluster =
                        VCenterDriver::ClusterComputeResource
                        .new_from_ref(
                            ccr['_ref'],
                            @vi_client
                        )

                    # Obtain a list of resource pools found in the cluster
                    rpools =
                        cluster
                        .get_resource_pool_list
                        .reject {|rp| rp[:name].empty? }

                    # Determine a host location (folder and subfolders)
                    item = cluster.item
                    folders = []
                    until item.instance_of? RbVmomi::VIM::Datacenter
                        item = item.parent
                        if !item.instance_of?(RbVmomi::VIM::Datacenter) &&
                           item.name != 'host'
                            folders << item.name
                        end
                        raise "Could not find the host's location" if item.nil?
                    end
                    location   = folders.reverse.join('/')
                    location = '/' if location.empty?

                    # Setting host import name and
                    # replace spaces and weird characters
                    cluster_name = ccr['name'].to_s.tr(' ', '_')
                    cluster_name = VCenterDriver::VcImporter.sanitize(
                        cluster_name
                    )
                    cluster_name =
                        VCenterDriver::VIHelper
                        .one_name(
                            OpenNebula::HostPool,
                            cluster_name,
                            ccr['_ref']+vcenter_uuid,
                            hpool
                        )

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

            host_objects
        end

        # rubocop:disable Style/GlobalVars
        def get_unimported_datastores(dpool, vcenter_instance_name, hpool, args)
            import_id = 0
            ds_objects = {}
            vcenter_uuid = vcenter_instance_uuid

            # Selected host in OpenNebula
            if $conf.nil?
                one_client = OpenNebula::Client.new
            else
                one_client = OpenNebula::Client.new(
                    nil,
                    $conf[:one_xmlrpc]
                )
            end
            one_host = OpenNebula::Host.new_with_id(args[:host], one_client)

            rc = one_host.info
            raise rc.message if OpenNebula.is_error? rc

            cluster_id = one_host['CLUSTER_ID'].to_i

            # Get datacenters
            fetch! if @items.empty?

            @items.values.each do |dc|
                clusters_in_ds = {}
                dc_name = dc.item.name
                dc_ref  = dc.item._ref

                datastore_folder = dc.datastore_folder
                datastore_folder.fetch!

                datastore_folder.items.values.each do |ds|
                    name, capacity, free_space =
                        ds
                        .item
                        .collect(
                            'name',
                            'summary.capacity',
                            'summary.freeSpace'
                        )

                    ds_name = VCenterDriver::VcImporter.sanitize(
                        name.to_s
                    )

                    ds_total_mb = ((capacity.to_i / 1024) / 1024)
                    ds_free_mb  = ((free_space.to_i / 1024) / 1024)
                    ds_ref      = ds['_ref']

                    ds_objects[ds_ref] = {}
                    ds_objects[ds_ref][:ref]         = ds_ref
                    ds_objects[ds_ref][:import_id]   = import_id
                    ds_objects[ds_ref][:datacenter]  = dc_name
                    ds_objects[ds_ref][:simple_name] = ds_name.to_s
                    ds_objects[ds_ref][:total_mb]    = ds_total_mb
                    ds_objects[ds_ref][:free_mb]     = ds_free_mb
                    ds_objects[ds_ref][:ds]          = []
                    ds_objects[ds_ref][:cluster]     = []

                    if ds.instance_of? VCenterDriver::Datastore
                        hosts = ds['host']
                        hosts.each do |host|
                            cluster_ref = host.key.parent._ref
                            if !clusters_in_ds.key?(cluster_ref)
                                clusters_in_ds[cluster_ref] = nil

                                # Try to locate cluster ref in host's pool
                                one_cluster =
                                    VCenterDriver::VIHelper
                                    .find_by_ref(
                                        OpenNebula::HostPool,
                                        'TEMPLATE/VCENTER_CCR_REF',
                                        cluster_ref,
                                        vcenter_uuid,
                                        hpool
                                    )
                                if one_cluster
                                    ds_objects[ds_ref][:cluster] <<
                                        one_cluster['CLUSTER_ID'].to_i
                                    clusters_in_ds[cluster_ref] =
                                        one_cluster['CLUSTER_ID'].to_i
                                end
                            else
                                if clusters_in_ds[cluster_ref] &&
                                   !ds_objects[ds_ref][:cluster]
                                   .include?(
                                       clusters_in_ds[cluster_ref]
                                   )
                                    ds_objects[ds_ref][:cluster] <<
                                        clusters_in_ds[cluster_ref]
                                end
                            end
                        end

                        already_image_ds = VCenterDriver::Storage
                                           .exists_one_by_ref_dc_and_type?(
                                               ds_ref,
                                               dc_ref,
                                               vcenter_uuid,
                                               'IMAGE_DS',
                                               dpool
                                           )

                        key = ds_ref+vcenter_uuid
                        if !already_image_ds
                            ds_objects[ds_ref][:name] =
                                VCenterDriver::VIHelper
                                .one_name(
                                    OpenNebula::DatastorePool,
                                    "#{ds_name}(IMG)",
                                    key
                                )
                            object =
                                ds
                                .to_one_template(
                                    ds_objects[ds_ref],
                                    vcenter_uuid,
                                    dc_name,
                                    dc_ref,
                                    'IMAGE_DS'
                                )
                            ds_objects[ds_ref][:ds] << object unless object.nil?
                        end

                        already_system_ds =
                            VCenterDriver::Storage
                            .exists_one_by_ref_dc_and_type?(
                                ds_ref,
                                dc_ref,
                                vcenter_uuid,
                                'SYSTEM_DS',
                                dpool
                            )

                        if !already_system_ds
                            ds_objects[ds_ref][:name] =
                                VCenterDriver::VIHelper
                                .one_name(
                                    OpenNebula::DatastorePool,
                                    "#{ds_name}(SYS)",
                                    key
                                )
                            object = ds
                                     .to_one_template(
                                         ds_objects[ds_ref],
                                         vcenter_uuid,
                                         dc_name,
                                         dc_ref,
                                         'SYSTEM_DS'
                                     )
                            ds_objects[ds_ref][:ds] << object unless object.nil?
                        end

                        ds_objects[ds_ref][:name] = ds_name.to_s
                    elsif ds.instance_of? VCenterDriver::StoragePod
                        ds['children'].each do |sp_ds|
                            hosts = sp_ds.host
                            hosts.each do |host|
                                cluster_ref = host.key.parent._ref
                                if !clusters_in_ds.include?(cluster_ref)
                                    clusters_in_ds[cluster_ref] = nil
                                    # Try to locate cluster
                                    # ref in cluster's pool
                                    one_cluster =
                                        VCenterDriver::VIHelper
                                        .find_by_ref(
                                            OpenNebula::HostPool,
                                            'TEMPLATE/VCENTER_CCR_REF',
                                            cluster_ref,
                                            vcenter_uuid,
                                            hpool
                                        )
                                    if one_cluster
                                        ds_objects[ds_ref][:cluster] <<
                                            one_cluster['CLUSTER_ID'].to_i
                                        clusters_in_ds[cluster_ref] =
                                            one_cluster['CLUSTER_ID'].to_i
                                    end
                                else
                                    if clusters_in_ds[cluster_ref] &&
                                       !ds_objects[ds_ref][:cluster]
                                       .include?(
                                           clusters_in_ds[cluster_ref]
                                       )
                                        ds_objects[ds_ref][:cluster] <<
                                            clusters_in_ds[cluster_ref]
                                    end
                                end
                            end
                        end

                        already_system_ds = VCenterDriver::Storage
                                            .exists_one_by_ref_dc_and_type?(
                                                ds_ref,
                                                dc_ref,
                                                vcenter_uuid,
                                                'SYSTEM_DS',
                                                dpool
                                            )

                        if !already_system_ds
                            ds_objects[ds_ref][:name] = "#{ds_name} \
                            [#{vcenter_instance_name} - #{dc_name}] (StorDRS)"
                            object = ds.to_one_template(
                                ds_objects[ds_ref],
                                vcenter_uuid,
                                dc_name,
                                dc_ref,
                                'SYSTEM_DS'
                            )
                            ds_objects[ds_ref][:ds] << object unless object.nil?
                        end
                    end

                    if ds_objects[ds_ref][:ds].empty?
                        ds_objects.delete(ds_ref)
                    else
                        import_id += 1
                    end
                end
            end

            ds_objects.keys.each do |key|
                unless ds_objects[key][:cluster].include? cluster_id
                    ds_objects.delete key
                end
            end

            { vcenter_instance_name => ds_objects }
        end
        # rubocop:enable Style/GlobalVars

        def get_unimported_templates(vi_client, tpool)
            template_objects = {}
            import_id = 0
            vcenter_uuid = vcenter_instance_uuid

            vcenter_instance_name = vi_client.vim.host

            fetch! if @items.empty? # Get datacenters

            @items.values.each do |dc|
                rp_cache = {}
                dc_name = dc.item.name

                view = vi_client
                       .vim
                       .serviceContent
                       .viewManager
                       .CreateContainerView(
                           {
                               :container => dc.item.vmFolder,
                               :type => ['VirtualMachine'],
                               :recursive => true
                           }
                       )

                pc = vi_client.vim.serviceContent.propertyCollector

                filter_spec = RbVmomi::VIM.PropertyFilterSpec(
                    :objectSet => [
                        {
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
                        }
                    ],
                    :propSet => [
                        {
                            :type => 'VirtualMachine',
                            :pathSet => ['config.template']
                        }
                    ]
                )

                result = pc.RetrieveProperties(
                    :specSet => [filter_spec]
                )

                vms = {}
                result.each do |r|
                    if r.obj.is_a?(RbVmomi::VIM::VirtualMachine)
                        vms[r.obj._ref] = r.to_hash
                    end
                end
                templates = []
                vms.each do |ref, value|
                    next unless value['config.template']

                    templates << VCenterDriver::Template
                                 .new_from_ref(
                                     ref,
                                     vi_client
                                 )
                end

                view.DestroyView # Destroy the view

                templates.each do |template|
                    tref = template['_ref']
                    next if template_objects[tref]

                    one_template = VCenterDriver::VIHelper
                                   .find_by_ref(
                                       OpenNebula::TemplatePool,
                                       'TEMPLATE/VCENTER_TEMPLATE_REF',
                                       tref,
                                       vcenter_uuid,
                                       tpool
                                   )

                    # If the template has been already imported
                    next if one_template

                    one_template = VCenterDriver::Template
                                   .get_xml_template(
                                       template,
                                       vcenter_uuid,
                                       vi_client,
                                       dc_name,
                                       rp_cache
                                   )

                    next if one_template.nil?

                    one_template[:import_id] = import_id
                    one_template[:vcenter] = vcenter_instance_name
                    import_id += 1
                    template_objects[tref] = one_template
                end
            end

            {
                vcenter_instance_name => template_objects
            }
        end

        def cluster_networks(one_host)
            ccr_ref = one_host['TEMPLATE/VCENTER_CCR_REF']
            cluster = VCenterDriver::ClusterComputeResource
                      .new_from_ref(ccr_ref, @vi_client)
            # cluster = cluster_mob(one_host)
            raise "Cluster with ref: #{ccr_ref} not found" if cluster.nil?

            cluster.item.network
        end

        # Return ONE cluster ID
        def one_cluster_id(one_host)
            if !one_host || !one_host['CLUSTER_ID']
                cluster_id = -1
            else
                cluster_id = one_host['CLUSTER_ID']
            end

            cluster_id.to_i
        end

        # Determine if a network must be excluded from the list
        def exclude_network?(one_host, args, vc_network_hash, network_type)
            vc_network_name = vc_network_hash[:vc_network_name]
            vc_network_host = vc_network_hash[:vc_network_host]
            vc_network_tag = vc_network_hash[:vc_network_tag]

            # Exclude some networks if filter = true
            if args[:filter]
                if one_host && one_host['TEMPLATE/NSX_PASSWORD'].nil?
                    network_types = [
                        VCenterDriver::Network::NETWORK_TYPE_NSXT,
                        VCenterDriver::Network::NETWORK_TYPE_NSXV
                    ]

                    # Only NSX-V and NSX-T can be excluded
                    return true if network_types.include? network_type
                end
                # Exclude networks without hosts
                if vc_network_host.empty?
                    return true
                end

                # Exclude DVS uplinks
                if !vc_network_tag.empty? &&
                   vc_network_tag[0][:key] == 'SYSTEM/DVS.UPLINKPG'
                    return true
                end
                # Exclude portgroup used for VXLAN communication in NSX
                if vc_network_name.match(/^vxw-vmknicPg-dvs-(.*)/)
                    return true
                end

                return false
            end
            false
        end

        # Proccess each network
        def process_network(params, networks_type, hosts_list, host_list_object)
            vc_network = params[:vc_network]
            vcenter_instance_name = params[:vcenter_instance_name]
            vcenter_uuid = params[:vcenter_uuid]
            _hpool = params[:_hpool]
            one_host = params[:one_host]
            args = params[:args]

            full_process = !args[:short]

            vc_network_ref = vc_network._ref
            vc_network_name = VCenterDriver::VcImporter.sanitize(
                vc_network.name
            )
            vc_network_host = vc_network['host']
            vc_network_tag = vc_network['tag']

            vc_network_hash = {}
            vc_network_hash[:vc_network_ref] = vc_network_ref
            vc_network_hash[:vc_network_name] = vc_network_name
            vc_network_hash[:vc_network_host] = vc_network_host
            vc_network_hash[:vc_network_tag] = vc_network_tag

            # Initialize network hash
            network = {}
            # Add name to network hash
            network[vc_network_ref] = { 'name' => vc_network_name }
            # By default no network is excluded
            network[vc_network_ref][:excluded] = false

            # Initialize opts hash used to inject data into one template
            opts = {}

            # Add network type to network hash
            if networks_type.key?(vc_network_hash[:vc_network_ref])
                network_type = networks_type[vc_network_hash[:vc_network_ref]]
            else
                network_type =
                    VCenterDriver::Network.get_network_type(
                        vc_network,
                        vc_network_name
                    )
                networks_type[vc_network_hash[:vc_network_ref]] = network_type
            end

            network[vc_network_ref][:network_type] = network_type
            network[vc_network_ref][:type] = network_type

            # Determine if the network must be excluded
            network[vc_network_ref][:excluded] = exclude_network?(
                one_host,
                args,
                vc_network_hash,
                network_type
            )

            if network[vc_network_ref][:excluded] == true
                return [nil, networks_type, hosts_list, host_list_object]
            end

            if full_process
                case network[vc_network_ref][:network_type]
                # Distributed PortGroups
                when VCenterDriver::Network::NETWORK_TYPE_DPG
                    network[vc_network_ref][:sw_name] = \
                        vc_network.config.distributedVirtualSwitch.name
                    # For DistributedVirtualPortgroups there
                    # is networks and uplinks
                    network[vc_network_ref][:uplink] = \
                        vc_network.config.uplink
                # network[vc_network_ref][:uplink] = false
                # NSX-V PortGroups
                when VCenterDriver::Network::NETWORK_TYPE_NSXV
                    network[vc_network_ref][:sw_name] = \
                        vc_network.config.distributedVirtualSwitch.name
                    # For NSX-V ( is the same as DistributedVirtualPortgroups )
                    # there is networks and uplinks
                    network[vc_network_ref][:uplink] = \
                        vc_network.config.uplink
                    network[vc_network_ref][:uplink] = false
                # Standard PortGroups
                when VCenterDriver::Network::NETWORK_TYPE_PG
                    # There is no uplinks for standard portgroups,
                    # so all Standard
                    # PortGroups are networks and no uplinks
                    network[vc_network_ref][:uplink] = false
                    network[vc_network_ref][:sw_name] =
                        VCenterDriver::Network
                        .virtual_switch(
                            vc_network
                        )
                # NSX-T PortGroups
                when VCenterDriver::Network::NETWORK_TYPE_NSXT
                    network[vc_network_ref][:sw_name] = \
                        vc_network.summary.opaqueNetworkType
                    # There is no uplinks for NSX-T networks,
                    # so all NSX-T networks
                    # are networks and no uplinks
                    network[vc_network_ref][:uplink] = false
                else
                    raise 'Unknown network type: ' \
                          "#{network[vc_network_ref][:network_type]}"
                end
            end

            # Multicluster nets support
            network[vc_network_ref][:clusters] = {}
            network[vc_network_ref][:clusters][:refs] = []
            network[vc_network_ref][:clusters][:one_ids] = []
            network[vc_network_ref][:clusters][:names] = []

            # Get hosts related to this network and add them if is not
            # excluded
            vc_hosts = vc_network.host
            vc_hosts.each do |vc_host|
                # Get vCenter Cluster
                vc_host_ref = vc_host._ref
                if !host_list_object.key?(vc_host_ref)
                    vc_cluster = vc_host.parent
                    vc_cluster_ref = vc_cluster._ref
                    vc_cluster_name = vc_cluster.name
                    host_list_object[vc_host_ref] = {
                        :vc_cluster_ref => vc_cluster_ref,
                        :vc_cluster_name => vc_cluster_name
                    }
                end

                vc_cluster = host_list_object[vc_host_ref]

                if hosts_list.key? vc_cluster[:vc_cluster_ref]
                    one_host = hosts_list[vc_cluster[:vc_cluster_ref]]
                else
                    one_host = VCenterDriver::VIHelper
                               .find_by_ref(OpenNebula::HostPool,
                                            'TEMPLATE/VCENTER_CCR_REF',
                                            vc_cluster[:vc_cluster_ref],
                                            vcenter_uuid)
                    hosts_list[vc_cluster[:vc_cluster_ref]] = one_host
                end
                # Check if network is excluded from each host
                next if exclude_network?(
                    one_host,
                    args,
                    vc_network_hash,
                    network_type
                )

                # Insert vCenter cluster ref
                network[vc_network_ref][:clusters][:refs] <<
                    vc_cluster[:vc_cluster_ref]

                # Insert OpenNebula cluster id
                cluster_id = one_cluster_id(one_host)
                network[vc_network_ref][:clusters][:one_ids] <<
                    cluster_id

                # Insert vCenter cluster name
                network[vc_network_ref][:clusters][:names] <<
                    vc_cluster[:vc_cluster_name]
                opts[:dc_name] = vc_cluster[:vc_cluster_name]
            end

            # Remove duplicate entries
            network[vc_network_ref][:clusters][:refs].uniq!
            network[vc_network_ref][:clusters][:one_ids].uniq!
            network[vc_network_ref][:clusters][:names].uniq!

            # Mark network as processed
            network[vc_network_ref][:processed] = true

            if full_process
                # General net_info related to datacenter
                opts[:vcenter_uuid] = vcenter_uuid
                opts[:vcenter_instance_name] = vcenter_instance_name
                opts[:network_name] = network[vc_network_ref]['name']
                opts[:network_ref]  = network.keys.first
                opts[:network_type] = network[vc_network_ref][:network_type]
                opts[:sw_name] = network[vc_network_ref][:sw_name]

                network[vc_network_ref] = \
                    network[vc_network_ref]
                    .merge(VCenterDriver::Network
                    .to_one_template(opts))
            else
                network[vc_network_ref][:ref] = \
                    vc_network_ref
                network[vc_network_ref][:name] = \
                    network[vc_network_ref]['name']
            end

            [network, networks_type, hosts_list, host_list_object]
        end

        # rubocop:disable Style/GlobalVars
        def get_unimported_networks(npool, vcenter_instance_name, hpool, args)
            vcenter_uuid = vcenter_instance_uuid
            networks = {}

            # Selected host in OpenNebula
            if $conf.nil?
                one_client = OpenNebula::Client.new
            else
                one_client = OpenNebula::Client.new(
                    nil,
                    $conf[:one_xmlrpc]
                )
            end
            one_host = OpenNebula::Host.new_with_id(args[:host], one_client)
            rc = one_host.info
            raise rc.message if OpenNebula.is_error? rc

            # Get all networks in vcenter cluster (one_host)
            vc_cluster_networks = cluster_networks(one_host)
            networks_type = {}
            hosts_list = {}
            host_list_object = {}

            # Iterate over vcenter networks
            vc_cluster_networks.each do |vc_cluster_network|
                exist = VCenterDriver::VIHelper
                        .find_by_ref(OpenNebula::VirtualNetworkPool,
                                     'TEMPLATE/VCENTER_NET_REF',
                                     vc_cluster_network._ref,
                                     vcenter_uuid,
                                     npool)

                next if exist

                params = {}

                params[:vc_network]= vc_cluster_network
                params[:vcenter_instance_name]= vcenter_instance_name
                params[:vcenter_uuid]= vcenter_uuid
                params[:_hpool]= hpool
                params[:one_host]= one_host
                params[:args] = args

                network,
                    networks_type_new,
                    hosts_list_new,
                    host_list_object_new =
                    process_network(
                        params,
                        networks_type,
                        hosts_list,
                        host_list_object
                    )

                networks_type = networks_type_new
                hosts_list = hosts_list_new
                host_list_object = host_list_object_new

                networks.merge!(network) unless network.nil?
            end
            # Added import id
            imid = -1
            networks.map {|_k, v| v[:import_id] = imid += 1 }
            { vcenter_instance_name => networks }
        end
        # rubocop:enable Style/GlobalVars

    end
    # class DatatacenterFolder

    ##########################################################################
    # Class Datacenter
    ##########################################################################
    class Datacenter

        attr_accessor :item

        DPG_CREATE_TIMEOUT = 240

        def initialize(item, vi_client = nil)
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
            hostlockname = @item['name'].downcase.tr(' ', '_')
            return unless @locking

            @locking_file =
                File
                .open("/tmp/vcenter-dc-#{hostlockname}-lock", 'w')
            @locking_file.flock(File::LOCK_EX)
        end

        # Unlock driver execution mutex
        def unlock
            return unless @locking

            @locking_file.close
        end

        ########################################################################
        # Check if distributed virtual switch exists in host
        ########################################################################
        def dvs_exists(switch_name, net_folder)
            net_folder.items.values.select do |dvs|
                dvs.instance_of?(VCenterDriver::DistributedVirtualSwitch) &&
                    dvs['name'] == switch_name
            end.first rescue nil
        end

        ########################################################################
        # Is the distributed switch for the distributed pg different?
        ########################################################################
        def pg_changes_sw?(dpg, switch_name)
            dpg['config.distributedVirtualSwitch.name'] != switch_name
        end

        ########################################################################
        # Create a distributed vcenter switch in a datacenter
        ########################################################################
        def create_dvs(switch_name, pnics, mtu = 1500)
            # Prepare spec for DVS creation
            spec = RbVmomi::VIM::DVSCreateSpec.new
            spec.configSpec = RbVmomi::VIM::VMwareDVSConfigSpec.new
            spec.configSpec.name = switch_name

            # Specify number of uplinks port for dpg
            if pnics
                pnics = pnics.split(',')
                if !pnics.empty?
                    spec.configSpec.uplinkPortPolicy =
                        RbVmomi::VIM::DVSNameArrayUplinkPortPolicy.new
                    spec.configSpec.uplinkPortPolicy.uplinkPortName = []
                    (0..pnics.size-1).each do |index|
                        spec
                            .configSpec
                            .uplinkPortPolicy
                            .uplinkPortName[index]="dvUplink#{index+1}"
                    end
                end
            end

            # Set maximum MTU
            spec.configSpec.maxMtu = mtu

            # The DVS must be created in the networkFolder of the datacenter
            dvs_creation_task = @item
                                .networkFolder
                                .CreateDVS_Task(
                                    :spec => spec
                                )
            dvs_creation_task.wait_for_completion

            # If task finished successfuly we rename the uplink portgroup
            dvs = nil
            if dvs_creation_task.info.state == 'success'
                dvs = dvs_creation_task.info.result
                dvs
                    .config
                    .uplinkPortgroup[0]
                    .Rename_Task(
                        :newName => "#{switch_name}-uplink-pg"
                    ).wait_for_completion
            else
                raise "The Distributed vSwitch #{switch_name} \
                could not be created. "
            end

            @net_rollback << {
                :action => :delete_dvs,
                :dvs => dvs,
                :name => switch_name
            }

            VCenterDriver::DistributedVirtualSwitch.new(dvs, @vi_client)
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
            orig_spec.uplinkPortPolicy =
                RbVmomi::VIM::DVSNameArrayUplinkPortPolicy.new
            orig_spec.uplinkPortPolicy.uplinkPortName = []
            (0..dvs['config.uplinkPortgroup'].length-1).each do |index|
                orig_spec
                    .uplinkPortPolicy
                    .uplinkPortName[index]="dvUplink#{index+1}"
            end

            # Add more uplinks to default uplink
            # port group according to number of pnics
            if pnics
                pnics = pnics.split(',')
                if !pnics.empty? && dvs['config.uplinkPortgroup']
                   .length != pnics.size
                    spec.uplinkPortPolicy =
                        RbVmomi::VIM::DVSNameArrayUplinkPortPolicy.new
                    spec.uplinkPortPolicy.uplinkPortName = []
                    (dvs['config.uplinkPortgroup']
                    .length..num_pnics-1)
                        .each do |index|
                        spec
                            .uplinkPortPolicy
                            .uplinkPortName[index] =
                            "dvUplink#{index+1}"
                    end
                    changed = true
                end
            end

            # Set maximum MTU
            if mtu != dvs['config.maxMtu']
                spec.maxMtu = mtu
                changed = true
            end

            # The DVS must be created in the networkFolder of the datacenter
            return unless changed

            spec.configVersion = dvs['config.configVersion']

            begin
                dvs
                    .item
                    .ReconfigureDvs_Task(
                        :spec => spec
                    ).wait_for_completion
            rescue StandardError => e
                raise "The Distributed switch #{dvs['name']} could \
                not be updated. "\
                        "Reason: #{e.message}"
            end

            @net_rollback << {
                :action => :update_dvs,
                    :dvs => dvs.item,
                    :name => dvs['name'],
                    :spec => orig_spec
            }
        end

        ########################################################################
        # Remove a distributed vcenter switch in a datacenter
        ########################################################################
        def remove_dvs(dvs)
            begin
                dvs.item.Destroy_Task.wait_for_completion
            rescue StandardError
                # Ignore destroy task exception
            end
        end

        ########################################################################
        # Check if distributed port group exists in datacenter
        ########################################################################
        def dpg_exists(pg_name, net_folder)
            net_folder.items.values.select do |dpg|
                dpg.instance_of?(VCenterDriver::DistributedPortGroup) &&
                    dpg['name'] == pg_name
            end.first rescue nil
        end

        ########################################################################
        # Check if Opaque Network exists in datacenter
        ########################################################################
        def nsx_network(nsx_id, pg_type)
            timeout = 180
            case pg_type
            when VCenterDriver::Network::NETWORK_TYPE_NSXT
                while timeout > 0
                    net_folder = network_folder
                    net_folder.fetch!
                    net_folder.items.values.each do |net|
                        if net.instance_of?(VCenterDriver::OpaqueNetwork) &&
                           net.item.summary.opaqueNetworkId == nsx_id
                            return net.item._ref
                        end
                    end
                    sleep(1)
                    timeout -= 1
                end
            # Not used right now, but maybe neccesary in the future.
            when VCenterDriver::Network::NETWORK_TYPE_NSXV
                while timeout > 0
                    net_folder = network_folder
                    net_folder.fetch!
                    net_folder.items.values.each do |net|
                        if net.instance_of?(
                            VCenterDriver::DistributedPortGroup
                        ) &&
                           net.item.key == nsx_id
                            return net.item._ref
                        end
                    end
                    sleep(1)
                    timeout -= 1
                end
            else
                raise "Unknown network Port Group type: #{pg_type}"
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
            spec.defaultPortConfig =
                RbVmomi::VIM::VMwareDVSPortSetting.new
            spec.defaultPortConfig.vlan =
                RbVmomi::VIM::VmwareDistributedVirtualSwitchVlanIdSpec.new
            spec.defaultPortConfig.vlan.vlanId =
                vlan_id
            spec.defaultPortConfig.vlan.inherited =
                false

            # earlyBinding. A free DistributedVirtualPort will be selected and
            # assigned to a VirtualMachine when
            # the virtual machine is reconfigured
            # to connect to the portgroup.
            spec.type = 'earlyBinding'

            begin
                dvs
                    .item
                    .AddDVPortgroup_Task(
                        :spec => [spec]
                    ).wait_for_completion
            rescue StandardError => e
                raise "The Distributed port group #{pg_name} \
                could not be created. "\
                      "Reason: #{e.message}"
            end

            # wait until the network is ready and we have a reference
            portgroups = dvs['portgroup'].select do |dpg|
                dpg.instance_of?(RbVmomi::VIM::DistributedVirtualPortgroup) &&
                    dpg['name'] == pg_name
            end

            (0..DPG_CREATE_TIMEOUT).each do
                break unless portgroups.empty?

                portgroups = dvs['portgroup'].select do |dpg|
                    dpg
                        .instance_of?(
                            RbVmomi::VIM::DistributedVirtualPortgroup
                        ) && dpg['name'] == pg_name
                end
                sleep 1
            end

            if portgroups.empty?
                raise 'Cannot get VCENTER_NET_REF \
                for new distributed port group'
            end

            @net_rollback << {
                :action => :delete_dpg,
                 :dpg => portgroups.first,
                  :name => pg_name
            }

            portgroups.first._ref
        end

        ########################################################################
        # Update a distributed vcenter port group
        ########################################################################
        def update_dpg(dpg, vlan_id, num_ports)
            spec = RbVmomi::VIM::DVPortgroupConfigSpec.new

            changed = false

            orig_spec =
                RbVmomi::VIM::DVPortgroupConfigSpec.new
            orig_spec.numPorts =
                dpg['config.numPorts']
            orig_spec.defaultPortConfig =
                RbVmomi::VIM::VMwareDVSPortSetting.new
            orig_spec.defaultPortConfig.vlan =
                RbVmomi::VIM::VmwareDistributedVirtualSwitchVlanIdSpec.new
            orig_spec.defaultPortConfig.vlan.vlanId =
                dpg['config.defaultPortConfig.vlan.vlanId']
            orig_spec.defaultPortConfig.vlan.inherited =
                false

            if num_ports && num_ports != orig_spec.numPorts
                spec.numPorts = num_ports
                changed = true
            end

            # earlyBinding. A free DistributedVirtualPort
            # will be selected and
            # assigned to a VirtualMachine when
            # the virtual machine is reconfigured
            # to connect to the portgroup.
            spec.type = 'earlyBinding'

            if vlan_id != orig_spec.defaultPortConfig.vlan.vlanId
                spec.defaultPortConfig =
                    RbVmomi::VIM::VMwareDVSPortSetting.new
                spec.defaultPortConfig.vlan =
                    RbVmomi::VIM::VmwareDistributedVirtualSwitchVlanIdSpec.new
                spec.defaultPortConfig.vlan.vlanId = vlan_id
                spec.defaultPortConfig.vlan.inherited = false
                changed = true
            end

            return unless changed

            spec.configVersion = dpg['config.configVersion']

            begin
                dpg
                    .item
                    .ReconfigureDVPortgroup_Task(
                        :spec => spec
                    ).wait_for_completion
            rescue StandardError => e
                raise "The Distributed port group #{dpg['name']} \
                could not be created. "\
                        "Reason: #{e.message}"
            end

            @net_rollback << {
                :action => :update_dpg,
                    :dpg => dpg.item,
                    :name => dpg['name'],
                    :spec => orig_spec
            }
        end

        ########################################################################
        # Remove distributed port group from datacenter
        ########################################################################
        def remove_dpg(dpg)
            begin
                dpg.item.Destroy_Task.wait_for_completion
            rescue RbVmomi::VIM::ResourceInUse
                STDERR.puts "The distributed portgroup \
                #{dpg['name']} is in use so it cannot be deleted"
                nil
            rescue StandardError => e
                raise "The Distributed portgroup #{dpg['name']} \
                could not be deleted. Reason: #{e.message} "
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
                        nr[:dpg].ReconfigureDVPortgroup_Task(:spec => nr[:spec])
                                .wait_for_completion
                    rescue StandardError => e
                        raise "A rollback operation for distributed \
                        port group #{nr[:name]} could not \
                        be performed. Reason: #{e.message}"
                    end
                when :update_dvs
                    begin
                        nr[:dvs].ReconfigureDvs_Task(:spec => nr[:spec])
                                .wait_for_completion
                    rescue StandardError => e
                        raise "A rollback operation for distributed\
                         standard switch #{nr[:name]} could \
                         not be performed. Reason: #{e.message}"
                    end
                when :delete_dvs
                    begin
                        nr[:dvs].Destroy_Task.wait_for_completion
                    rescue RbVmomi::VIM::ResourceInUse
                        next # Ignore if switch in use
                    rescue RbVmomi::VIM::NotFound
                        next # Ignore if switch not found
                    rescue StandardError => e
                        raise "A rollback operation \
                        for standard switch #{nr[:name]} \
                            could not be performed. Reason: #{e.message}"
                    end
                when :delete_dpg
                    begin
                        nr[:dpg].Destroy_Task.wait_for_completion
                    rescue RbVmomi::VIM::ResourceInUse
                        next # Ignore if pg in use
                    rescue RbVmomi::VIM::NotFound
                        next # Ignore if pg not found
                    rescue StandardError => e
                        raise "A rollback operation for \
                        standard port group #{nr[:name]} could \
                        not be performed. Reason: #{e.message}"
                    end
                end
            end
        end

        ########################################################################
        # PowerOn VMs
        ########################################################################
        def power_on_vm(vm)
            @item.PowerOnMultiVM_Task({ :vm => [vm] }).wait_for_completion
        end

        def self.new_from_ref(ref, vi_client)
            new(RbVmomi::VIM::Datacenter.new(vi_client.vim, ref), vi_client)
        end

    end

end
# module VCenterDriver
