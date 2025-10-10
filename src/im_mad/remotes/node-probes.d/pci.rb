#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
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

require 'shellwords'
require 'yaml'

begin
    probes_path = File.dirname(File.realdirpath(__FILE__))
    ETC_NAME = probes_path.split(File::SEPARATOR)[-3]

    NAME = File.join(__dir__, "../../../../etc/im/#{ETC_NAME}/pci.conf")
    CONF = {
        :filter         => '0:0',
        :short_address  => [],
        :device_name    => [],
        :nvidia_vendors => ['10de']
    }.merge(YAML.load_file(NAME))
rescue StandardError
    STDERR.puts "Invalid configuration #{NAME}"
    exit(-1)
end

def get_pci(filter = nil)
    command = 'lspci -mmnn'
    command << " -d #{filter}" if filter

    text = `#{command}`

    text.split("\n").map {|l| Shellwords.split(l) }
end

def get_name_and_id(text)
    m = text.match(/^(.*) \[(....)\]$/)
    [m[1], m[2]]
end

def parse_pci(pci)
    card = {}
    card[:short_address] = pci[0]

    bus_address = pci[0].split(/[:.]/)

    bus_address.unshift('0000') if bus_address.length == 3

    card[:domain]   = bus_address[0]
    card[:bus]      = bus_address[1]
    card[:slot]     = bus_address[2]
    card[:function] = bus_address[3]

    card[:libvirt_address] = "pci_#{bus_address.join('_')}"
    card[:address] = bus_address.join(':')

    begin
        caddr     = "#{bus_address[0..2].join(':')}.#{bus_address[3]}"
        numa_node = File.read("/sys/bus/pci/devices/#{caddr}/numa_node").chomp
    rescue StandardError
        numa_node = '-'
    end

    numa_node = '-' if numa_node.to_i < 0

    card[:numa_node] = numa_node

    card[:class_name],  card[:class]  = get_name_and_id(pci[1])
    card[:vendor_name], card[:vendor] = get_name_and_id(pci[2])
    card[:device_name], card[:device] = get_name_and_id(pci[3])

    card[:type] = "#{card[:vendor]}:#{card[:device]}:#{card[:class]}"

    card
end

def get_devices(filter = nil)
    if filter
        filter = [filter].flatten.map {|f| f.split(',') }.flatten
    else
        filter = [nil]
    end

    filter.map do |f|
        get_pci(f).map {|pci| parse_pci(pci) }
    end.flatten
end

def pci_bus_path(device)
    "/sys/bus/pci/devices/#{device[:domain]}:#{device[:bus]}:#{device[:slot]}.#{device[:function]}"
end

def mdev_bus_path(device)
    "/sys/class/mdev_bus/#{device[:domain]}:#{device[:bus]}:#{device[:slot]}.#{device[:function]}"
end

def device_attr?(device, attribute)
    File.exist? File.join(pci_bus_path(device), attribute)
end

def virtfn?(device)
    device_attr?(device, 'physfn')
end

# rubocop:disable Naming/PredicateName
def has_virtfn?(device)
    device_attr?(device, 'virtfn')
end
# rubocop:enable Naming/PredicateName

def legacy?(device)
    File.exist? File.join mdev_bus_path(device)
end

def legacy_profiles(device)
    path = File.join(mdev_bus_path(device), 'mdev_supported_types')

    return [] unless File.exist? path

    `ls #{path}`.split("\n")
rescue StandardError
    []
end

def nvidia_profiles(device)
    path = File.join(pci_bus_path(device), 'nvidia/creatable_vgpu_types')

    profiles = []

    File.read(path).each_line do |line|
        id, name = line.split(':')

        id.strip!
        name.strip!

        next if id.empty? || id.casecmp?('ID') || name.empty?

        profiles << "#{id} (#{name})"
    end

    profiles
rescue StandardError
    []
end

filter = CONF[:filter]

devices = get_devices(filter)

def pval(name, value)
    %( #{name} = "#{value}" )
end

devices.each do |dev|
    next if !CONF[:short_address].empty? &&
        !CONF[:short_address].include?(dev[:short_address])

    if !CONF[:device_name].empty?
        matched = CONF[:device_name].each do |pattern|
            break true unless (dev[:device_name] =~ /#{pattern}/i).nil?
        end

        next if matched != true
    end

    # Skip NVIDIA cards with virtual functions
    next if CONF[:nvidia_vendors].include?(dev[:vendor]) && has_virtfn?(dev)

    puts 'PCI = ['
    values = [
        pval('TYPE', dev[:type]),
        pval('VENDOR', dev[:vendor]),
        pval('VENDOR_NAME', dev[:vendor_name]),
        pval('DEVICE', dev[:device]),
        pval('CLASS', dev[:class]),
        pval('CLASS_NAME', dev[:class_name]),
        pval('ADDRESS', dev[:address]),
        pval('SHORT_ADDRESS', dev[:short_address]),
        pval('DOMAIN', dev[:domain]),
        pval('BUS', dev[:bus]),
        pval('SLOT', dev[:slot]),
        pval('FUNCTION', dev[:function]),
        pval('NUMA_NODE', dev[:numa_node])
    ]

    # NVIDIA GPU device
    if CONF[:nvidia_vendors].include?(dev[:vendor])
        if virtfn?(dev)
            # PCI name for NVIDIA vGPUs
            values << pval('DEVICE_NAME', 'NVIDIA vGPU device')

            # For vGPU, the uuid is based on the address to get always the same
            values << pval(
                'UUID',
                `uuidgen --name '#{dev[:address]}' \
                --namespace '@x500' --sha1`.strip
            )

            # Comma separated value with different profiles
            profiles = legacy_profiles(dev)
            profiles = nvidia_profiles(dev) if profiles.empty?

            values << pval('PROFILES', profiles.join(','))

            mdev_mode = if legacy?(dev)
                            'legacy'
                        else
                            'nvidia'
                        end
            values << pval('MDEV_MODE', mdev_mode)
        else
            # PCI name for NVIDIA GPUs
            values << pval('DEVICE_NAME', "#{dev[:vendor_name]} #{dev[:device_name]}")
        end
    else
        values << pval('DEVICE_NAME', dev[:device_name])
    end

    puts values.join(",\n")
    puts ']'
end
