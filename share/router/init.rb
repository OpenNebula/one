#!/usr/bin/env ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'rexml/document'
require 'base64'
require 'fileutils'

class Router
    # Default files
    FILES = {
        :resolv_conf   => "/etc/resolv.conf",
        :context       => "/mnt/context/context.sh",
        :dnsmasq_conf  => "/etc/dnsmasq.conf",
        :log_file      => "/var/log/router.log"
    }

    # Default MAC prefix
    MAC_PREFIX = "02:00"

    # Default gateway (last byte)
    DEFAULT_GW = "1"

    # Default netmask
    DEFAULT_NETMASK = "255.255.255.0"

    # Context parameters that are base64 encoded
    BASE_64_KEYS = [:privnet, :pubnet, :template]

    # The specification on how to fetch these attributes.
    # The order in the array matters, the first non-empty one is returned.
    ATTRIBUTES = {
        :dns => [
            {
                :resource => :context
            },
            {
                :resource       => :pubnet,
                :resource_xpath => 'TEMPLATE/DNS'
            }
        ],
        :search => [
            {
                :resource => :context
            },
            {
                :resource       => :pubnet,
                :resource_xpath => 'TEMPLATE/SEARCH'
            }
        ],
        :nat => [
            {
                :resource => :context,
                :resource_name => "FORWARDING"
            },
            {
                :resource       => :privnet,
                :resource_xpath => 'TEMPLATE/FORWARDING'
            }
        ],
        :dhcp => [
            {
                :resource => :context
            },
            {
                :resource       => :privnet,
                :resource_xpath => 'TEMPLATE/DHCP'
            }
        ],
        :ntp => [
            {
                :resource => :context
            },
            {
                :resource       => :privnet,
                :resource_xpath => 'TEMPLATE/NTP'
            }
        ],
        :root_pubkey => [
            {
                :resource => :context
            }
        ],
        :root_password => [
            {
                :resource => :context
            }
        ]
    }

    def initialize
        @context = read_context
        unpack
        get_network_information
    end

    ############################################################################
    # GETTERS
    ############################################################################

    def pubnet
        !@pubnet[:network_id].nil?
    end

    def privnet
        !@privnet[:network_id].nil?
    end

    def dns
        dns_raw = get_attribute(:dns)
        dns_raw.split if !dns_raw.nil?
    end

    def search
        get_attribute(:search)
    end

    def root_password
        get_attribute(:root_password)
    end

    def root_pubkey
        get_attribute(:root_pubkey)
    end

    def nat
        nat_raw = get_attribute(:nat)
        nat_raw.split if !nat_raw.nil?
    end

    def dhcp
        dhcp_raw = get_attribute(:dhcp) || ""
        if dhcp_raw.downcase.match(/^y(es)?$/)
            true
        else
            false
        end
    end

    def ntp
        ntp_raw = get_attribute(:ntp) || ""
        if ntp_raw.downcase.match(/^y(es)?$/)
            true
        else
            false
        end
    end

    ############################################################################
    # ACTIONS
    ############################################################################

    def write_resolv_conf
        if dns
            File.open(FILES[:resolv_conf], 'w') do |resolv_conf|
                if search
                    resolv_conf.puts "search #{search}"
                end

                dns.each do |nameserver|
                    resolv_conf.puts "nameserver #{nameserver}"
                end
            end
        elsif search
            File.open(FILE[:resolv_conf], 'a') do |resolv_conf|
                resolv_conf.puts "search #{search}"
            end
        end
    end

    def configure_network
        get_network_information

        if pubnet
            ip      = @pubnet[:ip]
            nic     = @pubnet[:interface]
            netmask = @pubnet[:netmask]
            gateway = @pubnet[:gateway]

            run "ip link set #{nic} up"
            run "ip addr add #{ip}/#{netmask} dev #{nic}"
            run "ip route add default via #{gateway}"
        end

        if privnet
            ip      = @privnet[:ip]
            nic     = @privnet[:interface]
            netmask = @privnet[:netmask]

            run "ip link set #{nic} up"
            run "ip addr add #{ip}/#{netmask} dev #{nic}"
        end
    end


    def configure_dnsmasq
        File.open(FILES[:dnsmasq_conf],'w') do |dnsmasq_conf|
            _,ip_start,_ = dhcp_ip_mac_pairs[0]
            _,ip_end,_   = dhcp_ip_mac_pairs[-1]

            dnsmasq_conf.puts "dhcp-range=#{ip_start},#{ip_end},infinite"
            dnsmasq_conf.puts
            dnsmasq_conf.puts "dhcp-option=42,#{@privnet[:ip]} # ntp server"
            dnsmasq_conf.puts "dhcp-option=4,#{@privnet[:ip]}  # name server"
            dnsmasq_conf.puts
            dhcp_ip_mac_pairs.each do |pair|
                mac, ip = pair
                dnsmasq_conf.puts "dhcp-host=#{mac},#{ip}"
            end
        end
    end

    def configure_nat
        nat.each do |nat_rule|
            nat_rule = nat_rule.split(":")
            if nat_rule.length == 2
                ip, inport = nat_rule
                outport    = inport
            elsif nat_rule.length == 3
                outport, ip, inport = nat_rule
            end

            run "iptables -t nat -A PREROUTING -p tcp --dport #{outport} " \
                "-j DNAT --to-destination #{ip}:#{inport}"
        end
    end

    def configure_masquerade
        run "iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE"
    end

    def configure_ip_forward
        run "sysctl -w net.ipv4.ip_forward=1"
    end

    def configure_root_password
        run "usermod -p #{root_password} root"
    end

    def configure_root_pubkey
        FileUtils.mkdir_p("/root/.ssh",:mode => 0700)
        File.open("/root/.ssh/authorized_keys", "a", 0600) do |f|
            f.write(root_pubkey)
        end
    end

    def service(service, action = :start)
        action = action.to_s
        run "/etc/rc.d/#{service} #{action}"
    end

    ############################################################################
    # Private methods
    ############################################################################

