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
require 'one_helper'
require 'one_helper/onevm_helper'

# OneVnet Command Helper
class OneVNetHelper < OpenNebulaHelper::OneHelper

    AR = {
        :name => 'address_range',
        :short => '-a ar_id',
        :large => '--address_range ar_id',
        :format => Integer,
        :description => 'ID of the address range'
    }

    SHOW_AR = {
        :name => 'show_ar',
        :large => '--show-ar',
        :description => 'Show also AR templates'
    }

    MAC = {
        :name => 'mac',
        :short => '-m mac',
        :large => '--mac mac',
        :format => String,
        :description => 'First MAC address in : notation'
    }

    IP = {
        :name => 'ip',
        :short => '-i ip',
        :large => '--ip ip',
        :format => String,
        :description => 'First IP address in . notation'
    }

    IP6 = {
        :name => 'ip6',
        :short => '-6 ip6',
        :large => '--ip6 ip6',
        :format => String,
        :description => 'First IPv6 address, in CIDR notation e.g. 2001::1/48'
    }

    SIZE = {
        :name => 'size',
        :short => '-s size',
        :large => '--size size',
        :format => String,
        :description => 'Number of addresses'
    }

    IP6_GLOBAL = {
        :name => 'ip6_global',
        :short => '-g ip6_pref',
        :large => '--ip6_global ip6_pref',
        :format => String,
        :description => 'IP6 global prefix'
    }

    IP6_ULA = {
        :name => 'ip6_ula',
        :short => '-u ip6_pref',
        :large => '--ip6_ula ip6_pref',
        :format => String,
        :description => 'IP6 ula prefix'
    }

    NAME = {
        :name => 'name',
        :short => '-n reservation name',
        :large => '--name reservation name',
        :format => String,
        :description => 'Name of the address reservation'
    }

    #    R_SIZE = {
    #        :name => "rsize",
    #        :short => "-s reservation size",
    #        :large => "--size reservation size",
    #        :format => String,
    #        :description => "Number of addresses to reserve"
    #    }

    GATEWAY = {
        :name       => 'gateway',
        :large      => '--gateway ip',
        :format     => String,
        :description=> 'IP of the gateway'
    }

    NETMASK = {
        :name       => 'netmask',
        :large      => '--netmask mask',
        :format     => String,
        :description=> 'Netmask in dot notation'
    }

    VN_MAD = {
        :name       => 'vn_mad',
        :large      => '--vn_mad mad',
        :format     => String,
        :description=> 'Use this driver for the network'
    }

    VLAN_ID = {
        :name       => 'vlanid',
        :large      => '--vlanid id',
        :format     => String,
        :description=> 'VLAN ID assigned'
    }

    ADDAR_OPTIONS = [
        SIZE, MAC, IP, IP6, IP6_GLOBAL, IP6_ULA, GATEWAY, NETMASK, VN_MAD,
        VLAN_ID
    ]

    def self.rname
        'VNET'
    end

    def self.conf_file
        'onevnet.yaml'
    end

    def self.state_to_str(id)
        id = id.to_i
        state_str = VirtualNetwork::VN_STATES[id]
        VirtualNetwork::SHORT_VN_STATES[state_str]
    end

    def format_pool(options)
        config_file = self.class.table_conf

        CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ONE identifier for Virtual Network', :size=>4 do |d|
                d['ID']
            end

            column :USER, 'Username of the Virtual Network owner', :left,
                   :size=>15 do |d|
                helper.user_name(d, options)
            end

            column :GROUP, 'Group of the Virtual Network', :left,
                   :size=>12 do |d|
                helper.group_name(d, options)
            end

            column :NAME, 'Name of the Virtual Network', :left,
                   :size=>19 do |d|
                d['NAME']
            end

            column :CLUSTERS, 'Cluster IDs', :left, :size=>10 do |d|
                OpenNebulaHelper.clusters_str(d['CLUSTERS']['ID']) rescue '-'
            end

            column :BRIDGE, 'Bridge associated to the Virtual Network', :left,
                   :size=>8 do |d|
                d['BRIDGE']
            end

            column :STATE, 'State of the Virtual Network', :left,
                   :size=>6 do |d|
                OneVNetHelper.state_to_str(d['STATE'])
            end

            column :LEASES, "Number of this Virtual Network's given leases",
                   :size=>6 do |d|
                d['USED_LEASES']
            end

            column :UPDATED, 'Number of VMs with updated VN attributes', :size=>4 do |d|
                if d['UPDATED_VMS']['ID'].nil?
                    '0'
                else
                    [d['UPDATED_VMS']['ID']].flatten.size
                end
            end

            column :OUTDATED, 'Number of VMs with outdated VN attributes', :size=>4 do |d|
                if d['OUTDATED_VMS']['ID'].nil?
                    '0'
                else
                    [d['OUTDATED_VMS']['ID']].flatten.size
                end
            end

            column :ERROR, 'Number of VMs that failed to update VN attributes', :size=>4 do |d|
                if d['ERROR_VMS']['ID'].nil?
                    '0'
                else
                    [d['ERROR_VMS']['ID']].flatten.size
                end
            end

            default :ID, :USER, :GROUP, :NAME, :CLUSTERS, :BRIDGE, :STATE,
                    :LEASES, :OUTDATED, :ERROR
        end
    end

    def show_ar(vn, ar_id)
        CLIHelper.print_header(format('%-80s', "TEMPLATE FOR AR #{ar_id}"),
                               false)

        begin
            template = vn.template_like_str("AR_POOL/AR[AR_ID=#{ar_id}]")
        rescue StandardError
            STDERR.puts "Can not get template for AR #{ar_id}"
            return
        end

        puts template
    end

    def check_orphans
        orphans = []
        xpath = '/VMTEMPLATE_POOL/VMTEMPLATE/TEMPLATE/NIC'

        pool = factory_pool
        tmpl_pool = OpenNebula::TemplatePool.new(@client, -2)

        pool.info
        tmpl_pool.info

        pool.each do |img|
            attrs = { :id    => img['ID'],
                      :name  => img['NAME'],
                      :uname => img['UNAME'] }

            orphans << img['ID'] if check_orphan(tmpl_pool,
                                                 xpath,
                                                 'NETWORK', attrs)
        end

        orphans
    end

    # Update VNet address range
    #
    # @param vnet_id [Intenger] Virtual Network ID
    # @param ar_id   [Intenger] Address Range ID
    # @param file    [String]   Path to file to read
    # @param options [Hash]     User CLI options
    def update_ar(vnet_id, ar_id, file, options)
        perform_action(vnet_id, options, 'AR updated') do |obj|
            rc = obj.info

            if OpenNebula.is_error?(rc)
                STDERR.puts rc.message
                exit(-1)
            end

            obj.delete_element("AR_POOL/AR[AR_ID!=#{ar_id}]")
            obj.delete_element('AR_POOL/AR/LEASES')
            obj.delete_element('AR_POOL/AR/USED_LEASES')
            obj.delete_element('AR_POOL/AR/MAC_END')
            obj.delete_element('AR_POOL/AR/IP_END')
            obj.delete_element('AR_POOL/AR/IP6_ULA')
            obj.delete_element('AR_POOL/AR/IP6_ULA_END')
            obj.delete_element('AR_POOL/AR/IP6_GLOBAL')
            obj.delete_element('AR_POOL/AR/IP6_GLOBAL_END')

            if obj.template_like_str('AR_POOL').empty?
                STDERR.puts "Address Range #{ar_id} does not exist for " \
                            "Virtual Network #{vnet_id}"
                exit(-1)
            end

            xpath = "AR_POOL/AR[AR_ID=#{ar_id}]"

            if options[:append]
                str = OpenNebulaHelper.append_template(vnet_id,
                                                       obj,
                                                       file,
                                                       xpath)
            else
                str = OpenNebulaHelper.update_template(vnet_id,
                                                       obj,
                                                       file,
                                                       xpath)
            end

            if options[:append]
                # Insert element in current template
                parts = obj.template_like_str('AR_POOL').split("\n")

                # Insert it in second position, OpenNebula will sort it
                parts.insert(1, "#{str.strip},")

                parts = parts.join("\n")
                str   = parts
            else
                # Use the information from user
                unless str.gsub(' ', '').match(/AR=\[/)
                    str = "AR=[\n#{str.split("\n").join(",\n")}]"
                end
            end

            obj.update_ar(str)
        end
    end

    private

    def factory(id = nil)
        if id
            OpenNebula::VirtualNetwork.new_with_id(id, @client)
        else
            xml=OpenNebula::VirtualNetwork.build_xml
            OpenNebula::VirtualNetwork.new(xml, @client)
        end
    end

    def factory_pool(user_flag = -2)
        OpenNebula::VirtualNetworkPool.new(@client, user_flag)
    end

    def format_resource(vn, options = {})
        vn_hash = vn.to_hash

        str_h1='%-80s'
        CLIHelper.print_header(format(str_h1,
                                      "VIRTUAL NETWORK #{vn.id} INFORMATION"))

        str='%-25s: %-20s'
        puts format(str, 'ID', vn.id.to_s)
        puts format(str, 'NAME', vn['NAME'])
        puts format(str, 'USER', vn['UNAME'])
        puts format(str, 'GROUP', vn['GNAME'])
        puts format(str, 'LOCK',
                    OpenNebulaHelper.level_lock_to_str(vn['LOCK/LOCKED']))
        puts format(str, 'CLUSTERS',
                    OpenNebulaHelper.clusters_str(
                        vn.retrieve_elements('CLUSTERS/ID')
                    ))
        puts format(str, 'BRIDGE', vn['BRIDGE'])
        puts format(str, 'STATE', vn.state_str)
        puts format(str, 'VN_MAD', vn['VN_MAD']) unless vn['VN_MAD'].empty?
        puts format(str, 'PHYSICAL DEVICE',
                    vn['PHYDEV']) unless vn['PHYDEV'].empty?
        puts format(str, 'VLAN ID', vn['VLAN_ID']) unless vn['VLAN_ID'].empty?
        puts format(str, 'AUTOMATIC VLAN ID',
                    vn['VLAN_ID_AUTOMATIC']=='1' ? 'YES' : 'NO')
        puts format(str, 'OUTER VLAN ID',
                    vn['OUTER_VLAN_ID']) unless vn['OUTER_VLAN_ID']
        puts format(str, 'AUTOMATIC OUTER VLAN ID',
                    vn['OUTER_VLAN_ID_AUTOMATIC']=='1' ? 'YES' : 'NO')
        puts format(str, 'USED LEASES', vn['USED_LEASES'])
        puts

        CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

        ['OWNER', 'GROUP', 'OTHER'].each do |e|
            mask = '---'
            mask[0] = 'u' if vn["PERMISSIONS/#{e}_U"] == '1'
            mask[1] = 'm' if vn["PERMISSIONS/#{e}_M"] == '1'
            mask[2] = 'a' if vn["PERMISSIONS/#{e}_A"] == '1'

            puts format(str, e, mask)
        end

        puts

        CLIHelper.print_header(format(str_h1, 'VIRTUAL NETWORK TEMPLATE'),
                               false)

        puts vn.template_str(false)

        puts

        CLIHelper.print_header(format(str_h1, 'ADDRESS RANGE POOL'), false)

        arlist = []

        if !vn_hash['VNET']['AR_POOL']['AR'].nil?
            arlist = [vn_hash['VNET']['AR_POOL']['AR']].flatten
        end

        arlist.each do |ar|
            CLIHelper.print_header(format('%-80s', "AR #{ar['AR_ID']}"))

            str='%-15s: %-20s'
            puts format(str, 'SIZE', ar['SIZE'])
            puts format(str, 'LEASES', ar['USED_LEASES'])
            puts format(str, 'VN_MAD', ar['VN_MAD']) if ar['VN_MAD']
            puts format(str, 'IPAM_MAD', ar['IPAM_MAD']) if ar['IPAM_MAD']
            puts

            format = '%-10s %34s %34s'
            CLIHelper.print_header(
                format(format, 'RANGE', 'FIRST', 'LAST'), false
            )

            puts format(format, 'MAC', ar['MAC'], ar['MAC_END'])

            if !ar['IP'].nil?
                puts format(format, 'IP', ar['IP'], ar['IP_END'])
            end

            if !ar['IP6_GLOBAL'].nil?
                puts format(format, 'IP6_GLOBAL', ar['IP6_GLOBAL'],
                            ar['IP6_GLOBAL_END'])
            end

            if !ar['IP6_ULA'].nil?
                puts format(format, 'IP6_ULA', ar['IP6_ULA'], ar['IP6_ULA_END'])
            end

            if !ar['IP6'].nil?
                puts format(format, 'IP6', ar['IP6'], ar['IP6_END'])
            end

            puts
        end

        puts
        CLIHelper.print_header(format(str_h1, 'LEASES'), false)
        ar_list = []

        if !vn_hash['VNET']['AR_POOL']['AR'].nil?
            lease_list = [vn_hash['VNET']['AR_POOL']['AR']].flatten
            leases     = []

            lease_list.each do |ar|
                id = ar['AR_ID']
                ar_list << id

                next unless ar['LEASES'] && !ar['LEASES']['LEASE'].nil?

                lease = [ar['LEASES']['LEASE']].flatten
                lease.each do |l|
                    l['AR_ID'] = id
                end
                leases << lease
            end

            leases.flatten!
        end

        CLIHelper::ShowTable.new(nil, self) do
            column :AR, '', :left, :size=>3 do |d|
                d['AR_ID']
            end

            column :OWNER, '', :left, :size=>10 do |d|
                if d['VM']
                    "V:#{d['VM']}"
                elsif d['VNET']
                    "N:#{d['VNET']}"
                elsif d['VROUTER']
                    "R:#{d['VROUTER']}"
                end
            end

            column :MAC, '', :adjust do |d|
                d['MAC']
            end

            column :IP, '', :adjust do |d|
                d['IP'] || '-'
            end

            column :PORT_FORWARD, '', :adjust do |d|
                if d['EXTERNAL_PORT_RANGE']
                    "[#{d['EXTERNAL_PORT_RANGE']}]:" \
                    "[#{d['INTERNAL_PORT_RANGE'].split('/')[0]}]"
                else
                    '-'
                end
            end

            column :IP6, '', :adjust do |d|
                d['IP6']||d['IP6_GLOBAL']||'-'
            end
        end.show(leases, {})

        puts

        CLIHelper.print_header(format('%-15s', 'VIRTUAL ROUTERS'))
        vn.vrouter_ids.each do |id|
            puts format('%-15s', id)
        end

        puts

        CLIHelper.print_header(str_h1 % 'VIRTUAL MACHINES', false)

        updated, outdated, error = vn.vm_ids

        puts format(str, 'UPDATED', updated.join(','))
        puts format(str, 'OUTDATED', outdated.join(','))
        puts format(str, 'ERROR', error.join(','))

        return unless options[:show_ar]

        ar_list.each do |ar_id|
            puts
            show_ar(vn, ar_id)
        end
    end

    def self.add_ar_options_used?(options)
        # Get the template options names as symbols. options hash
        # uses symbols
        add_ar_options=OneVNetHelper::ADDAR_OPTIONS.map do |o|
            o[:name].to_sym
        end

        # Check if one at least one of the template options is
        # in options hash
        (add_ar_options-options.keys)!=add_ar_options
    end

end
