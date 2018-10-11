#!/usr/bin/ruby

require_relative 'lxd_driver'

module LXDriver

    # Container XML to Hash parser
    class XML

        TEMPLATE_PREFIX = '//TEMPLATE/'

        attr_reader :vm_id, :datastores, :sysds_id, :rootfs_id

        def initialize(xml_file)
            @xml = OpenNebula::XMLElement.new
            @xml.initialize_xml(xml_file, 'VM')
            @vm_id = single_element('VMID')
            @datastores = datastores
            @sysds_id = xml_single_element('//HISTORY_RECORDS/HISTORY/DS_ID')
            @rootfs_id = rootfs_id
        end

        # Returns the diskid corresponding to the root device
        def rootfs_id
            # TODO: Add support when path is /
            bootme = '0'
            boot_order = single_element('OS/BOOT')
            bootme = boot_order.split(',')[0][-1] if boot_order != ''
            bootme
        end

        # gets opennebula datastores path
        def datastores
            disk = complex_element('DISK')
            source = disk['SOURCE']
            ds_id = disk['DATASTORE_ID']
            source.split(ds_id + '/')[0].chomp
        end

        ###############
        #   Mapping   #
        ###############

        # Creates a dictionary for LXD containing $MEMORY RAM allocated
        def memory(hash)
            ram = single_element('MEMORY')
            ram = ram.to_s + 'MB'
            hash['limits.memory'] = ram
        end

        # Creates a dictionary for LXD  $CPU percentage and cores
        def cpu(hash)
            cpu = single_element('CPU')
            cpu = (cpu.to_f * 100).to_i.to_s + '%'
            hash['limits.cpu.allowance'] = cpu

            vcpu = single_element('VCPU')
            hash['limits.cpu'] = vcpu if vcpu
        end

        # Sets up the network interfaces configuration in devices
        def network(hash)
            nics = multiple_elements('NIC')
            nics.each do |nic|
                info = nic['NIC']
                name = "eth#{info['NIC_ID']}"
                eth = LXDriver.nic(name, info['TARGET'], info['BRIDGE'], info['MAC'])

                # TODO: include nic_io in nic
                hash[name] = LXDriver.nic_io(eth, info)
            end
        end

        # Sets up the storage devices configuration in devices
        def storage(hash)
            disks = multiple_elements('DISK')

            # disks
            if disks.length > 1
                disks.each {|d| disks.insert(0, d).uniq if d['ID'] == @rootfs_id }

                disks[1..-1].each do |disk|
                    info = disk['DISK']
                    disk_id = info['DISK_ID']

                    source = LXDriver.device_path(self, "#{@vm_id}/mapper", disk_id)
                    path = info['TARGET'] # TODO: path is TARGET: hda, hdc, hdd
                    path = "/media/#{disk_id}" unless path.include?('/')

                    disk_config = { 'type' => 'disk', 'path' => path, 'source' => source }
                    disk_config.update(LXDriver.disk_common(info))

                    hash['disk' + disk_id] = disk_config
                end
            end

            # root
            info = disks[0]['DISK']
            root = { 'type' => 'disk', 'path' => '/', 'pool' => 'default' }
            hash['root'] = root.update(LXDriver.disk_common(info))

            # context
            hash.update(context) if single_element('CONTEXT')
        end

        # Creates the context iso device hash
        def context
            info = complex_element('CONTEXT')
            disk_id = info['DISK_ID']
            source = LXDriver.device_path(self, "#{@vm_id}/mapper", disk_id)
            data = LXDriver.disk(source, '/mnt')
            { 'context' => data }
        end

        ###############
        # XML Parsing #
        ###############

        # Returns PATH's instance in XML
        def xml_single_element(path)
            @xml[path]
        end

        def single_element(path)
            xml_single_element(TEMPLATE_PREFIX + path)
        end

        # Returns an Array with PATH's instances in XML
        def xml_multiple_elements(path)
            elements = []
            @xml.retrieve_xmlelements(path).each {|d| elements.append(d.to_hash) }
            elements
        end

        def multiple_elements(path)
            xml_multiple_elements(TEMPLATE_PREFIX + path)
        end

        def complex_element(path)
            multiple_elements(path)[0][path]
        end

    end

    # Container description hash
    class YAML < Hash

        def initialize(xml)
            self['name'] = 'one-' + xml.vm_id
            self['config'] = {}
            self['devices'] = {}

            xml.memory(self['config'])
            xml.cpu(self['config'])
            xml.network(self['devices'])
            xml.storage(self['devices'])
        end

    end

end