private

    def get_network_information
        @pubnet  = Hash.new
        @privnet = Hash.new

        mac_interfaces = Hash[
            Dir["/sys/class/net/*/address"].collect do |f|
                [ File.read(f).strip, f.split('/')[4] ]
            end
        ]

        if (pubnet_id = get_element_xpath(:pubnet, 'ID'))
            @pubnet[:network_id] = pubnet_id

            xpath_ip  = "TEMPLATE/NIC[NETWORK_ID='#{pubnet_id}']/IP"
            xpath_mac = "TEMPLATE/NIC[NETWORK_ID='#{pubnet_id}']/MAC"

            @pubnet[:ip]  = get_element_xpath(:template, xpath_ip)
            @pubnet[:mac] = get_element_xpath(:template, xpath_mac)

            @pubnet[:interface] = mac_interfaces[@pubnet[:mac]]

            netmask = get_element_xpath(:pubnet, 'TEMPLATE/NETWORK_MASK')
            @pubnet[:netmask] = netmask || DEFAULT_NETMASK

            gateway = get_element_xpath(:pubnet, 'TEMPLATE/GATEWAY')
            if gateway.nil?
                gateway = @pubnet[:ip].gsub(/\.\d{1,3}$/,".#{DEFAULT_GW}")
            end
            @pubnet[:gateway] = gateway
        end

        if (privnet_id = get_element_xpath(:privnet, 'ID'))
            @privnet[:network_id] = privnet_id

            xpath_ip  = "TEMPLATE/NIC[NETWORK_ID='#{privnet_id}']/IP"
            xpath_mac = "TEMPLATE/NIC[NETWORK_ID='#{privnet_id}']/MAC"

            @privnet[:ip]  = get_element_xpath(:template, xpath_ip)
            @privnet[:mac] = get_element_xpath(:template, xpath_mac)

            @privnet[:interface] = mac_interfaces[@privnet[:mac]]

            netmask = get_element_xpath(:privnet, 'TEMPLATE/NETWORK_MASK')
            @privnet[:netmask] = netmask || DEFAULT_NETMASK
        end
    end

    def log(msg)
        File.open(FILES[:log_file],'a') {|f| f.puts msg}
    end

    def run(cmd)
        log(cmd)
        output = `#{cmd} 2>&1`
        exitstatus = $?.exitstatus
        log(output) if !output.empty?
        log("Error: exit code #{exitstatus}") if exitstatus != 0
    end

    def dhcp_ip_mac_pairs
        netxml = @xml[:privnet]

        pairs = Array.new

        if netxml.elements['RANGE']
            ip_start = netxml.elements['RANGE/IP_START'].text
            ip_end   = netxml.elements['RANGE/IP_END'].text

            (ip_to_int(ip_start)..ip_to_int(ip_end)).each do |int_ip|
                ip  = int_to_ip(int_ip)
                mac = ip2mac(ip)

                pairs << [mac, ip, int_ip]
            end
        elsif netxml.elements['LEASES/LEASE']
            netxml.elements.each('LEASES/LEASE') do |lease|
                ip  = lease.elements['IP'].text
                mac = lease.elements['MAC'].text
                int_ip = ip_to_int(ip)

                pairs << [mac, ip, int_ip]
            end
        end

        pairs.sort{|a,b| a[2] <=> b[2]}
    end

    def ip_to_int(ip)
        num = 0
        ip.split(".").each{|i| num *= 256; num = num + i.to_i}
        num
    end

    def int_to_ip(num)
        ip = Array.new

        (0..3).reverse_each do |i|
            ip << (((num>>(8*i)) & 0xff))
        end
        ip.join('.')
    end

    def ip2mac(ip)
        mac = MAC_PREFIX + ':' \
                + ip.split('.').collect{|i| sprintf("%02X",i)}.join(':')

        mac.downcase
    end

    def mac2ip(mac)
        mac.split(':')[2..-1].collect{|i| i.to_i(16)}.join('.')
    end

    def unpack
        @xml = Hash.new

        BASE_64_KEYS.each do |key|
            if @context.include? key
                tpl = Base64::decode64(@context[key])
                @xml[key] = REXML::Document.new(tpl).root
            end
        end
    end

    def get_attribute(name)
        order = ATTRIBUTES[name]

        return nil if order.nil?

        order.each do |e|
            if e[:resource] != :context
                resource = e[:resource]
                xpath    = e[:resource_xpath]

                value = get_element_xpath(resource, xpath)

                return value if !value.nil?
            else
                if e[:resource_name]
                    resource_name = e[:resource_name]
                else
                    resource_name = name
                end

                element = @context[resource_name]
                return element if !element.nil?
            end
        end

        return nil
    end

    def get_element_xpath(resource, xpath)
        xml_resource = @xml[resource]
        return nil if xml_resource.nil?

        element = xml_resource.elements[xpath]
        return element.text.to_s if !element.nil?
    end

    def read_context
        context = Hash.new
        context_file = File.read(FILES[:context])

        context_file.each_line do |line|
            next if line.match(/^#/)

            if (m = line.match(/^(.*?)="(.*)"$/))
                key   = m[1].downcase.to_sym
                value = m[2]
                context[key] = value
            end
        end
        context
    end
end

router = Router.new

router.configure_network

if router.pubnet
    if router.dns || router.search
        router.write_resolv_conf
    end

    # Set masquerade
    router.configure_masquerade

    # Set ipv4 forward
    router.configure_ip_forward

    # Set NAT rules
    if router.nat
        router.configure_nat
    end
end

if router.privnet
    if router.dhcp
        router.configure_dnsmasq
        router.service("dnsmasq")
    end

    if router.ntp
        router.service("ntpd")
    end
end

if router.root_password
    router.configure_root_password
end

if router.root_pubkey
    router.configure_root_pubkey
end
