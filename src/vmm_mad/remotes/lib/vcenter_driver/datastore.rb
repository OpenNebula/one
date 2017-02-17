module VCenterDriver

class DatastoreFolder
    attr_accessor :item, :items

    def initialize(item)
        @item = item
        @items = {}
    end

    ########################################################################
    # Builds a hash with Datastore-Ref / Datastore to be used as a cache
    # @return [Hash] in the form
    #   { ds_ref [Symbol] => Datastore object }
    ########################################################################
    def fetch!
        VIClient.get_entities(@item, "Datastore").each do |item|
            item_name = item._ref
            @items[item_name.to_sym] = Datastore.new(item)
        end

        VIClient.get_entities(@item, "StoragePod").each do |sp|
            VIClient.get_entities(sp, "Datastore").each do |item|
                item_name = item._ref
                @items[item_name.to_sym] = Datastore.new(item)
            end
        end
    end

    def monitor
        monitor = ""
        @items.values.each do |ds|
            monitor << "VCENTER_DATASTORE=\"#{ds['name']}\"\n"
        end
        monitor
    end

    ########################################################################
    # Returns a Datastore. Uses the cache if available.
    # @param ref [Symbol] the vcenter ref
    # @return Datastore
    ########################################################################
    def get(ref)
        if !@items[ref.to_sym]
            rbvmomi_dc = RbVmomi::VIM::Datastore.new(@item._connection, ref)
            @items[ref.to_sym] = Datastore.new(rbvmomi_dc)
        end

        @items[ref.to_sym]
    end
end # class DatastoreFolder

class Datastore
    attr_accessor :item

    include Memoize

    def initialize(item, vi_client=nil)
        if !item.instance_of? RbVmomi::VIM::Datastore
            raise "Expecting type 'RbVmomi::VIM::Datastore'. " <<
                  "Got '#{item.class} instead."
        end

        @item = item
    end

    def monitor
        summary = @item.summary

        total_mb = (summary.capacity.to_i / 1024) / 1024
        free_mb  = (summary.freeSpace.to_i / 1024) / 1024
        used_mb  = total_mb - free_mb

        "USED_MB=#{used_mb}\nFREE_MB=#{free_mb} \nTOTAL_MB=#{total_mb}"
    end

    def create_virtual_disk(img_name, size, adapter_type, disk_type)
        ds_name = self['name']

        vmdk_spec = RbVmomi::VIM::FileBackedVirtualDiskSpec(
            :adapterType => adapter_type,
            :capacityKb  => size.to_i*1024,
            :diskType    => disk_type
        )

        get_vdm.CreateVirtualDisk_Task(
          :datacenter => get_dc.item,
          :name       => "[#{ds_name}] #{img_name}.vmdk",
          :spec       => vmdk_spec
        ).wait_for_completion

        "#{img_name}.vmdk"
    end

    def delete_virtual_disk(img_name)
        ds_name = self['name']

        get_vdm.DeleteVirtualDisk_Task(
          :name => "[#{ds_name}] #{img_name}",
          :datacenter => get_dc.item
        ).wait_for_completion
    end

    # Copy a VirtualDisk
    # @param ds_name [String] name of the datastore
    # @param img_str [String] path to the VirtualDisk
    def copy_virtual_disk(src_path, target_ds_name, target_path)
        source_ds_name = self['name']

        copy_params = {
            :sourceName       => "[#{source_ds_name}] #{src_path}",
            :sourceDatacenter => get_dc.item,
            :destName         => "[#{target_ds_name}] #{target_path}"
        }

        get_vdm.CopyVirtualDisk_Task(copy_params).wait_for_completion

        target_path
    end

    def create_directory(directory)
        ds_name = self['name']

        create_directory_params = {
            :name                     => "[#{ds_name}] #{directory}",
            :datacenter               => get_dc.item,
            :createParentDirectories  => true
        }

        begin
            get_fm.MakeDirectory(create_directory_params)
        rescue RbVmomi::VIM::FileAlreadyExists => e
            # Do nothing if directory already exists
        end
    end

    def upload_file(source_path, target_path)
        @item.upload(target_path, source_path)
    end

    def download_file(source, target)
        @item.download(url_prefix + file, temp_folder + file)
    end

    # Get file size for image handling
    def stat(img_str)
        ds_name = self['name']

        img_path = File.dirname img_str
        img_name = File.basename img_str

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
        begin
            search_task = self['browser'].
                SearchDatastoreSubFolders_Task(search_params)

            search_task.wait_for_completion

            file_size = search_task.info.result[0].file[0].fileSize rescue nil

            raise "Could not get file size" if file_size.nil?

            (file_size / 1024) / 1024

        rescue
            raise "Could not find file."
        end
    end

    def get_fm
        self['_connection.serviceContent.fileManager']
    end

    def get_vdm
        self['_connection.serviceContent.virtualDiskManager']
    end

    def get_dc
        item = @item

        while !item.instance_of? RbVmomi::VIM::Datacenter
            item = item.parent
            if item.nil?
                raise "Could not find the parent Datacenter"
            end
        end

        Datacenter.new(item)
    end

    def get_dc_path
        dc = get_dc
        p = dc.item.parent
        path = [dc.item.name]
        while p.instance_of? RbVmomi::VIM::Folder
            path.unshift(p.name)
            p = p.parent
        end
        path.delete_at(0) # The first folder is the root "Datacenters"
        path.join('/')
    end

    def generate_file_url(path)
        protocol = self[_connection.http.use_ssl?] ? 'https://' : 'http://'
        hostname = self[_connection.http.address]
        port     = self[_connection.http.port]
        dcpath   = get_dc_path

        # This creates the vcenter file URL for uploading or downloading files
        # e.g:
        url = "#{protocol}#{hostname}:#{port}/folder/#{path}?dcPath=#{dcpath}&dsName=#{self[name]}"
        return url
    end

    def download_to_stdout(remote_path)
        url = generate_file_url(remote_path)
        pid = spawn(CURLBIN,
                    "-k", '--noproxy', '*', '-f',
                    "-b", self[_connection.cookie],
                    url)

        Process.waitpid(pid, 0)
        fail "download failed" unless $?.success?
    end

    def is_descriptor?(remote_path)
        url = generate_file_url(remote_path)

        rout, wout = IO.pipe
        pid = spawn(CURLBIN,
                    "-I", "-k", '--noproxy', '*', '-f',
                    "-b", _connection.cookie,
                    url,
                    :out => wout,
                    :err => '/dev/null')

        Process.waitpid(pid, 0)
        fail "read image header failed" unless $?.success?

        wout.close
        size = rout.readlines.select{|l|
            l.start_with?("Content-Length")
        }[0].sub("Content-Length: ","")
        rout.close
        size.chomp.to_i < 4096   # If <4k, then is a descriptor
    end

    def get_text_file remote_path
        url = generate_file_url(remote_path)

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

    # This is never cached
    def self.new_from_ref(ref, vi_client)
        self.new(RbVmomi::VIM::Datastore.new(vi_client.vim, ref), vi_client)
    end
end # class Datastore

end # module VCenterDriver

