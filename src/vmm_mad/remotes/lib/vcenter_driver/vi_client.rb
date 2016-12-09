module VCenterDriver
    ################################################################################
    # This class represents a VCenter connection and an associated OpenNebula client
    # The connection is associated to the VCenter backing a given OpenNebula host.
    # For the VCenter driver each OpenNebula host represents a VCenter cluster
    ################################################################################
    class VIClient
        attr_reader :vim, :one, :root, :cluster, :user, :pass, :host, :dc

        def self.get_entities(folder, type, entities=[])
            return nil if folder == []

            folder.childEntity.each do |child|
                name, junk = child.to_s.split('(')

                case name
                when "Folder"
                    VIClient.get_entities(child, type, entities)
                when type
                    entities.push(child)
                end
            end

            return entities
        end

        # Only retrieve properties with faster search
        def get_entities_to_import(folder, type)
             res = folder.inventory_flat(type => :all)
             objects = []

             res.each {|k,v|
                if k.to_s.split('(').first == type
                    obj = {}
                    v.propSet.each{ |dynprop|
                        obj[dynprop.name] = dynprop.val
                    }
                    obj[:ref] = k._ref
                    objects << OpenStruct.new(obj)
                end
            }
            return objects
        end

        ############################################################################
        # Initialize the VIClient, and creates an OpenNebula client. The parameters
        # are obtained from the associated OpenNebula host
        # @param hid [Integer] The OpenNebula host id with VCenter attributes
        ############################################################################
        def initialize(hid)

            initialize_one

            @one_host = ::OpenNebula::Host.new_with_id(hid, @one)
            rc = @one_host.info

            if ::OpenNebula.is_error?(rc)
                raise "Error getting host information: #{rc.message}"
            end

            password = @one_host["TEMPLATE/VCENTER_PASSWORD"]

            if !@token.nil?
                begin
                    cipher = OpenSSL::Cipher::Cipher.new("aes-256-cbc")

                    cipher.decrypt
                    cipher.key = @token

                    password =  cipher.update(Base64::decode64(password))
                    password << cipher.final
                rescue
                    raise "Error decrypting vCenter password"
                end
            end

            connection = {
                :host     => @one_host["TEMPLATE/VCENTER_HOST"],
                :user     => @one_host["TEMPLATE/VCENTER_USER"],
                :password => password
            }

            initialize_vim(connection)

            datacenters = VIClient.get_entities(@root, 'Datacenter')

            datacenters.each {|dc|
                ccrs = VIClient.get_entities(dc.hostFolder, 'ClusterComputeResource')

                next if ccrs.nil?

                @cluster = ccrs.find{ |ccr| @one_host.name == ccr.name }

                (@dc = dc; break) if @cluster
            }

            if @dc.nil? || @cluster.nil?
                raise "Cannot find DataCenter or ClusterComputeResource for host."
            end
        end

        ########################################################################
        # Initialize a VIConnection based just on the VIM parameters. The
        # OpenNebula client is also initialized
        ########################################################################
        def self.new_connection(user_opts, one_client=nil)

            conn = allocate

            conn.initialize_one(one_client)

            conn.initialize_vim(user_opts)

            return conn
        end

        ########################################################################
        # The associated cluster for this connection
        ########################################################################
        def cluster
           @cluster
        end

        ########################################################################
        # Is this Cluster confined in a resource pool?
        ########################################################################
        def rp_confined?
           !@one_host["TEMPLATE/VCENTER_RESOURCE_POOL"].nil?
        end

        ########################################################################
        # The associated resource pool for this connection
        # @return [ResourcePool] an array of resource pools including the default
        #    resource pool. If the connection is confined to a particular
        #    resource pool, then return just that one
        ########################################################################
        def resource_pool
            rp_name = @one_host["TEMPLATE/VCENTER_RESOURCE_POOL"]

           if rp_name.nil?
              rp_array = @cluster.resourcePool.resourcePool
              rp_array << @cluster.resourcePool
              rp_array
           else
              [find_resource_pool(rp_name)]
           end
        end

        ########################################################################
        # Get the default resource pool of the connection. Only valid if
        # the connection is not confined in a resource pool
        # @return ResourcePool the default resource pool
        ########################################################################
        def default_resource_pool
            @cluster.resourcePool
        end

        ########################################################################
        # Searches the desired ResourcePool of the DataCenter for the current
        # connection. Returns a RbVmomi::VIM::ResourcePool or the default pool
        # if not found
        # @param rpool [String] the ResourcePool name
        ########################################################################
        def find_resource_pool(poolName)
            baseEntity = @cluster

            entityArray = poolName.split('/')
            entityArray.each do |entityArrItem|
              if entityArrItem != ''
                if baseEntity.is_a? RbVmomi::VIM::Folder
                    baseEntity = baseEntity.childEntity.find { |f|
                                      f.name == entityArrItem
                                  } or return @cluster.resourcePool
                elsif baseEntity.is_a? RbVmomi::VIM::ClusterComputeResource
                    baseEntity = baseEntity.resourcePool.resourcePool.find { |f|
                                      f.name == entityArrItem
                                  } or return @cluster.resourcePool
                elsif baseEntity.is_a? RbVmomi::VIM::ResourcePool
                    baseEntity = baseEntity.resourcePool.find { |f|
                                      f.name == entityArrItem
                                  } or return @cluster.resourcePool
                else
                    return @cluster.resourcePool
                end
              end
            end

            if !baseEntity.is_a?(RbVmomi::VIM::ResourcePool) and
                baseEntity.respond_to?(:resourcePool)
                  baseEntity = baseEntity.resourcePool
            end

            baseEntity
        end

        ########################################################################
        # Searches the associated vmFolder of the DataCenter for the current
        # connection. Returns a RbVmomi::VIM::VirtualMachine or nil if not found
        #
        # Searches by moref, name, uuid and then iterates over all VMs
        #
        # @param uuid [String] the UUID of the VM or VM Template
        # @param ref [String] VMware moref
        # @param name [String] VM name in vCenter
        ########################################################################
        def find_vm_fast(uuid, ref = nil, name = nil)
            if ref
                # It can raise ManagedObjectNotFound
                begin
                    vm = RbVmomi::VIM::VirtualMachine.new(@dc._connection, ref)
                    return vm if vm.config && vm.config.uuid == uuid
                rescue  => e
                end
            end

            if name
                begin
                    vm = @dc.vmFolder.find(name)
                    return vm if vm.config && vm.config.uuid == uuid
                rescue
                end
            end

            return find_vm_template(uuid)
        end

        ########################################################################
        # Searches the associated vmFolder of the DataCenter for the current
        # connection. Returns a RbVmomi::VIM::VirtualMachine or nil if not found
        # @param uuid [String] the UUID of the VM or VM Template
        ########################################################################
        def find_vm_template(uuid)
            version = @vim.serviceContent.about.version

            found_vm = nil
            found_vm = @dc.vmFolder.findByUuid(uuid, RbVmomi::VIM::VirtualMachine, @dc)
            return found_vm if found_vm

            vms = VIClient.get_entities(@dc.vmFolder, 'VirtualMachine')

            return vms.find do |v|
                 begin
                     v.config && v.config.uuid == uuid
                 rescue RbVmomi::VIM::ManagedObjectNotFound
                     false
                 end
            end
        end

        ########################################################################
        # Searches the associated vmFolder of the DataCenter for the current
        # connection. Returns a RbVmomi::VIM::VirtualMachine or nil if not found
        # @param vm_name [String] the UUID of the VM or VM Template
        ########################################################################
        def find_vm(vm_name)
            vms = VIClient.get_entities(@dc.vmFolder, 'VirtualMachine')

            return vms.find do |v|
                begin
                    v.name == vm_name
                rescue RbVmomi::VIM::ManagedObjectNotFound
                    false
                end
            end
        end

        ########################################################################
        # Searches the associated datacenter for a particular datastore
        # @param ds_name [String] name of the datastore
        # @returns a RbVmomi::VIM::VirtualMachine or nil if not found
        ########################################################################
        def get_datastore(ds_name)
            datastores = VIClient.get_entities(@dc.datastoreFolder, 'Datastore')

            storage_pods = VIClient.get_entities(@dc.datastoreFolder, 'StoragePod')
            storage_pods.each { |sp|
                datastores << sp #Add StoragePod

                # Add individual datastores under StoragePod
                storage_pod_datastores = VIClient.get_entities(sp, 'Datastore')
                if not storage_pod_datastores.empty?
                    datastores.concat(storage_pod_datastores)
                end
            }

            ds         = datastores.select{|ds| ds.name == ds_name}[0]
        end

        ########################################################################
        # Builds a hash with the DataCenter / ClusterComputeResource hierarchy
        # for this VCenter.
        # @return [Hash] in the form
        #   {dc_name [String] => ClusterComputeResources Names [Array - String]}
        ########################################################################
        def hierarchy(one_client=nil)
            vc_hosts = {}

            datacenters = VIClient.get_entities(@root, 'Datacenter')

            hpool = OpenNebula::HostPool.new((one_client||@one))
            rc    = hpool.info

            datacenters.each { |dc|
                ccrs = VIClient.get_entities(dc.hostFolder, 'ClusterComputeResource')
                vc_hosts[dc.name] = []
                ccrs.each { |c|
                    if !hpool["HOST[NAME=\"#{c.name}\"]"]
                        vc_hosts[dc.name] << c.name
                    end
                  }
            }

            return vc_hosts
        end

        ########################################################################
        # Builds a hash with the Datacenter / VM Templates for this VCenter
        # @param one_client [OpenNebula::Client] Use this client instead of @one
        # @return [Hash] in the form
        #   { dc_name [String] => Templates [Array] }
        ########################################################################
        def vm_templates(one_client=nil)
            vm_templates = {}

            tpool = OpenNebula::TemplatePool.new(
                (one_client||@one), OpenNebula::Pool::INFO_ALL)
            rc = tpool.info
            if OpenNebula.is_error?(rc)
                raise "Error contacting OpenNebula #{rc.message}"
            end

            datacenters = VIClient.get_entities(@root, 'Datacenter')

            datacenters.each { |dc|
                vms = get_entities_to_import(dc.vmFolder, 'VirtualMachine')

                tmp = vms.select { |v| v.config && (v.config.template == true) }

                one_tmp    = []
                host_cache = {}
                ds_cache   = {}

                tmp.each { |t|
                    vi_tmp = VCenterVm.new(self, t)

                    if !tpool["VMTEMPLATE/TEMPLATE/PUBLIC_CLOUD[\
                            TYPE=\"vcenter\" \
                            and VM_TEMPLATE=\"#{vi_tmp.vm.config.uuid}\"]"]
                        # Check cached objects
                        if !host_cache[vi_tmp.vm.runtime.host.to_s]
                            host_cache[vi_tmp.vm.runtime.host.to_s] =
                                       VCenterCachedHost.new vi_tmp.vm.runtime.host
                        end

                        if !ds_cache[t.datastore[0].to_s]
                            ds_cache[t.datastore[0].to_s] =
                                       VCenterCachedDatastore.new  t.datastore[0]
                        end

                        host = host_cache[vi_tmp.vm.runtime.host.to_s]
                        ds   = ds_cache[t.datastore[0].to_s]

                        one_tmp << {
                            :name           => "#{vi_tmp.vm.name} - #{host.cluster_name}",
                            :uuid           => vi_tmp.vm.config.uuid,
                            :host           => host.cluster_name,
                            :one            => vi_tmp.to_one(host),
                            :ds             => vi_tmp.to_one_ds(host, ds.name),
                            :default_ds     => ds.name,
                            :rp             => vi_tmp.to_one_rp(host),
                            :vcenter_ref    => vi_tmp.vm._ref,
                            :vcenter_name   => vi_tmp.vm.name
                        }
                    end
                }

                vm_templates[dc.name] = one_tmp
            }

            return vm_templates
        end

        ########################################################################
        # Builds a hash with the Datacenter / CCR (Distributed)Networks
        # for this VCenter
        # @param one_client [OpenNebula::Client] Use this client instead of @one
        # @return [Hash] in the form
        #   { dc_name [String] => Networks [Array] }
        ########################################################################
        def vcenter_networks(one_client=nil)
            vcenter_networks = {}

            vnpool = OpenNebula::VirtualNetworkPool.new(
                (one_client||@one), OpenNebula::Pool::INFO_ALL)
            rc     = vnpool.info
            if OpenNebula.is_error?(rc)
                raise "Error contacting OpenNebula #{rc.message}"
            end

            datacenters = VIClient.get_entities(@root, 'Datacenter')

            datacenters.each { |dc|
                networks = VIClient.get_entities(dc.networkFolder, 'Network' )
                one_nets = []

                networks.each { |n|
                    # Skip those not in cluster
                    next if !n[:host][0]

                   # Networks can be in several cluster, create one per cluster
                    net_names = []
                    Array(n[:host]).each{ |host_system|
                        net_name = "#{n.name} - #{host_system.parent.name}"
                        if !net_names.include?(net_name)
                            if !vnpool["VNET[BRIDGE=\"#{n[:name]}\"]/\
                                    TEMPLATE[VCENTER_TYPE=\"Port Group\"]"]
                                one_nets << {
                                    :name    => net_name,
                                    :bridge  => n.name,
                                    :cluster => host_system.parent.name,
                                    :type    => "Port Group",
                                    :one     => "NAME   = \"#{net_name}\"\n" \
                                                "BRIDGE = \"#{n[:name]}\"\n" \
                                                "VN_MAD = \"dummy\"\n" \
                                                "VCENTER_TYPE = \"Port Group\""
                                }
                                net_names << net_name
                            end
                        end
                    }
                }

                networks = VIClient.get_entities(dc.networkFolder,
                                                 'DistributedVirtualPortgroup' )

                networks.each { |n|
                    # Skip those not in cluster
                    next if !n[:host][0]

                    # DistributedVirtualPortgroup can be in several cluster,
                    # create one per cluster
                    Array(n[:host][0]).each{ |host_system|
                     net_name = "#{n.name} - #{n[:host][0].parent.name}"

                     if !vnpool["VNET[BRIDGE=\"#{n[:name]}\"]/\
                             TEMPLATE[VCENTER_TYPE=\"Distributed Port Group\"]"]
                         vnet_template = "NAME   = \"#{net_name}\"\n" \
                                         "BRIDGE = \"#{n[:name]}\"\n" \
                                         "VN_MAD = \"dummy\"\n" \
                                         "VCENTER_TYPE = \"Distributed Port Group\""

                         default_pc = n.config.defaultPortConfig

                         has_vlan = false
                         vlan_str = ""

                         if default_pc.methods.include? :vlan
                            has_vlan = default_pc.vlan.methods.include? :vlanId
                         end

                         if has_vlan
                             vlan     = n.config.defaultPortConfig.vlan.vlanId

                             if vlan != 0
                                 if vlan.is_a? Array
                                     vlan.each{|v|
                                         vlan_str += v.start.to_s + ".." +
                                                     v.end.to_s + ","
                                     }
                                     vlan_str.chop!
                                 else
                                     vlan_str = vlan.to_s
                                 end
                             end
                         end

                         if !vlan_str.empty?
                             vnet_template << "VLAN_TAGGED_ID=#{vlan_str}\n"
                         end

                         one_net = {:name    => net_name,
                                    :bridge  => n.name,
                                    :cluster => host_system.parent.name,
                                    :type   => "Distributed Port Group",
                                    :one    => vnet_template}

                         one_net[:vlan] = vlan_str if !vlan_str.empty?

                         one_nets << one_net
                     end
                    }
                }

                vcenter_networks[dc.name] = one_nets
            }

            return vcenter_networks
        end


        ########################################################################
        # Builds a hash with the Datacenter / Datastores for this VCenter
        # @param one_client [OpenNebula::Client] Use this client instead of @one
        # @return [Hash] in the form
        #   { dc_name [String] => Datastore [Array] of DS templates}
        ########################################################################
        def vcenter_datastores(one_client=nil)
            ds_templates = {}

            dspool = OpenNebula::DatastorePool.new(
                (one_client||@one))
            rc = dspool.info
            if OpenNebula.is_error?(rc)
                raise "Error contacting OpenNebula #{rc.message}"
            end

            hpool = OpenNebula::HostPool.new(
                (one_client||@one))
            rc = hpool.info
            if OpenNebula.is_error?(rc)
                raise "Error contacting OpenNebula #{rc.message}"
            end

            datacenters = VIClient.get_entities(@root, 'Datacenter')

            datacenters.each { |dc|
                one_tmp = []
                datastores = VIClient.get_entities(dc.datastoreFolder, 'Datastore')

                storage_pods = VIClient.get_entities(dc.datastoreFolder, 'StoragePod')
                storage_pods.each { |sp|
                    datastores << sp # Add StoragePod
                    storage_pod_datastores = VIClient.get_entities(sp, 'Datastore')
                    if not storage_pod_datastores.empty?
                        datastores.concat(storage_pod_datastores)
                    end
                }

                datastores.each { |ds|
                    next if !ds.is_a? RbVmomi::VIM::Datastore and !ds.is_a? RbVmomi::VIM::StoragePod
                    # Find the Cluster from which to access this ds

                    cluster_name = ""
                    if ds.is_a? RbVmomi::VIM::StoragePod
                        storage_pod_datastores = VIClient.get_entities(ds, 'Datastore')
                        storage_pod_datastores.each { |sp|
                            next if !sp.is_a? RbVmomi::VIM::Datastore
                            # Find the Cluster from which to access this ds
                            next if !sp.host[0]
                            cluster_name = sp.host[0].key.parent.name
                            break
                        }
                    else
                        next if !ds.host[0]
                        cluster_name = ds.host[0].key.parent.name
                    end

                    if !dspool["DATASTORE[NAME=\"#{ds.name}\"]"] and
                       hpool["HOST[NAME=\"#{cluster_name}\"]"]
                       if ds.is_a? RbVmomi::VIM::StoragePod
                            one_tmp << {
                                :name     => "#{ds.name}",
                                :total_mb => ((ds.summary.capacity.to_i / 1024) / 1024),
                                :free_mb  => ((ds.summary.freeSpace.to_i / 1024) / 1024),
                                :cluster  => cluster_name,
                                :one  => "NAME=#{ds.name}\n"\
                                         "TM_MAD=vcenter\n"\
                                         "VCENTER_CLUSTER=#{cluster_name}\n"\
                                         "TYPE=SYSTEM_DS\n" # StoragePods must be set as SYSTEM_DS
                            }
                       else
                             one_tmp << {
                                :name     => "#{ds.name}",
                                :total_mb => ((ds.summary.capacity.to_i / 1024) / 1024),
                                :free_mb  => ((ds.summary.freeSpace.to_i / 1024) / 1024),
                                :cluster  => cluster_name,
                                :one  => "NAME=#{ds.name}\n"\
                                            "DS_MAD=vcenter\n"\
                                            "TM_MAD=vcenter\n"\
                                            "VCENTER_CLUSTER=#{cluster_name}\n"
                            }
                       end
                    end
                }
                ds_templates[dc.name] = one_tmp
            }

            return ds_templates
        end

       #############################################################################
        # Builds a hash with the Images for a particular datastore
        # @param one_client [OpenNebula::Client] Use this client instead of @one
        # @return [Array] of image templates
        ############################################################################
        def vcenter_images(ds_name, one_client=nil)
            img_types = ["FloppyImageFileInfo",
                         "IsoImageFileInfo",
                         "VmDiskFileInfo"]

            img_templates = []

            ipool = OpenNebula::ImagePool.new((one_client||@one))
            rc = ipool.info
            if OpenNebula.is_error?(rc)
                raise "Error contacting OpenNebula #{rc.message}"
            end

            dspool = OpenNebula::DatastorePool.new((one_client||@one))
            rc = dspool.info
            if OpenNebula.is_error?(rc)
                raise "Error contacting OpenNebula #{rc.message}"
            end

            ds_id = dspool["DATASTORE[NAME=\"#{ds_name}\"]/ID"]

            if !ds_id
                raise "Datastore not found in OpenNebula. Please import"\
                      " it first and try again"
            end

            datacenters = VIClient.get_entities(@root, 'Datacenter')

            datacenters.each { |dc|

                # Find datastore within datacenter
                datastores = VIClient.get_entities(dc.datastoreFolder, 'Datastore')

                storage_pods = VIClient.get_entities(dc.datastoreFolder, 'StoragePod')
                storage_pods.each { |sp|
                    storage_pod_datastores = VIClient.get_entities(sp, 'Datastore')
                    if not storage_pod_datastores.empty?
                        datastores.concat(storage_pod_datastores)
                    end
                }

                ds         = datastores.select{|ds| ds.name == ds_name}[0]
                next if !ds

                # Cannot import from StoragePod directly
                if ds.is_a? RbVmomi::VIM::StoragePod
                    raise "OpenNebula cannot import images from a StoragePod. Please import"\
                          " it from the datastore which is a member of the StorageDRS cluster"
                end

                # Create Search Spec
                spec         = RbVmomi::VIM::HostDatastoreBrowserSearchSpec.new
                spec.query   = [RbVmomi::VIM::VmDiskFileQuery.new,
                                RbVmomi::VIM::IsoImageFileQuery.new]
                spec.details = RbVmomi::VIM::FileQueryFlags(:fileOwner => true,
                                                            :fileSize => true,
                                                            :fileType => true,
                                                            :modification => true)
                spec.matchPattern=[]

                search_params = {'datastorePath' => "[#{ds.name}]",
                                 'searchSpec'    => spec}

                # Perform search task and return results
                search_task=ds.browser.SearchDatastoreSubFolders_Task(search_params)
                search_task.wait_for_completion

                search_task.info.result.each { |image|
                    folderpath = ""
                    if image.folderPath[-1] != "]"
                        folderpath = image.folderPath.sub(/^\[#{ds_name}\] /, "")
                    end

                    image = image.file[0]

                    # Skip not relevant files
                    next if !img_types.include? image.class.to_s

                    image_path = folderpath + image.path

                    image_name = File.basename(image.path).reverse.sub("kdmv.","").reverse

                    if !ipool["IMAGE[NAME=\"#{image_name} - #{ds_name}\"]"]
                        img_templates << {
                            :name        => "#{image_name} - #{ds_name}",
                            :path        => image_path,
                            :size        => (image.fileSize / 1024).to_s,
                            :type        => image.class.to_s,
                            :dsid        => ds_id,
                            :one         => "NAME=\"#{image_name} - #{ds_name}\"\n"\
                                            "PATH=\"vcenter://#{image_path}\"\n"\
                                            "PERSISTENT=\"YES\"\n"\
                        }

                        if image.class.to_s == "VmDiskFileInfo"
                            img_templates[-1][:one] += "TYPE=\"OS\"\n"
                        else
                            img_templates[-1][:one] += "TYPE=\"CDROM\"\n"
                        end

                        if image.class.to_s == "VmDiskFileInfo" &&
                           !image.diskType.nil?
                            img_templates[-1][:one] += "DISK_TYPE=#{image.diskType}\n"
                        end
                    end
                }
            }

            return img_templates
        end

        def self.translate_hostname(hostname)
            host_pool = OpenNebula::HostPool.new(::OpenNebula::Client.new())
            rc        = host_pool.info
            raise "Could not find host #{hostname}" if OpenNebula.is_error?(rc)

            host = host_pool.select {|host_element| host_element.name==hostname }
            return host.first.id
        end

        def self.find_ds_name(ds_id)
            ds = OpenNebula::Datastore.new_with_id(ds_id, OpenNebula::Client.new)
            rc = ds.info
            raise "Could not find datastore #{ds_id}" if OpenNebula.is_error?(rc)

            return ds["/DATASTORE/TEMPLATE/VCENTER_NAME"]
        end

        ############################################################################
        # Initialize an OpenNebula connection with the default ONE_AUTH
        ############################################################################
        def initialize_one(one_client=nil)
            begin
                if one_client
                    @one = one_client
                else
                    @one = ::OpenNebula::Client.new()
                end

                system = ::OpenNebula::System.new(@one)

                config = system.get_configuration()

                if ::OpenNebula.is_error?(config)
                    raise "Error getting oned configuration : #{config.message}"
                end

                @token = config["ONE_KEY"]
            rescue Exception => e
                raise "Error initializing OpenNebula client: #{e.message}"
            end
        end

        ############################################################################
        # Initialize a connection with vCenter. Options
        # @param options[Hash] with:
        #    :user => The vcenter user
        #    :password => Password for the user
        #    :host => vCenter hostname or IP
        #    :insecure => SSL (optional, defaults to true)
        ############################################################################
        def initialize_vim(user_opts={})
            opts = {
                :insecure => true
            }.merge(user_opts)

            @user = opts[:user]
            @pass = opts[:password]
            @host = opts[:host]

            begin
                @vim  = RbVmomi::VIM.connect(opts)
                @root = @vim.root
                @vdm  = @vim.serviceContent.virtualDiskManager
                @file_manager  = @vim.serviceContent.fileManager
            rescue Exception => e
                raise "Error connecting to #{@host}: #{e.message}"
            end
        end

        ######################### Datastore Operations #############################

        ############################################################################
        # Retrieve size for a VirtualDisk in a particular datastore
        # @param ds_name [String] name of the datastore
        # @param img_str [String] path to the VirtualDisk
        # @return size of the file in Kb
        ############################################################################
        def stat(ds_name, img_str)
            img_path = File.dirname img_str
            img_name = File.basename img_str

            # Find datastore within datacenter
            ds = get_datastore(ds_name)

            # Create Search Spec
            spec         = RbVmomi::VIM::HostDatastoreBrowserSearchSpec.new
            spec.query   = [RbVmomi::VIM::VmDiskFileQuery.new,
                            RbVmomi::VIM::IsoImageFileQuery.new]
            spec.details = RbVmomi::VIM::FileQueryFlags(:fileOwner    => true,
                                                        :fileSize     => true,
                                                        :fileType     => true,
                                                        :modification => true)
            spec.matchPattern=[img_name]

            search_params = {'datastorePath' => "[#{ds_name}] #{img_path}",
                             'searchSpec'    => spec}

            # Perform search task and return results
            search_task=ds.browser.SearchDatastoreSubFolders_Task(search_params)
            search_task.wait_for_completion
            (search_task.info.result[0].file[0].fileSize / 1024) / 1024
        end

        ############################################################################
        # Returns Datastore information
        # @param ds_name [String] name of the datastore
        # @return [String] monitor information of the DS
        ############################################################################
        def monitor_ds(ds_name)
            # Find datastore within datacenter
            ds = get_datastore(ds_name)

            total_mb = (ds.summary.capacity.to_i / 1024) / 1024
            free_mb = (ds.summary.freeSpace.to_i / 1024) / 1024
            used_mb = total_mb - free_mb

            if ds.is_a? RbVmomi::VIM::Datastore
                ds_type = ds.summary.type
            end

            "USED_MB=#{used_mb}\nFREE_MB=#{free_mb} \nTOTAL_MB=#{total_mb}"
        end

        ############################################################################
        # Copy a VirtualDisk
        # @param ds_name [String] name of the datastore
        # @param img_str [String] path to the VirtualDisk
        ############################################################################
        def copy_virtual_disk(source_path, source_ds, target_path, target_ds=nil)
            target_ds = source_ds if target_ds.nil?

            copy_params= {:sourceName => "[#{source_ds}] #{source_path}",
                          :sourceDatacenter => @dc,
                          :destName => "[#{target_ds}] #{target_path}"}

            @vdm.CopyVirtualDisk_Task(copy_params).wait_for_completion

            target_path
        end

        ############################################################################
        # Create a VirtualDisk
        # @param img_name [String] name of the image
        # @param ds_name  [String] name of the datastore on which the VD will be
        #                         created
        # @param size     [String] size of the new image in MB
        # @param adapter_type [String] as described in
        #   http://pubs.vmware.com/vsphere-60/index.jsp#com.vmware.wssdk.apiref.doc/vim.VirtualDiskManager.VirtualDiskAdapterType.html
        # @param disk_type [String] as described in
        #   http://pubs.vmware.com/vsphere-60/index.jsp?topic=%2Fcom.vmware.wssdk.apiref.doc%2Fvim.VirtualDiskManager.VirtualDiskType.html
        # @return name of the final image
        ############################################################################
        def create_virtual_disk(img_name, ds_name, size, adapter_type, disk_type)
            vmdk_spec = RbVmomi::VIM::FileBackedVirtualDiskSpec(
                :adapterType => adapter_type,
                :capacityKb  => size.to_i*1024,
                :diskType    => disk_type
            )

            @vdm.CreateVirtualDisk_Task(
              :datacenter => @dc,
              :name       => "[#{ds_name}] #{img_name}.vmdk",
              :spec       => vmdk_spec
            ).wait_for_completion

            "#{img_name}.vmdk"
        end

        ############################################################################
        # Delete a VirtualDisk
        # @param img_name [String] name of the image
        # @param ds_name  [String] name of the datastore where the VD resides
        ############################################################################
        def delete_virtual_disk(img_name, ds_name)
            @vdm.DeleteVirtualDisk_Task(
              name: "[#{ds_name}] #{img_name}",
              datacenter: @dc
            ).wait_for_completion
        end

        ############################################################################
        # Delete a VirtualDisk
        # @param directory  [String] name of the new directory
        # @param ds_name    [String] name of the datastore where to create the dir
        ############################################################################
        def create_directory(directory, ds_name)
            begin
                path = "[#{ds_name}] #{directory}"
                @file_manager.MakeDirectory(:name => path,
                                            :datacenter => @dc,
                                            :createParentDirectories => true)
            rescue RbVmomi::VIM::FileAlreadyExists => e
            end
        end

        ############################################################################
        # Silences standard output and error
        ############################################################################
        def self.in_silence
            begin
              orig_stderr = $stderr.clone
              orig_stdout = $stdout.clone
              $stderr.reopen File.new('/dev/null', 'w')
              $stdout.reopen File.new('/dev/null', 'w')
              retval = yield
            rescue Exception => e
              $stdout.reopen orig_stdout
              $stderr.reopen orig_stderr
              raise e
            ensure
              $stdout.reopen orig_stdout
              $stderr.reopen orig_stderr
            end
           retval
        end

        ############################################################################
        # Silences standard output and error
        ############################################################################
        def self.in_stderr_silence
            begin
              orig_stderr = $stderr.clone
              $stderr.reopen File.new('/dev/null', 'w')
              retval = yield
            rescue Exception => e
              $stderr.reopen orig_stderr
              raise e
            ensure
              $stderr.reopen orig_stderr
            end
           retval
        end
    end
end
