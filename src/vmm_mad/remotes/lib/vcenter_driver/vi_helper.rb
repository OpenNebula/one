module VCenterDriver

class VIHelper

    ETC_LOCATION = "/etc/one/" if !defined?(ETC_LOCATION)
    VCENTER_DRIVER_DEFAULT = "#{ETC_LOCATION}/vcenter_driver.default"
    VM_PREFIX_DEFAULT = "one-$i-"

    def self.client
        @@client ||= OpenNebula::Client.new
    end

    def self.return_if_error(rc, item, exit_if_fail)
        if OpenNebula::is_error?(rc)
            raise rc.message if !exit_if_fail

            STDERR.puts rc.message
            exit 1
        else
            item
        end
    end

    require 'scripts_common'
    def self.check_error(rc, message, _exit=false)
        if OpenNebula::is_error?(rc)
            OpenNebula::error_message("\n    Error #{message}: #{rc.message}\n")
            exit 1 if (_exit)

            raise rc.message
        end
    end

    def self.get_cluster_id(clusters)
        clusters.each do |id|
            return id unless id == -1
        end

        return -1
    end

    def self.one_managed?(object)
        if object.class.ancestors.include?(OpenNebula::XMLElement)
            managed = object["TEMPLATE/OPENNEBULA_MANAGED"] || object["USER_TEMPLATE/OPENNEBULA_MANAGED"]

            return managed != "NO"
        end
        return false
    end

    def self.one_item(the_class, id, exit_if_fail = true)
        item = the_class.new_with_id(id, client)
        rc = item.info
        return_if_error(rc, item, exit_if_fail)
    end

    def self.new_one_item(the_class)
        item = the_class.new(the_class.build_xml, client)
        return item
    end

    def self.one_pool(the_class, exit_if_fail = true)
        item = the_class.new(client)

        rc = nil
        begin
            rc = item.info_all
        rescue
            rc = item.info
        end

        return_if_error(rc, item, exit_if_fail)
    end

    def self.find_by_name(the_class, name, pool = nil, raise_if_fail = true)
        pool = one_pool(the_class, raise_if_fail) if pool.nil?
        element = pool.find{|e| e['NAME'] == "#{name}" }
        if element.nil? && raise_if_fail
            raise "Could not find element '#{name}' in pool '#{the_class}'"
        else
            element
        end
    end

    def self.get_ref_key(element, attribute)
        key = element[attribute]

        tvid = element["TEMPLATE/VCENTER_INSTANCE_ID"]
        uvid = element["USER_TEMPLATE/VCENTER_INSTANCE_ID"]

        if tvid
            key += tvid
        elsif uvid
            key += uvid
        end

        return key
    end

    def self.create_ref_hash(attribute, pool)
        hash = {}

        pool.each_element(Proc.new do |e|
            refkey = get_ref_key(e, attribute)
            hash[refkey] =  e
        end)

        hash
    end

    def self.clean_ref_hash(attr = nil)
        if attr.nil?
            @ref_hash = {}
        else
            @ref_hash[attr] = {} unless @ref_hash.nil?
        end
    end

    def self.find_by_ref(the_class, attribute, ref, vcenter_uuid, pool = nil)
        pool = one_pool(the_class, false) if pool.nil?
        @ref_hash ||= {}

        if @ref_hash[attribute].nil? || @ref_hash[attribute] == {}
            @ref_hash[attribute] = create_ref_hash(attribute, pool)
        end

        refkey = ""
        refkey = ref if ref
        refkey += vcenter_uuid if vcenter_uuid

        return @ref_hash[attribute][refkey]
    end

    def self.find_image_by(att, the_class, path, ds_id, pool = nil)
        pool = one_pool(the_class, false) if pool.nil?
        element = pool.find{|e|
            e[att] == path &&
            e["DATASTORE_ID"] == ds_id}
        return element
    end

    def self.find_persistent_image_by_source(source, pool)
        element = pool.find{|e|
            e["SOURCE"] == source &&
            e["PERSISTENT"] == "1"
        }

        return element
    end

    def self.find_vcenter_vm_by_name(one_vm, host, vi_client)
        # Let's try to find the VM object only by its name
        # Let's build the VM name
        vm_prefix = host['TEMPLATE/VM_PREFIX']
        vm_prefix = VM_PREFIX_DEFAULT if vm_prefix.nil? || vm_prefix.empty?
        vm_prefix.gsub!("$i", one_vm['ID'])
        vm_name =  vm_prefix + one_vm['NAME']

        # We have no DEPLOY_ID, the VM has never been deployed
        # let's use a view to try to find the VM from the root folder
        view = vi_client.vim.serviceContent.viewManager.CreateContainerView({
            container: vi_client.vim.rootFolder,
            type:      ['VirtualMachine'],
            recursive: true
        })

        vcenter_vm = view.view.find{ |v| v.name == vm_name } if !!view.view && !view.view.empty?

        view.DestroyView # Destroy the view

        return vcenter_vm
    end

    def self.get_default(xpath)
        begin
            xml = OpenNebula::XMLElement.new
            xml.initialize_xml(File.read(VCENTER_DRIVER_DEFAULT), 'VCENTER')
            return xml[xpath]
        rescue
            return nil
        end
    end

    def self.get_location(item)
        folders = []
        while !item.instance_of? RbVmomi::VIM::Datacenter
            item = item.parent
            if !item.instance_of? RbVmomi::VIM::Datacenter
                folders << item.name if item.name != "host"
            end
            raise "Could not find the location" if item.nil?
        end
        location   = folders.reverse.join("/")
        location = "/" if location.empty?

        return location
    end

end # class VIHelper

end # module VCenterDriver
