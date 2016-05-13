# ---------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

# -------------------------------------------------------------------------#
# Set up the environment for the driver                                    #
# -------------------------------------------------------------------------#
ONE_LOCATION = ENV["ONE_LOCATION"] if !defined?(ONE_LOCATION)

if !ONE_LOCATION
   BIN_LOCATION = "/usr/bin" if !defined?(BIN_LOCATION)
   LIB_LOCATION = "/usr/lib/one" if !defined?(LIB_LOCATION)
   ETC_LOCATION = "/etc/one/" if !defined?(ETC_LOCATION)
   VAR_LOCATION = "/var/lib/one" if !defined?(VAR_LOCATION)
else
   BIN_LOCATION = ONE_LOCATION + "/bin" if !defined?(BIN_LOCATION)
   LIB_LOCATION = ONE_LOCATION + "/lib" if !defined?(LIB_LOCATION)
   ETC_LOCATION = ONE_LOCATION  + "/etc/" if !defined?(ETC_LOCATION)
   VAR_LOCATION = ONE_LOCATION + "/var/" if !defined?(VAR_LOCATION)
end

ENV['LANG'] = 'C'

$: << LIB_LOCATION+'/ruby/vendors/rbvmomi/lib'
$: << LIB_LOCATION+'/ruby'

require 'ostruct'
require 'rbvmomi'
require 'yaml'
require 'opennebula'
require 'base64'
require 'openssl'
require 'openssl'
require 'VirtualMachineDriver'


################################################################################
# Monkey patch rbvmomi library with some extra functions
################################################################################

class RbVmomi::VIM::Datastore

    # Download a file from this datastore.
    # @param remote_path [String] Source path on the datastore.
    # @param local_path [String] Destination path on the local machine.
    # @return [void]
    def download_to_stdout remote_path
        url = "http#{_connection.http.use_ssl? ? 's' : ''}://#{_connection.http.address}:#{_connection.http.port}#{mkuripath(remote_path)}"

        pid = spawn CURLBIN, "-k", '--noproxy', '*', '-f',
                    "-b", _connection.cookie,
                    url


        Process.waitpid(pid, 0)
        fail "download failed" unless $?.success?
    end

    def is_descriptor? remote_path
        url = "http#{_connection.http.use_ssl? ? 's' : ''}://#{_connection.http.address}:#{_connection.http.port}#{mkuripath(remote_path)}"

        rout, wout = IO.pipe

        pid = spawn CURLBIN, "-I", "-k", '--noproxy', '*', '-f',
                    "-b", _connection.cookie,
                    url,
                    :out => wout,
                    :err => '/dev/null'

        Process.waitpid(pid, 0)
        fail "read image header failed" unless $?.success?

        wout.close
        size = rout.readlines.select{|l| l.start_with?("Content-Length")}[0].sub("Content-Length: ","")
        rout.close
        size.chomp.to_i < 4096   # If <4k, then is a descriptor
    end

    def get_text_file remote_path
        url = "http#{_connection.http.use_ssl? ? 's' : ''}://#{_connection.http.address}:#{_connection.http.port}#{mkuripath(remote_path)}"

        rout, wout = IO.pipe
        pid = spawn CURLBIN, "-k", '--noproxy', '*', '-f',
                    "-b", _connection.cookie,
                    url,
                    :out => wout,
                    :err => '/dev/null'

        Process.waitpid(pid, 0)
        fail "get text file failed" unless $?.success?

        wout.close
        output = rout.readlines
        rout.close
        return output
    end

end

module VCenterDriver

