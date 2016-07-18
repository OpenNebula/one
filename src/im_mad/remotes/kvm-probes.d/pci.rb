#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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


# This variable contains the filters for PCI card monitoring. The format
# is the same as lspci and several filters can be added separated by commas.
# A nil filter will retrieve all PCI cards.
#
# From lspci help:
#     -d [<vendor>]:[<device>]
#
# For example
#
# FILTER = '10de:*' # all NVIDIA VGA cards
# FILTER = '10de:11bf' # only GK104GL [GRID K2]
# FILTER = '*:10d3' #Only 82574L Gigabit Network cards
# FILTER = '*:*' # all devices
# FILTER = '0:0' # no devices
#
# You can also filter by the SHORT_ADDRESS, to add only devices in a given address
#
# For example
#
# SHORT_ADDRESS = [ "07:00.0", "06:00.0" ]
#
# Finally you can match devices by device name patterns, only those devices that
# the pattern will be added to the list.
#
# For example
#
# DEVICE_NAME  = [ /Virtual Function/, /Gigabit Network/]
#
# Note that these filters, if defined, are all applied

FILTER = "0:0"
SHORT_ADDRESS = []
DEVICE_NAME   = []

require 'shellwords'

def get_pci(filter=nil)
    command = "lspci -mmnn"
    command << " -d #{filter}" if filter

    text = %x(#{command})

    text.split("\n").map {|l| Shellwords.split(l) }
end

def get_name_and_id(text)
    m = text.match(/^(.*) \[(....)\]$/)
    return m[1], m[2]
end

def parse_pci(pci)
    card = {}

    card[:short_address] = pci[0]
    card[:libvirt_address] =
        "pci_0000_#{card[:short_address].gsub(/[:.]/, '_')}"
    card[:address] = "0000:#{card[:short_address].gsub(/[:.]/, ':')}"

    card[:class_name], card[:class] = get_name_and_id(pci[1])
    card[:vendor_name], card[:vendor] = get_name_and_id(pci[2])
    card[:device_name], card[:device] = get_name_and_id(pci[3])

    card[:bus], card[:slot], card[:function] = pci[0].split(/[:.]/)

    card[:type] = [card[:vendor], card[:device], card[:class]].join(':')

    card
end

def get_devices(filter=nil)
    if filter
        filter = filter.split(',')
    else
        filter = [nil]
    end

    filter.map do |f|
        get_pci(f).map {|pci| parse_pci(pci) }
    end.flatten
end

filter = FILTER

devices = get_devices(filter)

def pval(name, value)
    %Q(  #{name} = "#{value}")
end

devices.each do |dev|
    next if !SHORT_ADDRESS.empty? && !SHORT_ADDRESS.include?(dev[:short_address])

    if !DEVICE_NAME.empty?
        matched = DEVICE_NAME.each { |pattern|
            break true if !(dev[:device_name] =~ pattern).nil?
        }

        next if matched != true
    end

    puts "PCI = ["
    values = [
        pval('TYPE', dev[:type]),
        pval('VENDOR', dev[:vendor]),
        pval('VENDOR_NAME', dev[:vendor_name]),
        pval('DEVICE', dev[:device]),
        pval('DEVICE_NAME', dev[:device_name]),
        pval('CLASS', dev[:class]),
        pval('CLASS_NAME', dev[:class_name]),
        pval('ADDRESS', dev[:address]),
        pval('SHORT_ADDRESS', dev[:short_address]),
        pval('DOMAIN', '0000'),
        pval('BUS', dev[:bus]),
        pval('SLOT', dev[:slot]),
        pval('FUNCTION', dev[:function])
    ]

    puts values.join(",\n")
    puts "]"
end