################################################################################
# This class represents a VCenter connection and an associated OpenNebula client
# The connection is associated to the VCenter backing a given OpenNebula host.
# For the VCenter driver each OpenNebula host represents a VCenter cluster
################################################################################
class VIClient
    attr_reader :vim, :one, :root, :cluster, :user, :pass, :host, :dc

    def get_entities(folder, type, entities=[])
        return nil if folder == []

        folder.childEntity.each do |child|
            name, junk = child.to_s.split('(')

            case name
            when "Folder"
                get_entities(child, type, entities)
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
                objects << OpenStruct.new(obj)
            end
        }
        return objects
    end

    ############################################################################
    # Initializr the VIClient, and creates an OpenNebula client. The parameters
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

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each {|dc|
            ccrs = get_entities(dc.hostFolder, 'ClusterComputeResource')

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
    # OpenNebula client is also initilialized
    ########################################################################
    def self.new_connection(user_opts)

        conn = allocate

        conn.initialize_one

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
    # @param uuid [String] the UUID of the VM or VM Template
    ########################################################################
    def find_vm_template(uuid)
        version = @vim.serviceContent.about.version

        if version.split(".").first.to_i >= 6
            @dc.vmFolder.findByUuid(uuid, RbVmomi::VIM::VirtualMachine, @dc)
        else
            vms = get_entities(@dc.vmFolder, 'VirtualMachine')

            return vms.find do |v|
                begin
                    v.config && v.config.uuid == uuid
                rescue RbVmomi::VIM::ManagedObjectNotFound
                    false
                end
            end
        end
    end

    ########################################################################
    # Searches the associated vmFolder of the DataCenter for the current
    # connection. Returns a RbVmomi::VIM::VirtualMachine or nil if not found
    # @param vm_name [String] the UUID of the VM or VM Template
    ########################################################################
    def find_vm(vm_name)
        vms = get_entities(@dc.vmFolder, 'VirtualMachine')

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
        ds = @dc.datastoreFolder.childEntity.select{|ds| ds.name == ds_name}[0]
    end

    ########################################################################
    # Builds a hash with the DataCenter / ClusterComputeResource hierarchy
    # for this VCenter.
    # @return [Hash] in the form
    #   {dc_name [String] => ClusterComputeResources Names [Array - String]}
    ########################################################################
    def hierarchy(one_client=nil)
        vc_hosts = {}

        datacenters = get_entities(@root, 'Datacenter')

        hpool = OpenNebula::HostPool.new((one_client||@one))
        rc    = hpool.info

        datacenters.each { |dc|
            ccrs = get_entities(dc.hostFolder, 'ClusterComputeResource')
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

        datacenters = get_entities(@root, 'Datacenter')

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
                        :name       => "#{vi_tmp.vm.name} - #{host.cluster_name}",
                        :uuid       => vi_tmp.vm.config.uuid,
                        :host       => host.cluster_name,
                        :one        => vi_tmp.to_one(host),
                        :ds         => vi_tmp.to_one_ds(host, ds.name),
                        :default_ds => ds.name,
                        :rp         => vi_tmp.to_one_rp(host)
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

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|
            networks = get_entities(dc.networkFolder, 'Network' )
            one_nets = []

            networks.each { |n|
                # Skip those not in cluster
                next if !n[:host][0]

                # Networks can be in several cluster, create one per cluster
                Array(n[:host][0]).each{ |host_system|
                    net_name = "#{n.name} - #{host_system.parent.name}"

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
                    end
                }
            }

            networks = get_entities(dc.networkFolder,
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
                         vnet_template << "VLAN_ID=#{vlan_str}\n"
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

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|
            one_tmp = []
            dc.datastoreFolder.childEntity.each { |ds|
                # Find the Cluster from which to access this ds
                cluster_name = ds.host[0].key.parent.name

                if !dspool["DATASTORE[NAME=\"#{ds.name}\"]"] and
                   hpool["HOST[NAME=\"#{cluster_name}\"]"]
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

        datacenters = get_entities(@root, 'Datacenter')

        datacenters.each { |dc|

            # Find datastore within datacenter
            ds=dc.datastoreFolder.childEntity.select{|ds|
                                                     ds.name == ds_name}[0]

            # Create Search Spec
            spec         = RbVmomi::VIM::HostDatastoreBrowserSearchSpec.new
            spec.query   = [RbVmomi::VIM::VmDiskFileQuery.new]
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

                if !ipool["IMAGE[NAME=\"#{image_name}\"]"]
                    img_templates << {
                        :name        => "#{image_name}",
                        :path        => image_path,
                        :size        => (image.fileSize / 1024).to_s,
                        :type        => image.class.to_s,
                        :dsid        => ds_id,
                        :one         => "NAME=\"#{image_name}\"\n"\
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
        ds = OpenNebula::Datastore.new_with_id(ds_id)
        rc = ds.info
        raise "Could not find datastore #{ds_id}" if OpenNebula.is_error?(rc)

        return ds.name
    end

    ############################################################################
    # Initialize an OpenNebula connection with the default ONE_AUTH
    ############################################################################
    def initialize_one
        begin
            @one   = ::OpenNebula::Client.new()
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
        spec.query   = [RbVmomi::VIM::VmDiskFileQuery.new]
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
        ds_type = ds.summary.type

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

###########
#  Cached Classes to speed up import and monitorization
############
class VCenterCachedHost

    def initialize(rbVmomiHost)
        @host       = rbVmomiHost
        @attributes = Hash.new
    end

    def name
        if !@attributes['name']
            @attributes['name']=@host.parent.name
        end
        @attributes['name']
    end

    def cluster_name
        if !@attributes['cluster_name']
            @attributes['cluster_name']=@host.parent.name
        end
        @attributes['cluster_name']
    end

    def ds_list
        if !@attributes['ds_list']
            @attributes['ds_list']=""
            @host.parent.parent.parent.datastoreFolder.childEntity.each { |ds|
                @attributes['ds_list'] += ds.name + ","
            }
            @attributes['ds_list']=@attributes['ds_list'][0..-2]
        end
        @attributes['ds_list']
    end

    def rp_list
        if !@attributes['rp_list']
            @attributes['rp_list']=""
            @host.parent.resourcePool.resourcePool.each{|rp|
                @attributes['rp_list'] += get_child_rp_names(rp, "")
            }
            @attributes['rp_list']=@attributes['rp_list'][0..-2]
        end
        @attributes['rp_list']
    end

    def get_child_rp_names(rp, parent_prefix)
        rp_str = ""

        current_rp = (parent_prefix.empty? ? "" : parent_prefix + "/")
        current_rp += rp.name

        if rp.resourcePool.size != 0
            rp.resourcePool.each{|child_rp|
                rp_str += get_child_rp_names(child_rp, current_rp)
            }
        end

        rp_str += current_rp + ","

        return rp_str
    end

    def cpumhz
        if !@attributes['cpumhz']
            @attributes['cpumhz']=@host.summary.hardware.cpuMhz.to_f
        end
        @attributes['cpumhz']
    end

end

class VCenterCachedDatastore

    def initialize(rbVmomiDatastore)
        @ds         = rbVmomiDatastore
        @attributes = Hash.new
    end

    def name
        if !@attributes['name']
            @attributes['name']=@ds.name
        end
        @attributes['name']
    end


end

################################################################################
# This class is an OpenNebula hosts that abstracts a vCenter cluster. It
# includes the functionality needed to monitor the cluster and report the ESX
# hosts and VM status of the cluster.
################################################################################
class VCenterHost < ::OpenNebula::Host
    attr_reader :vc_client, :vc_root, :cluster, :host, :client

    ############################################################################
    # Initialize the VCenterHost by looking for the associated objects of the
    # VIM hierarchy
    # client [VIClient] to interact with the associated vCenter
    ############################################################################
    def initialize(client)
        @client  = client
        @cluster = client.cluster

        @resource_pools = client.resource_pool
    end

    ########################################################################
    #  Creates an OpenNebula host representing a cluster in this VCenter
    #  @param cluster_name[String] the name of the cluster in the vcenter
    #  @param client [VIClient] to create the host
    #  @return In case of success [0, host_id] or [-1, error_msg]
    ########################################################################
    def self.to_one(cluster_name, client)
        one_host = ::OpenNebula::Host.new(::OpenNebula::Host.build_xml,
            client.one)

        rc = one_host.allocate(cluster_name, 'vcenter', 'vcenter',
                ::OpenNebula::ClusterPool::NONE_CLUSTER_ID)

        return -1, rc.message if ::OpenNebula.is_error?(rc)

        template = "VCENTER_HOST=\"#{client.host}\"\n"\
                   "VCENTER_PASSWORD=\"#{client.pass}\"\n"\
                   "VCENTER_USER=\"#{client.user}\"\n"

        rc = one_host.update(template, false)

        if ::OpenNebula.is_error?(rc)
            error = rc.message

            rc = one_host.delete

            if ::OpenNebula.is_error?(rc)
                error << ". Host #{cluster_name} could not be"\
                    " deleted: #{rc.message}."
            end

            return -1, error
        end

        return 0, one_host.id
    end

    ############################################################################
    # Generate an OpenNebula monitor string for this host. Reference:
    # https://www.vmware.com/support/developer/vc-sdk/visdk25pubs/Reference
    # Guide/vim.ComputeResource.Summary.html
    #   - effectiveCpu: Effective CPU resources (in MHz) available to run
    #     VMs. This is the aggregated from all running hosts excluding hosts in
    #     maintenance mode or unresponsive are not counted.
    #   - effectiveMemory: Effective memory resources (in MB) available to run
    #     VMs. Equivalente to effectiveCpu.
    #   - numCpuCores: Number of physical CPU cores.
    #   - numEffectiveHosts: Total number of effective hosts.
    #   - numHosts:Total number of hosts.
    #   - totalCpu: Aggregated CPU resources of all hosts, in MHz.
    #   - totalMemory: Aggregated memory resources of all hosts, in bytes.
    ############################################################################
    def monitor_cluster
        #Load the host systems
        summary = @cluster.summary

        mhz_core = summary.totalCpu.to_f / summary.numCpuCores.to_f
        eff_core = summary.effectiveCpu.to_f / mhz_core

        free_cpu  = sprintf('%.2f', eff_core * 100).to_f
        total_cpu = summary.numCpuCores.to_f * 100
        used_cpu  = sprintf('%.2f', total_cpu - free_cpu).to_f

        total_mem = summary.totalMemory.to_i / 1024
        free_mem  = summary.effectiveMemory.to_i * 1024

        str_info = ""

        # System
        str_info << "HYPERVISOR=vcenter\n"
        str_info << "PUBLIC_CLOUD=YES\n"
        str_info << "TOTALHOST=" << summary.numHosts.to_s << "\n"
        str_info << "AVAILHOST=" << summary.numEffectiveHosts.to_s << "\n"

        # CPU
        str_info << "CPUSPEED=" << mhz_core.to_s   << "\n"
        str_info << "TOTALCPU=" << total_cpu.to_s << "\n"
        str_info << "USEDCPU="  << used_cpu.to_s  << "\n"
        str_info << "FREECPU="  << free_cpu.to_s << "\n"

        # Memory
        str_info << "TOTALMEMORY=" << total_mem.to_s << "\n"
        str_info << "FREEMEMORY="  << free_mem.to_s << "\n"
        str_info << "USEDMEMORY="  << (total_mem - free_mem).to_s

        str_info << monitor_resource_pools(@cluster.resourcePool, "", mhz_core)
    end

    ############################################################################
    # Generate an OpenNebula monitor string for all resource pools of a cluster
    # Reference:
    # http://pubs.vmware.com/vsphere-60/index.jsp#com.vmware.wssdk.apiref.doc
    # /vim.ResourcePool.html
    ############################################################################
    def monitor_resource_pools(parent_rp, parent_prefix, mhz_core)
        return "" if parent_rp.resourcePool.size == 0

        rp_info = ""

        parent_rp.resourcePool.each{|rp|
            rpcpu     = rp.config.cpuAllocation
            rpmem     = rp.config.memoryAllocation
            # CPU
            cpu_expandable   = rpcpu.expandableReservation ? "YES" : "NO"
            cpu_limit        = rpcpu.limit == "-1" ? "UNLIMITED" : rpcpu.limit
            cpu_reservation  = rpcpu.reservation
            cpu_num          = rpcpu.reservation.to_f / mhz_core
            cpu_shares_level = rpcpu.shares.level
            cpu_shares       = rpcpu.shares.shares

            # MEMORY
            mem_expandable   = rpmem.expandableReservation ? "YES" : "NO"
            mem_limit        = rpmem.limit == "-1" ? "UNLIMITED" : rpmem.limit
            mem_reservation  = rpmem.reservation.to_f
            mem_shares_level = rpmem.shares.level
            mem_shares       = rpmem.shares.shares

            rp_name          = (parent_prefix.empty? ? "" : parent_prefix + "/")
            rp_name         += rp.name

            rp_info << "\nRESOURCE_POOL = ["
            rp_info << "NAME=#{rp_name},"
            rp_info << "CPU_EXPANDABLE=#{cpu_expandable},"
            rp_info << "CPU_LIMIT=#{cpu_limit},"
            rp_info << "CPU_RESERVATION=#{cpu_reservation},"
            rp_info << "CPU_RESERVATION_NUM_CORES=#{cpu_num},"
            rp_info << "CPU_SHARES=#{cpu_shares},"
            rp_info << "CPU_SHARES_LEVEL=#{cpu_shares_level},"
            rp_info << "MEM_EXPANDABLE=#{mem_expandable},"
            rp_info << "MEM_LIMIT=#{mem_limit},"
            rp_info << "MEM_RESERVATION=#{mem_reservation},"
            rp_info << "MEM_SHARES=#{mem_shares},"
            rp_info << "MEM_SHARES_LEVEL=#{mem_shares_level}"
            rp_info << "]"

            if rp.resourcePool.size != 0
               rp_info << monitor_resource_pools(rp, rp_name, mhz_core)
            end
        }

        return rp_info
    end

    ############################################################################
    # Generate a template with information for each ESX Host. Reference:
    # http://pubs.vmware.com/vi-sdk/visdk250/ReferenceGuide/vim.HostSystem.html
    #   - Summary: Basic information about the host, including connection state
    #     - hardware: Hardware configuration of the host. This might not be
    #       available for a disconnected host.
    #     - quickStats: Basic host statistics.
    ############################################################################
    def monitor_host_systems
        host_info = ""

        @cluster.host.each{|h|
            next if h.runtime.connectionState != "connected"

            summary = h.summary
            hw      = summary.hardware
            stats   = summary.quickStats

            total_cpu = hw.numCpuCores * 100
            used_cpu  = (stats.overallCpuUsage.to_f / hw.cpuMhz.to_f) * 100
            used_cpu  = sprintf('%.2f', used_cpu).to_f # Trim precission
            free_cpu  = total_cpu - used_cpu

            total_memory = hw.memorySize/1024
            used_memory  = stats.overallMemoryUsage*1024
            free_memory  = total_memory - used_memory

            host_info << "\nHOST=["
            host_info << "STATE=on,"
            host_info << "HOSTNAME=\""  << h.name.to_s  << "\","
            host_info << "MODELNAME=\"" << hw.cpuModel.to_s  << "\","
            host_info << "CPUSPEED="    << hw.cpuMhz.to_s    << ","
            host_info << "MAX_CPU="    << total_cpu.to_s << ","
            host_info << "USED_CPU="     << used_cpu.to_s  << ","
            host_info << "FREE_CPU="     << free_cpu.to_s << ","
            host_info << "MAX_MEM=" << total_memory.to_s << ","
            host_info << "USED_MEM="  << used_memory.to_s  << ","
            host_info << "FREE_MEM="  << free_memory.to_s
            host_info << "]"
        }

        return host_info
    end

    def monitor_vms
        # Only monitor from top level (Resource) Resource Pool
        monitor_vms_in_rp(@resource_pools[-1])
    end


    def monitor_vms_in_rp(rp)
        str_info = ""

        if rp.resourcePool.size != 0
            rp.resourcePool.each{|child_rp|
                str_info += monitor_vms_in_rp(child_rp)
            }
        end

        host_cache = {}

        rp.vm.each { |v|
          begin
              # Check cached objects
              if !host_cache[v.runtime.host.to_s]
                  host_cache[v.runtime.host.to_s] =
                         VCenterCachedHost.new v.runtime.host
              end

              host = host_cache[v.runtime.host.to_s]

              name   = v.name
              number = -1
              # Extract vmid if possible
              matches = name.match(/^one-(\d*)(-(.*))?$/)
              number  = matches[1] if matches
              extraconfig_vmid = v.config.extraConfig.select{|val|
                                         val[:key]=="opennebula.vm.id"}
              if extraconfig_vmid.size > 0 and extraconfig_vmid[0]
                  number = extraconfig_vmid[0][:value]
              end
              vm = VCenterVm.new(@client, v)
              vm.monitor(host)
              next if !vm.vm.config
              str_info << "\nVM = ["
              str_info << "ID=#{number},"
              str_info << "DEPLOY_ID=\"#{vm.vm.config.uuid}\","
              str_info << "VM_NAME=\"#{name} - "\
                          "#{host.cluster_name}\","
              if number == -1
                  vm_template_to_one =
                      Base64.encode64(vm.vm_to_one(host)).gsub("\n","")
                  str_info << "IMPORT_TEMPLATE=\"#{vm_template_to_one}\","
              end
              str_info << "POLL=\"#{vm.info}\"]"
          rescue Exception => e
              STDERR.puts e.inspect
              STDERR.puts e.backtrace
          end
        }
      return str_info
    end

    def monitor_customizations
        customizations = client.vim.serviceContent.customizationSpecManager.info

        text = ''

        customizations.each do |c|
            t = "CUSTOMIZATION = [ "
            t << %Q<NAME = "#{c.name}", >
            t << %Q<TYPE = "#{c.type}" ]\n>

            text << t
        end

        text
    end

    def get_available_ds
        str_info = ""
        @cluster.parent.parent.datastoreFolder.childEntity.each { |ds|
            str_info += "VCENTER_DATASTORE=\"#{ds.name}\"\n"
        }
        str_info.chomp
    end
end

################################################################################
# This class is a high level abstraction of a VI VirtualMachine class with
# OpenNebula semantics.
################################################################################

class VCenterVm
    attr_reader :vm

    POLL_ATTRIBUTE  = VirtualMachineDriver::POLL_ATTRIBUTE
    VM_STATE        = VirtualMachineDriver::VM_STATE

    ############################################################################
    #  Creates a new VIVm using a RbVmomi::VirtualMachine object
    #    @param client [VCenterClient] client to connect to vCenter
    #    @param vm_vi [RbVmomi::VirtualMachine] it will be used if not nil
    ########################################################################
    def initialize(client, vm_vi )
        @vm     = vm_vi
        @client = client

        @used_cpu    = 0
        @used_memory = 0

        @netrx = 0
        @nettx = 0
    end

    ############################################################################
    # Deploys a VM
    #  @xml_text XML repsentation of the VM
    ############################################################################
    def self.deploy(xml_text, lcm_state, deploy_id, hostname, datastore = nil)
        if lcm_state == "BOOT" || lcm_state == "BOOT_FAILURE"
            return clone_vm(xml_text, hostname, datastore)
        else
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)
            vm          = connection.find_vm_template(deploy_id)
            xml         = REXML::Document.new xml_text

            reconfigure_vm(vm, xml, false)

            vm.PowerOnVM_Task.wait_for_completion
            return vm.config.uuid
        end
    end

    ############################################################################
    # Cancels a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param lcm_state state of the VM
    #  @param keep_disks keep or not VM disks in datastore
    #  @param disks VM attached disks
    ############################################################################
    def self.cancel(deploy_id, hostname, lcm_state, keep_disks, disks, to_template)
        case lcm_state
            when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
                shutdown(deploy_id, hostname, lcm_state, keep_disks, disks, to_template)
            when "CANCEL", "LCM_INIT", "CLEANUP_RESUBMIT", "SHUTDOWN", "CLEANUP_DELETE"
                hid         = VIClient::translate_hostname(hostname)
                connection  = VIClient.new(hid)
                vm          = connection.find_vm_template(deploy_id)

                begin
                    if vm.summary.runtime.powerState == "poweredOn"
                        vm.PowerOffVM_Task.wait_for_completion
                    end
                rescue
                end
                if keep_disks
                    detach_all_disks(vm)
                else
                    detach_attached_disks(vm, disks, hostname) if disks
                end

                # If the VM was instantiated to persistent, convert the VM to 
                # vCenter VM Template and update the OpenNebula new 
                # VM Template to point to the new vCenter VM Template
                if !to_template.nil?
                    vm.MarkAsTemplate

                    new_template = OpenNebula::Template.new_with_id(to_template,
                                                         OpenNebula::Client.new)
                    new_template.info

                    public_cloud_str = "PUBLIC_CLOUD=["

                    new_template.to_hash["VMTEMPLATE"]["TEMPLATE"]["PUBLIC_CLOUD"].each{|k,v|
                        if k == "VM_TEMPLATE"
                            public_cloud_str += "VM_TEMPLATE=\"#{deploy_id}\",\n"
                        else
                            public_cloud_str += "#{k}=\"#{v}\",\n"
                        end
                    }

                    public_cloud_str = public_cloud_str + "]"

                    new_template.update(public_cloud_str, true)
                else
                    vm.Destroy_Task.wait_for_completion
                end
            else
                raise "LCM_STATE #{lcm_state} not supported for cancel"
        end
    end


    ############################################################################
    # Saves a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.save(deploy_id, hostname, lcm_state)
        case lcm_state
            when "SAVE_MIGRATE"
                raise "Migration between vCenters cluster not supported"
            when "SAVE_SUSPEND", "SAVE_STOP"
                hid         = VIClient::translate_hostname(hostname)
                connection  = VIClient.new(hid)
                vm          = connection.find_vm_template(deploy_id)

                vm.SuspendVM_Task.wait_for_completion
        end
    end

    ############################################################################
    # Resumes a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.resume(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)
        vm          = connection.find_vm_template(deploy_id)

        vm.PowerOnVM_Task.wait_for_completion
    end

    ############################################################################
    # Reboots a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.reboot(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        vm.RebootGuest.wait_for_completion
    end

    ############################################################################
    # Resets a VM
    #  @param deploy_id vcetranslate_hostnamnter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    ############################################################################
    def self.reset(deploy_id, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        vm.ResetVM_Task.wait_for_completion
    end

    ############################################################################
    # Shutdown a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param lcm_state state of the VM
    #  @param keep_disks keep or not VM disks in datastore
    #  @param disks VM attached disks
    #  @param to_template whether this VM has been instantiated as persistent
    ############################################################################
    def self.shutdown(deploy_id, hostname, lcm_state, keep_disks, disks, to_template)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        case lcm_state
            when "SHUTDOWN"
                begin
                    vm.ShutdownGuest.wait_for_completion
                rescue
                end
                vm.PowerOffVM_Task.wait_for_completion
                if keep_disks
                    detach_all_disks(vm)
                else
                    detach_attached_disks(vm, disks, hostname) if disks
                end

                # If the VM was instantiated to persistent, convert the VM to 
                # vCenter VM Template and update the OpenNebula new 
                # VM Template to point to the new vCenter VM Template
                if !to_template.nil?
                    vm.MarkAsTemplate

                    new_template = OpenNebula::Template.new_with_id(to_template,
                                                        OpenNebula::Client.new)
                    new_template.info

                    public_cloud_str = "PUBLIC_CLOUD=["

                    new_template.to_hash["VMTEMPLATE"]["TEMPLATE"]["PUBLIC_CLOUD"].each{|k,v|
                        if k == "VM_TEMPLATE"
                            public_cloud_str += "VM_TEMPLATE=\"#{deploy_id}\"\n"
                        else
                            public_cloud_str += "#{k}=\"#{v}\",\n"
                        end
                    }

                    public_cloud_str = public_cloud_str + "]"

                    new_template.update(public_cloud_str, true)
                else
                    vm.Destroy_Task.wait_for_completion
                end

            when "SHUTDOWN_POWEROFF", "SHUTDOWN_UNDEPLOY"
                begin
                    vm.ShutdownGuest.wait_for_completion
                rescue
                end
                vm.PowerOffVM_Task.wait_for_completion
        end
    end

    ############################################################################
    # Create VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.create_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        snapshot_hash = {
            :name => snapshot_name,
            :description => "OpenNebula Snapshot of VM #{deploy_id}",
            :memory => true,
            :quiesce => true
        }

        vm          = connection.find_vm_template(deploy_id)

        vm.CreateSnapshot_Task(snapshot_hash).wait_for_completion

        return snapshot_name
    end

    ############################################################################
    # Find VM snapshot
    #  @param list root list of VM snapshots
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.find_snapshot(list, snapshot_name)
        list.each do |i|
            if i.name == snapshot_name
                return i.snapshot
            elsif !i.childSnapshotList.empty?
                snap = find_snapshot(i.childSnapshotList, snapshot_name)
                return snap if snap
            end
        end

        nil
    end

    ############################################################################
    # Delete VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.delete_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        list = vm.snapshot.rootSnapshotList

        snapshot = find_snapshot(list, snapshot_name)
        return nil if !snapshot

        delete_snapshot_hash = {
            :_this => snapshot,
            :removeChildren => false
        }

        snapshot.RemoveSnapshot_Task(delete_snapshot_hash).wait_for_completion
    end

    ############################################################################
    # Revert VM snapshot
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param snaphot_name name of the snapshot
    ############################################################################
    def self.revert_snapshot(deploy_id, hostname, snapshot_name)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        list = vm.snapshot.rootSnapshotList

        snapshot = find_snapshot(list, snapshot_name)
        return nil if !snapshot

        revert_snapshot_hash = {
            :_this => snapshot
        }

        snapshot.RevertToSnapshot_Task(revert_snapshot_hash).wait_for_completion
    end

    ############################################################################
    # Attach NIC to a VM
    #  @param deploy_id vcenter identifier of the VM
    #  @param mac MAC address of the NIC to be attached
    #  @param bridge name of the Network in vCenter
    #  @param model model of the NIC to be attached
    #  @param host hostname of the ESX where the VM is running
    ############################################################################
    def self.attach_nic(deploy_id, mac, bridge, model, host)
        hid         = VIClient::translate_hostname(host)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        spec_hash   = calculate_addnic_spec(vm, mac, bridge, model)

        spec        = RbVmomi::VIM.VirtualMachineConfigSpec({:deviceChange =>
                                                              [spec_hash]})

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Detach NIC from a VM
    ############################################################################
    def self.detach_nic(deploy_id, mac, host)
        hid         = VIClient::translate_hostname(host)
        connection  = VIClient.new(hid)

        vm   = connection.find_vm_template(deploy_id)

        nic  = vm.config.hardware.device.find { |d|
                is_nic?(d) && (d.macAddress ==  mac)
        }

        raise "Could not find NIC with mac address #{mac}" if nic.nil?

        spec = {
            :deviceChange => [
                :operation => :remove,
                :device => nic
            ]
        }

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Reconfigures a VM (context data)
    #  @param deploy_id vcenter identifier of the VM
    #  @param hostname name of the host (equals the vCenter cluster)
    #  @param xml_text XML repsentation of the VM
    ############################################################################
    def self.reconfigure(deploy_id, hostname, xml_text)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)
        vm          = connection.find_vm_template(deploy_id)

        xml = REXML::Document.new xml_text
        context = xml.root.elements["//TEMPLATE/CONTEXT"]

        if context
            context_text = create_context(context)
            context_spec = {
                :extraConfig => [
                    { :key=>"guestinfo.opennebula.context",
                      :value=> Base64.encode64(context_text) }
                ]
            }

            spec      = RbVmomi::VIM.VirtualMachineConfigSpec(context_spec)
            vm.ReconfigVM_Task(:spec => spec).wait_for_completion
        end
    end

    ########################################################################
    #  Initialize the vm monitor information
    ########################################################################
    def monitor(host)
        @summary = @vm.summary
        @state   = state_to_c(@summary.runtime.powerState)

        if @state != VM_STATE[:active]
            @used_cpu    = 0
            @used_memory = 0

            @netrx = 0
            @nettx = 0

            return
        end

        @used_memory = @summary.quickStats.hostMemoryUsage * 1024
        cpuMhz       = @vm.runtime.host.summary.hardware.cpuMhz.to_f

        @used_cpu   =
                ((@summary.quickStats.overallCpuUsage.to_f / cpuMhz) * 100).to_s
        @used_cpu   = sprintf('%.2f',@used_cpu).to_s

        # Check for negative values
        @used_memory = 0 if @used_memory.to_i < 0
        @used_cpu    = 0 if @used_cpu.to_i < 0

        @esx_host       = @vm.summary.runtime.host.name
        @guest_ip       = @vm.guest.ipAddress
        @guest_state    = @vm.guest.guestState
        @vmware_tools   = @vm.guest.toolsRunningStatus
        @vmtools_ver    = @vm.guest.toolsVersion
        @vmtools_verst  = @vm.guest.toolsVersionStatus

        guest_ip_addresses = []

        @vm.guest.net.each do |net|
            net.ipConfig.ipAddress.each do |ip|
                guest_ip_addresses << ip.ipAddress
            end if net.ipConfig && net.ipConfig.ipAddress
        end if @vm.guest.net

        @guest_ip_addresses = guest_ip_addresses.join(',')
    end

    ########################################################################
    #  Generates a OpenNebula IM Driver valid string with the monitor info
    ########################################################################
    def info
      return 'STATE=d' if @state == 'd'

      str_info = ""

      str_info << "GUEST_IP=" << @guest_ip.to_s << " " if @guest_ip
      if @guest_ip_addresses && !@guest_ip_addresses.empty?
          str_info << "GUEST_IP_ADDRESSES=\\\"" <<
              @guest_ip_addresses.to_s << "\\\" "
      end
      str_info << "#{POLL_ATTRIBUTE[:state]}="  << @state                << " "
      str_info << "#{POLL_ATTRIBUTE[:cpu]}="    << @used_cpu.to_s        << " "
      str_info << "#{POLL_ATTRIBUTE[:memory]}=" << @used_memory.to_s     << " "
      str_info << "#{POLL_ATTRIBUTE[:netrx]}="  << @netrx.to_s           << " "
      str_info << "#{POLL_ATTRIBUTE[:nettx]}="  << @nettx.to_s           << " "
      str_info << "ESX_HOST="                   << @esx_host.to_s        << " "
      str_info << "GUEST_STATE="                << @guest_state.to_s     << " "
      str_info << "VMWARETOOLS_RUNNING_STATUS=" << @vmware_tools.to_s    << " "
      str_info << "VMWARETOOLS_VERSION="        << @vmtools_ver.to_s     << " "
      str_info << "VMWARETOOLS_VERSION_STATUS=" << @vmtools_verst.to_s   << " "
      str_info << "RESOURCE_POOL="              << @vm.resourcePool.name << " "
    end

    ########################################################################
    # Generates an OpenNebula Template for this VCenterVm
    ########################################################################
    def to_one(host)
        cluster_name = host.cluster_name

        str = "NAME   = \"#{@vm.name} - #{cluster_name}\"\n"\
              "CPU    = \"#{@vm.config.hardware.numCPU}\"\n"\
              "vCPU   = \"#{@vm.config.hardware.numCPU}\"\n"\
              "MEMORY = \"#{@vm.config.hardware.memoryMB}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE        =\"vcenter\",\n"\
              "  VM_TEMPLATE =\"#{@vm.config.uuid}\",\n"\
              "  HOST        =\"#{cluster_name}\"\n"\
              "]\n"\
              "GRAPHICS = [\n"\
              "  TYPE     =\"vnc\",\n"\
              "  LISTEN   =\"0.0.0.0\"\n"\
              "]\n"\
         "SCHED_REQUIREMENTS=\"NAME=\\\"#{cluster_name}\\\"\"\n"

        if @vm.config.annotation.nil? || @vm.config.annotation.empty?
            str << "DESCRIPTION = \"vCenter Template imported by OpenNebula"\
                " from Cluster #{@vm.runtime.host.parent.name}\"\n"
        else
            notes = @vm.config.annotation.gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case @vm.guest.guestFullName
            when /CentOS/i
                str << "LOGO=images/logos/centos.png"
            when /Debian/i
                str << "LOGO=images/logos/debian.png"
            when /Red Hat/i
                str << "LOGO=images/logos/redhat.png"
            when /Ubuntu/i
                str << "LOGO=images/logos/ubuntu.png"
            when /Windows XP/i
                str << "LOGO=images/logos/windowsxp.png"
            when /Windows/i
                str << "LOGO=images/logos/windows8.png"
            when /Linux/i
                str << "LOGO=images/logos/linux.png"
        end
        return str
    end

    ########################################################################
    # Generates a Datastore user input
    ########################################################################
    def to_one_ds(host, default_ds)
        # Datastores User Input
        str = ""

        if host.ds_list != ""
            str    =  "M|list|Which datastore you want this VM to run on?|"\
                   << "#{host.ds_list}|#{default_ds}"
        end

        return str
     end

    ########################################################################
    # Generates a Resource Pool user input
    ########################################################################
     def to_one_rp(host)
        # Resource Pool User Input
        str = ""

        if host.rp_list != ""
            str    =  "M|list|Which resource pool you want this VM to run"\
                      " in?|#{host.rp_list}|#{host.rp_list.split(",")[0]}"
        end

        return str
    end

    ########################################################################
    # Generates an OpenNebula VirtualMachine for this VCenterVm
    #
    #
    ########################################################################
    def vm_to_one(host)
        cluster_name = host.cluster_name

        state = case state_to_c(@summary.runtime.powerState)
                    when 'a'
                        "RUNNING"
                    when 'd'
                        "POWEROFF"
                end

        str = "NAME   = \"#{@vm.name} - #{cluster_name}\"\n"\
              "CPU    = \"#{@vm.config.hardware.numCPU}\"\n"\
              "vCPU   = \"#{@vm.config.hardware.numCPU}\"\n"\
              "MEMORY = \"#{@vm.config.hardware.memoryMB}\"\n"\
              "HYPERVISOR = \"vcenter\"\n"\
              "PUBLIC_CLOUD = [\n"\
              "  TYPE        =\"vcenter\",\n"\
              "  VM_TEMPLATE =\"#{@vm.config.uuid}\",\n"\
              "  HOST        =\"#{cluster_name}\"\n"\
              "]\n"\
              "IMPORT_VM_ID    = \"#{@vm.config.uuid}\"\n"\
              "IMPORT_STATE   = \"#{state}\"\n"\
              "SCHED_REQUIREMENTS=\"NAME=\\\"#{cluster_name}\\\"\"\n"

        vp     = @vm.config.extraConfig.select{|v|
                                           v[:key].downcase=="remotedisplay.vnc.port"}
        keymap = @vm.config.extraConfig.select{|v|
                                           v[:key].downcase=="remotedisplay.vnc.keymap"}

        if vp.size > 0
            str << "GRAPHICS = [\n"\
                   "  TYPE     =\"vnc\",\n"\
                   "  LISTEN   =\"0.0.0.0\",\n"\
                   "  PORT     =\"#{vp[0][:value]}\"\n"
            str << " ,KEYMAP   =\"#{keymap[0][:value]}\"\n" if keymap[0]
            str << "]\n"
        end

        if @vm.config.annotation.nil? || @vm.config.annotation.empty?
            str << "DESCRIPTION = \"vCenter Virtual Machine imported by"\
                " OpenNebula from Cluster #{cluster_name}\"\n"
        else
            notes = @vm.config.annotation.gsub("\\", "\\\\").gsub("\"", "\\\"")
            str << "DESCRIPTION = \"#{notes}\"\n"
        end

        case @vm.guest.guestFullName
            when /CentOS/i
                str << "LOGO=images/logos/centos.png"
            when /Debian/i
                str << "LOGO=images/logos/debian.png"
            when /Red Hat/i
                str << "LOGO=images/logos/redhat.png"
            when /Ubuntu/i
                str << "LOGO=images/logos/ubuntu.png"
            when /Windows XP/i
                str << "LOGO=images/logos/windowsxp.png"
            when /Windows/i
                str << "LOGO=images/logos/windows8.png"
            when /Linux/i
                str << "LOGO=images/logos/linux.png"
        end

        return str
    end

private

    ########################################################################
    # Converts the VI string state to OpenNebula state convention
    # Guest states are:
    # - poweredOff   The virtual machine is currently powered off.
    # - poweredOn    The virtual machine is currently powered on.
    # - suspended    The virtual machine is currently suspended.
    ########################################################################
    def state_to_c(state)
        case state
            when 'poweredOn'
                VM_STATE[:active]
            when 'suspended'
                VM_STATE[:paused]
            when 'poweredOff'
                VM_STATE[:deleted]
            else
                VM_STATE[:unknown]
        end
    end

    ########################################################################
    #  Checks if a RbVmomi::VIM::VirtualDevice is a network interface
    ########################################################################
    def self.is_nic?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualEthernetCard).nil?
    end

    ########################################################################
    #  Checks if a RbVmomi::VIM::VirtualDevice is a disk
    ########################################################################
    def self.is_disk?(device)
        !device.class.ancestors.index(RbVmomi::VIM::VirtualDisk).nil?
    end

    ########################################################################
    # Returns the spec to reconfig a VM and add a NIC
    ########################################################################
    def self.calculate_addnic_spec(vm, mac, bridge, model)
        model       = model.nil? ? nil : model.downcase
        network     = vm.runtime.host.network.select{|n| n.name==bridge}
        backing     = nil

        if network.empty?
            raise "Network #{bridge} not found in host #{vm.runtime.host.name}"
        else
            network = network[0]
        end

        card_num = 1 # start in one, we want the next avaliable id

        vm.config.hardware.device.each{ |dv|
            card_num = card_num + 1 if is_nic?(dv)
        }

        nic_card = case model
                        when "virtuale1000", "e1000"
                            RbVmomi::VIM::VirtualE1000
                        when "virtuale1000e", "e1000e"
                            RbVmomi::VIM::VirtualE1000e
                        when "virtualpcnet32", "pcnet32"
                            RbVmomi::VIM::VirtualPCNet32
                        when "virtualsriovethernetcard", "sriovethernetcard"
                            RbVmomi::VIM::VirtualSriovEthernetCard
                        when "virtualvmxnetm", "vmxnetm"
                            RbVmomi::VIM::VirtualVmxnetm
                        when "virtualvmxnet2", "vmnet2"
                            RbVmomi::VIM::VirtualVmxnet2
                        when "virtualvmxnet3", "vmxnet3"
                            RbVmomi::VIM::VirtualVmxnet3
                        else # If none matches, use VirtualE1000
                            RbVmomi::VIM::VirtualE1000
                   end

        if network.class == RbVmomi::VIM::Network
            backing = RbVmomi::VIM.VirtualEthernetCardNetworkBackingInfo(
                        :deviceName => bridge,
                        :network => network)
        else
            port    = RbVmomi::VIM::DistributedVirtualSwitchPortConnection(
                        :switchUuid =>
                                network.config.distributedVirtualSwitch.uuid,
                        :portgroupKey => network.key)
            backing =
              RbVmomi::VIM.VirtualEthernetCardDistributedVirtualPortBackingInfo(
                 :port => port)
        end

        return {:operation => :add,
                :device => nic_card.new(
                            :key => 0,
                            :deviceInfo => {
                                :label => "net" + card_num.to_s,
                                :summary => bridge
                            },
                            :backing => backing,
                            :addressType => mac ? 'manual' : 'generated',
                            :macAddress  => mac
                           )
               }
    end

    ########################################################################
    #  Clone a vCenter VM Template and leaves it powered on
    ########################################################################
    def self.clone_vm(xml_text, hostname, datastore)

        host_id = VCenterDriver::VIClient.translate_hostname(hostname)

        # Retrieve hostname

        host  =  OpenNebula::Host.new_with_id(host_id, OpenNebula::Client.new())
        host.info   # Not failing if host retrieval fails

        # Get VM prefix name

        if host["/HOST/TEMPLATE/VM_PREFIX"] and !host["/HOST/TEMPLATE/VM_PREFIX"].empty?
            vmname_prefix = host["/HOST/TEMPLATE/VM_PREFIX"]
        else # fall back to default value
            vmname_prefix = "one-$i-"
        end

        xml = REXML::Document.new xml_text
        pcs = xml.root.get_elements("/VM/USER_TEMPLATE/PUBLIC_CLOUD")

        raise "Cannot find VCenter element in VM template." if pcs.nil?

        template = pcs.select { |t|
            type = t.elements["TYPE"]
            !type.nil? && type.text.downcase == "vcenter"
        }

        # If there are multiple vcenter templates, find the right one

        if template.is_a? Array
            all_vcenter_templates = template.clone
            # If there is more than one coincidence, pick the first one
            template = template.select {|t|
                cluster_name = t.elements["HOST"]
                !cluster_name.nil? && cluster_name.text == hostname
            }[0]
            # The template may not reference any specific CLUSTER
            # (referenced to as HOST in the OpenNebula template)
            # Therefore, here take the first one that does not
            # specify a CLUSTER to see if we are lucky
            if template.nil?
                template = all_vcenter_templates.select {|t|
                    t.elements["HOST"].nil?
                }[0]
            end
        end

        raise "Cannot find vCenter element in VM template." if template.nil?

        uuid = template.elements["VM_TEMPLATE"]

        raise "Cannot find VM_TEMPLATE in vCenter element." if uuid.nil?

        uuid         = uuid.text
        vmid         = xml.root.elements["/VM/ID"].text
        vmname_prefix.gsub!("$i", vmid)
        vcenter_name = "#{vmname_prefix}#{xml.root.elements["/VM/NAME"].text}"
        hid          = xml.root.elements["/VM/HISTORY_RECORDS/HISTORY/HID"]

        raise "Cannot find host id in deployment file history." if hid.nil?

        connection  = VIClient.new(hid)
        vc_template = connection.find_vm_template(uuid)

        # Find out requested and available resource pool

        req_rp = nil
        if !xml.root.elements["/VM/USER_TEMPLATE/RESOURCE_POOL"].nil?
            req_rp = xml.root.elements["/VM/USER_TEMPLATE/RESOURCE_POOL"].text
        end

        if connection.rp_confined?
            rp = connection.resource_pool.first
            if req_rp && rp.name != req_rp
                raise "Available resource pool in host [#{rp.name}]"\
                      " does not match requested resource pool"\
                      " [#{req_rp}]"
            end
        else
            if req_rp # if there is requested resource pool, retrieve it
                rp = connection.find_resource_pool(req_rp)
                raise "Cannot find resource pool "\
                      "#{template.elements["RESOURCE_POOL"].text}" if !rp
            else # otherwise, get the default resource pool
                rp = connection.default_resource_pool
            end
        end

        # Find out requested and available datastore

        if !xml.root.elements["/VM/USER_TEMPLATE/VCENTER_DATASTORE"].nil?
           datastore = xml.root.elements["/VM/USER_TEMPLATE/VCENTER_DATASTORE"].text
        end

        if datastore
            ds=connection.dc.datastoreFolder.childEntity.select{|ds|
                                                        ds.name == datastore}[0]
            raise "Cannot find datastore #{datastore}" if !ds
        end

        relocate_spec_params = {
            :diskMoveType => :moveChildMostDiskBacking,
            :pool         => rp
        }

        relocate_spec_params[:datastore] = ds if datastore

        relocate_spec = RbVmomi::VIM.VirtualMachineRelocateSpec(
                                                         relocate_spec_params)

        clone_parameters = {
            :location => relocate_spec,
            :powerOn  => false,
            :template => false
        }

        customization = template.elements["CUSTOMIZATION_SPEC"]

        vim = connection.vim

        if !customization.nil?
        begin
            custom_spec = vim.serviceContent.customizationSpecManager.
                GetCustomizationSpec(:name => customization.text)

            if custom_spec && spec=custom_spec.spec
                clone_parameters[:customization] = spec
            else
                raise "Error getting customization spec"
            end

        rescue
            raise "Customization spec '#{customization.text}' not found"
        end
        end

        clone_spec = RbVmomi::VIM.VirtualMachineCloneSpec(clone_parameters)

        begin
            vm = vc_template.CloneVM_Task(
                   :folder => vc_template.parent,
                   :name   => vcenter_name,
                   :spec   => clone_spec).wait_for_completion
        rescue Exception => e

            if !e.message.start_with?('DuplicateName')
                raise "Cannot clone VM Template: #{e.message}"
            end

            vm = connection.find_vm(vcenter_name)

            raise "Cannot clone VM Template" if vm.nil?

            vm.Destroy_Task.wait_for_completion
            vm = vc_template.CloneVM_Task(
                :folder => vc_template.parent,
                :name   => vcenter_name,
                :spec   => clone_spec).wait_for_completion
        end

        reconfigure_vm(vm, xml, true)

        # Power on the VM
        vm.PowerOnVM_Task.wait_for_completion

        return vm.config.uuid
    end

    ########################################################################
    # Reconfigures a VM with new deployment description
    ########################################################################
    def self.reconfigure_vm(vm, xml, newvm)
        vm_uuid     = vm.config.uuid
        vmid        = xml.root.elements["/VM/ID"].text
        context     = xml.root.elements["/VM/TEMPLATE/CONTEXT"]

        # Read existing context if it is not a new VM
        if !newvm
            old_context = vm.config.extraConfig.select{|val|
                       val[:key]=="guestinfo.opennebula.context"}
        end

        # Add VMID to VM's extraConfig

        config_array = [{:key=>"opennebula.vm.id",:value=>vmid}]

        # VNC Section

        vnc_port   = xml.root.elements["/VM/TEMPLATE/GRAPHICS/PORT"]
        vnc_listen = xml.root.elements["/VM/TEMPLATE/GRAPHICS/LISTEN"]
        vnc_keymap = xml.root.elements["/VM/TEMPLATE/GRAPHICS/KEYMAP"]

        if !vnc_listen
            vnc_listen = "0.0.0.0"
        else
            vnc_listen = vnc_listen.text
        end

        context_vnc_spec = {}

        if vnc_port
            config_array +=
                     [{:key=>"remotedisplay.vnc.enabled",:value=>"TRUE"},
                      {:key=>"remotedisplay.vnc.port",   :value=>vnc_port.text},
                      {:key=>"remotedisplay.vnc.ip",     :value=>vnc_listen}]
        end

        config_array += [{:key=>"remotedisplay.vnc.keymap",
                          :value=>vnc_keymap.text}] if vnc_keymap

        # Context section

        if context
            context_text = create_context(context)

            # OneGate
            onegate_token_flag = xml.root.elements["/VM/TEMPLATE/CONTEXT/TOKEN"]
            if onegate_token_flag and
               onegate_token_flag.text == "YES" and
               !newvm
                # Create the OneGate token string
                vmid_str  = xml.root.elements["/VM/ID"].text
                stime_str = xml.root.elements["/VM/STIME"].text
                str_to_encrypt = "#{vmid_str}:#{stime_str}"

                user_id = xml.root.elements['//CREATED_BY'].text

                if user_id.nil?
                    STDERR.puts {"VMID:#{vmid} CREATED_BY not present" \
                        " in the VM TEMPLATE"}
                    return nil
                end

                user = OpenNebula::User.new_with_id(user_id,
                                                    OpenNebula::Client.new)
                rc   = user.info

                if OpenNebula.is_error?(rc)
                    STDERR.puts {"VMID:#{vmid} user.info" \
                        " error: #{rc.message}"}
                    return nil
                end

                token_password = user['TEMPLATE/TOKEN_PASSWORD']

                if token_password.nil?
                    STDERR.puts {"VMID:#{vmid} TOKEN_PASSWORD not present"\
                        " in the USER:#{user_id} TEMPLATE"}
                    return nil
                end

                cipher = OpenSSL::Cipher::Cipher.new("aes-256-cbc")
                cipher.encrypt
                cipher.key = token_password
                onegate_token = cipher.update(str_to_encrypt)
                onegate_token << cipher.final

                onegate_token_64 = Base64.encode64(onegate_token).chop

                context_text += "ONEGATE_TOKEN='#{onegate_token_64}'\n"
            end

            # If there is an old VM, we need to honor the existing ONEGATE_TOKEN
            if !newvm
                onegate_token =
                    Base64.decode64(old_context[0][:value]).split("\n").
                    select{|line| line.start_with?("ONEGATE_TOKEN")}[0]

                if onegate_token
                  context_text += onegate_token
                end
            end

            context_text = Base64.encode64(context_text.chop)

            config_array +=
                     [{:key=>"guestinfo.opennebula.context",
                       :value=>context_text}]
        end

        if config_array != []
            context_vnc_spec = {:extraConfig =>config_array}
        end

        device_change = []

        # NIC section, build the reconfig hash

        nics     = xml.root.get_elements("/VM/TEMPLATE/NIC")
        nic_spec = {}

        # If the VM is not new, avoid readding NiCs
        if !newvm
            vm.config.hardware.device.each{ |dv|
                if is_nic?(dv)
                   nics.each{|nic|
                      if nic.elements["MAC"].text == dv.macAddress and
                         nic.elements["BRIDGE"].text == dv.deviceInfo.summary
                         nics.delete(nic)
                      end
                   }
                end
            }
        end

        if !nics.nil?
            nic_array = []
            nics.each{|nic|
               mac    = nic.elements["MAC"].text
               bridge = nic.elements["BRIDGE"].text
               model  = nic.elements["MODEL"] ? nic.elements["MODEL"].text : nil
               nic_array << calculate_addnic_spec(vm, mac, bridge, model)
            }

            device_change += nic_array
        end

        # DISK section, build the reconfig hash

        disks     = xml.root.get_elements("/VM/TEMPLATE/DISK")
        disk_spec = {}

        # If the VM is not new, avoid readding DISKS
        if !newvm
            vm.config.hardware.device.select { |d|
                if is_disk?(d)
                   disks.each{|disk|
                      if disk.elements["SOURCE"].text == d.backing.fileName
                         disks.delete(disk)
                      end
                   }
                end
            }
        end

        if !disks.nil?
            disk_array = []
            disks.each{|disk|
               ds_name    = disk.elements["DATASTORE"].text
               img_name   = disk.elements["SOURCE"].text

               disk_array += attach_disk("", "", ds_name, img_name, 0, vm, connection)[:deviceChange]
            }

            device_change += disk_array
        end

        # Capacity section

        cpu           = xml.root.elements["/VM/TEMPLATE/VCPU"] ? xml.root.elements["/VM/TEMPLATE/VCPU"].text : 1
        memory        = xml.root.elements["/VM/TEMPLATE/MEMORY"].text
        capacity_spec = {:numCPUs  => cpu.to_i,
                         :memoryMB => memory }

        # Perform the VM reconfiguration
        spec_hash = context_vnc_spec.merge(capacity_spec)
        if device_change.length > 0
            spec_hash.merge!({ :deviceChange => device_change })
        end

        spec      = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Attach disk to a VM
    # @params hostname[String] vcenter cluster name in opennebula as host
    # @params deploy_id[String] deploy id of the vm
    # @params ds_name[String] name of the datastore
    # @params img_name[String] path of the image
    # @params size_kb[String] size in kb of the disk
    # @params vm[RbVmomi::VIM::VirtualMachine] VM if called from instance
    # @params connection[ViClient::conneciton] connection if called from instance
    ############################################################################
    def self.attach_disk(hostname, deploy_id, ds_name, img_name, size_kb, vm=nil, connection=nil)
        only_return = true
        if !vm
            hid         = VIClient::translate_hostname(hostname)
            connection  = VIClient.new(hid)

            vm          = connection.find_vm_template(deploy_id)
            only_return = false
        end

        # Find datastore within datacenter
        ds=connection.dc.datastoreFolder.childEntity.select{|ds|
                                                         ds.name == ds_name}[0]

        controller, new_number = find_free_controller(vm)

        vmdk_backing = RbVmomi::VIM::VirtualDiskFlatVer2BackingInfo(
              :datastore => ds,
              :diskMode  => 'persistent',
              :fileName  => "[#{ds_name}] #{img_name}"
        )

        device = RbVmomi::VIM::VirtualDisk(
          :backing       => vmdk_backing,
          :capacityInKB  => size_kb,
          :controllerKey => controller.key,
          :key           => -1,
          :unitNumber    => new_number
        )

        device_config_spec = RbVmomi::VIM::VirtualDeviceConfigSpec(
          :device    => device,
          :operation => RbVmomi::VIM::VirtualDeviceConfigSpecOperation('add')
        )

        vm_config_spec = RbVmomi::VIM::VirtualMachineConfigSpec(
          :deviceChange => [device_config_spec]
        )

        return vm_config_spec if only_return

        vm.ReconfigVM_Task(:spec => vm_config_spec).wait_for_completion
    end

    def self.find_free_controller(vm)
        free_scsi_controllers = Array.new
        available_controller  = nil
        scsi_schema           = Hash.new

        vm.config.hardware.device.each{ |dev|
          if dev.is_a? RbVmomi::VIM::VirtualSCSIController
            if scsi_schema[dev.controllerKey].nil?
              scsi_schema[dev.key] = Hash.new
              scsi_schema[dev.key][:lower] = Array.new
            end
            scsi_schema[dev.key][:device] = dev
          end
        }

        scsi_schema.keys.each{|controller|
          if scsi_schema[controller][:lower].length < 15
            free_scsi_controllers << scsi_schema[controller][:device].deviceInfo.label
          end
        }

        if free_scsi_controllers.length > 0
            available_controller_label = free_scsi_controllers[0]
        else
            add_new_scsi(vm, scsi_schema)
            return find_free_controller(vm)
        end

       # Get the controller resource from the label
        controller = nil

        vm.config.hardware.device.each { |device|
          (controller = device ; break) if device.deviceInfo.label == available_controller_label
        }

        new_unit_number = find_new_unit_number(scsi_schema, controller)

        return controller, new_unit_number
    end


    def self.find_new_unit_number(scsi_schema, controller)
        used_numbers      =  Array.new
        available_numbers =  Array.new

        scsi_schema.keys.each { |c|
          next if controller.key != scsi_schema[c][:device].key
          used_numbers << scsi_schema[c][:device].scsiCtlrUnitNumber
          scsi_schema[c][:lower].each { |disk|
            used_numbers << disk.unitNumber
          }
        }

        15.times{ |scsi_id|
          available_numbers << scsi_id if used_numbers.grep(scsi_id).length <= 0
        }

        return available_numbers.sort[0]
    end

    def self.add_new_scsi(vm, scsi_schema)
        controller = nil

        if scsi_schema.keys.length >= 4
          raise "Cannot add a new controller, maximum is 4."
        end

        if scsi_schema.keys.length == 0
          scsi_key    = 0
          scsi_number = 0
        else scsi_schema.keys.length < 4
          scsi_key    = scsi_schema.keys.sort[-1] + 1
          scsi_number = scsi_schema[scsi_schema.keys.sort[-1]][:device].busNumber + 1
        end

        controller_device = RbVmomi::VIM::VirtualLsiLogicController(
          :key => scsi_key,
          :busNumber => scsi_number,
          :sharedBus => :noSharing
        )

        device_config_spec = RbVmomi::VIM::VirtualDeviceConfigSpec(
          :device => controller_device,
          :operation => RbVmomi::VIM::VirtualDeviceConfigSpecOperation('add')
        )

        vm_config_spec = RbVmomi::VIM::VirtualMachineConfigSpec(
          :deviceChange => [device_config_spec]
        )

        vm.ReconfigVM_Task(:spec => vm_config_spec).wait_for_completion

        vm.config.hardware.device.each { |device|
          if device.class == RbVmomi::VIM::VirtualLsiLogicController &&
             device.key == scsi_key
               controller = device.deviceInfo.label
          end
        }

        return controller
    end

    ############################################################################
    # Detach a specific disk from a VM
    # Attach disk to a VM
    # @params hostname[String] vcenter cluster name in opennebula as host
    # @params deploy_id[String] deploy id of the vm
    # @params ds_name[String] name of the datastore
    # @params img_path[String] path of the image
    ############################################################################
    def self.detach_disk(hostname, deploy_id, ds_name, img_path)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        vm          = connection.find_vm_template(deploy_id)

        ds_and_img_name = "[#{ds_name}] #{img_path}"

        disk  = vm.config.hardware.device.select { |d| is_disk?(d) &&
                                 d.backing.fileName == ds_and_img_name }

        raise "Disk #{img_path} not found." if disk.nil?

        spec = { :deviceChange => [{
                  :operation => :remove,
                  :device => disk[0]
               }]}

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    ############################################################################
    # Detach all disks from a VM
    # @params vm[VCenterVm] vCenter VM
    ############################################################################
    def self.detach_all_disks(vm)
        disks  = vm.config.hardware.device.select { |d| is_disk?(d) }

        return if disks.nil?

        spec = { :deviceChange => [] }

        disks.each{|disk|
            spec[:deviceChange] <<  {
                :operation => :remove,
                :device => disk
            }
        }

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end

    def self.create_context(context)
        # Remove <CONTEXT> (9) and </CONTEXT>\n (11)
        context_text = "# Context variables generated by OpenNebula\n"
        context.elements.each{|context_element|
            next if !context_element.text
            context_text += context_element.name + "='" +
                            context_element.text.gsub("'", "\\'") + "'\n"
        }
        context_text
    end

    ############################################################################
    # Detach attached disks from a VM
    ############################################################################
    def self.detach_attached_disks(vm, disks, hostname)
        hid         = VIClient::translate_hostname(hostname)
        connection  = VIClient.new(hid)

        spec = { :deviceChange => [] }

        disks.each{ |disk|
          ds_and_img_name = "[#{disk['DATASTORE']}] #{disk['SOURCE']}"
          vcenter_disk = vm.config.hardware.device.select { |d| is_disk?(d) &&
                                    d.backing.fileName == ds_and_img_name }[0]
           spec[:deviceChange] <<  {
                :operation => :remove,
                :device => vcenter_disk
            }
        }

        vm.ReconfigVM_Task(:spec => spec).wait_for_completion
    end
end
end
