#!/usr/bin/env ruby

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

require 'rexml/document'
require 'base64'
require 'fileutils'
require 'erb'

class Router
    # Default files

    FILES = {
        :resolv_conf     => "/etc/resolv.conf",
        :context         => "/mnt/context/context.sh",
        :dnsmasq_conf    => "/etc/dnsmasq.conf",
        :radvd_conf      => "/etc/radvd.conf",
        :log_file        => "/var/log/router.log",
        :authorized_keys => "/root/.ssh/authorized_keys"
    }

    # Default MAC prefix
    MAC_PREFIX = "02:00"

    # Default gateway (last byte)
    DEFAULT_GW = "1"

    # Default netmask
    DEFAULT_NETMASK = "255.255.255.0"

    # Context parameters that are base64 encoded
    BASE_64_KEYS = [:privnet, :pubnet, :template, :root_password]

    # Context parameters that are XML documents
    XML_KEYS = [:privnet, :pubnet, :template]

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
                :resource_name => :forwarding
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
        :radvd => [
            {
                :resource => :context
            },
            {
                :resource       => :privnet,
                :resource_xpath => 'TEMPLATE/RADVD'
            }
        ],
        :ntp_server => [
            {
                :resource => :context
            },
            {
                :resource       => :privnet,
                :resource_xpath => 'TEMPLATE/NTP_SERVER'
            }
        ],
        :ssh_public_key => [
            {
                :resource => :context
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
        mount_context

        if (@context = read_context)
            unpack
            get_network_information
        end
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
        get_attribute(:ssh_public_key) || get_attribute(:root_pubkey)
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

    def ntp_server
        get_attribute(:ntp_server)
    end

    def radvd
        radvd_raw = get_attribute(:radvd) || ""
        radvd = !!radvd_raw.downcase.match(/^y(es)?$/)
        radvd and @privnet[:ipv6]
    end

    ############################################################################
    # ACTIONS
    ############################################################################

    def mount_context
        log("mounting context")
        FileUtils.mkdir_p("/mnt/context")
        run "mount -t iso9660 /dev/cdrom /mnt/context 2>/dev/null"
    end

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
            File.open(FILES[:resolv_conf], 'a') do |resolv_conf|
                resolv_conf.puts "search #{search}"
            end
        end
    end

    def configure_network
        if pubnet
            ip         = @pubnet[:ip]
            ip6_global = @pubnet[:ip6_global]
            ip6_site   = @pubnet[:ip6_site]
            nic        = @pubnet[:interface]
            netmask    = @pubnet[:netmask]
            gateway    = @pubnet[:gateway]

            run "ip link set #{nic} up"

            run "ip addr add #{ip}/#{netmask} dev #{nic}"
            run "ip addr add #{ip6_global} dev #{nic}" if ip6_global
            run "ip addr add #{ip6_site}   dev #{nic}" if ip6_site

            run "ip route add default via #{gateway}"
        end

        if privnet
            ip         = @privnet[:ip]
            ip6_global = @privnet[:ip6_global]
            ip6_site   = @privnet[:ip6_site]
            nic        = @privnet[:interface]
            netmask    = @privnet[:netmask]

            run "ip link set #{nic} up"
            run "ip addr add #{ip}/#{netmask} dev #{nic}"
            run "ip addr add #{ip6_global} dev #{nic}" if ip6_global
            run "ip addr add #{ip6_site}   dev #{nic}" if ip6_site
        end
    end

    def configure_dnsmasq
        File.open(FILES[:dnsmasq_conf],'w') do |conf|
            dhcp_ip_mac_pairs.collect do |ar|
                conf.puts "dhcp-range=#{ar[:ip_start]},#{ar[:ip_end]},infinite"
            end

            conf.puts "dhcp-option=42,#{ntp_server} # ntp server" if ntp_server
            conf.puts "dhcp-option=4,#{@privnet[:ip]} # name server"

            dhcp_ip_mac_pairs.each do |ar|
                ar[:mac_ip_pairs].each do |mac,ip,_|
                    conf.puts "dhcp-host=#{mac},#{ip}"
                end
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

    def configure_radvd
        prefixes = [@privnet[:ip6_global],@privnet[:ip6_site]].compact
        privnet_iface = @privnet[:interface]

        radvd_conf_tpl =<<-EOF.gsub(/^\s{12}/,"")
            interface <%= privnet_iface %>
            {
                AdvSendAdvert on;
                <% prefixes.each do |p| %>
                prefix <%= p %>/64
                {
                    AdvOnLink on;
                };
                <% end %>
            };
        EOF

        radvd_conf = ERB.new(radvd_conf_tpl).result(binding)
        File.open(FILES[:radvd_conf],'w') {|c| c.puts radvd_conf }
    end

    def configure_masquerade
        run "iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE"
    end

    def configure_ip_forward
        run "sysctl -w net.ipv4.ip_forward=1"
    end

    def configure_root_password
        run "echo -n 'root:#{root_password}'|chpasswd -e"
    end

    def configure_root_pubkey
        FileUtils.mkdir_p(File.dirname(FILES[:authorized_keys]),:mode => 0700)
        File.open(FILES[:authorized_keys], "a", 0600) do |f|
            f.write(root_pubkey)
        end
    end

    def service(service, action = :start)
        action = action.to_s
        run "/etc/init.d/#{service} #{action}"
    end

    def log(msg, command = false)
        msg = "=> #{msg}" unless command
        File.open(FILES[:log_file],'a') {|f| f.puts msg}
    end

    def has_context?
        !!@context
    end

    ############################################################################
    # Private methods
    ############################################################################

private

    def get_network_information
        @pubnet  = Hash.new
        @privnet = Hash.new

        @mac_interfaces = Hash[
            Dir["/sys/class/net/*/address"].collect do |f|
                [ File.read(f).strip, f.split('/')[4] ]
            end
        ]

        if (pubnet_id = get_element_xpath(:pubnet, 'ID'))
            @pubnet[:network_id] = pubnet_id

            xpath_ip         = "TEMPLATE/NIC[NETWORK_ID='#{pubnet_id}']/IP"
            xpath_ip6_global = "TEMPLATE/NIC[NETWORK_ID='#{pubnet_id}']/IP6_GLOBAL"
            xpath_ip6_site   = "TEMPLATE/NIC[NETWORK_ID='#{pubnet_id}']/IP6_ULA"
            xpath_mac        = "TEMPLATE/NIC[NETWORK_ID='#{pubnet_id}']/MAC"

            @pubnet[:ip]         = get_element_xpath(:template, xpath_ip)
            @pubnet[:ip6_global] = get_element_xpath(:template, xpath_ip6_global)
            @pubnet[:ip6_site]   = get_element_xpath(:template, xpath_ip6_site)
            @pubnet[:mac]        = get_element_xpath(:template, xpath_mac)

            @pubnet[:ipv6] = true if @pubnet[:ip6_global] or @pubnet[:ip6_site]

            @pubnet[:interface] = @mac_interfaces[@pubnet[:mac]]

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

            xpath_ip         = "TEMPLATE/NIC[NETWORK_ID='#{privnet_id}']/IP"
            xpath_ip6_global = "TEMPLATE/NIC[NETWORK_ID='#{privnet_id}']/IP6_GLOBAL"
            xpath_ip6_site   = "TEMPLATE/NIC[NETWORK_ID='#{privnet_id}']/IP6_ULA"
            xpath_mac        = "TEMPLATE/NIC[NETWORK_ID='#{privnet_id}']/MAC"

            @privnet[:ip]         = get_element_xpath(:template, xpath_ip)
            @privnet[:ip6_global] = get_element_xpath(:template, xpath_ip6_global)
            @privnet[:ip6_site]   = get_element_xpath(:template, xpath_ip6_site)
            @privnet[:mac]        = get_element_xpath(:template, xpath_mac)

            @privnet[:ipv6] = true if @privnet[:ip6_global] or @privnet[:ip6_site]

            @privnet[:interface] = @mac_interfaces[@privnet[:mac]]

            netmask = get_element_xpath(:privnet, 'TEMPLATE/NETWORK_MASK')
            @privnet[:netmask] = netmask || DEFAULT_NETMASK
        end
    end

    def run(cmd)
        log(cmd, true)
        output = `#{cmd} 2>&1`
        exitstatus = $?.exitstatus
        log(output) if !output.empty?
        log("ERROR: exit code #{exitstatus}") if exitstatus != 0
    end

    def dhcp_ip_mac_pairs
        netxml = @xml[:privnet]

        pairs = Array.new

        netxml.elements.each('AR_POOL/AR') do |ar|
            mac_ip_pairs = Array.new

            ip_start = ar.elements['IP'].text
            size     = ar.elements['SIZE'].text.to_i

            ip_start_int = ip_to_int(ip_start)
            ip_end_int   = ip_start_int + size

            ip_end = int_to_ip(ip_end_int)

            (ip_start_int..ip_end_int).each do |int_ip|
                ip  = int_to_ip(int_ip)
                mac = ip2mac(ip)

                # skip this IP if it's already taken
                next if ar.elements["LEASES/LEASE[IP='#{ip}']"]

                mac_ip_pairs << [mac, ip]
            end

            pairs << {
                :ip_start     => ip_start,
                :ip_end       => ip_end,
                :size         => size,
                :mac_ip_pairs => mac_ip_pairs
            }
        end

        pairs
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
                @context[key] = Base64::decode64(@context[key])
            end
        end

        XML_KEYS.each do |key|
            if @context.include? key
                @xml[key] = REXML::Document.new(@context[key]).root
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
        return nil if !File.exist?(FILES[:context])

        context = Hash.new
        context_file = File.read(FILES[:context])

        context_file.each_line do |line|
            next if line.match(/^#/)

            if (m = line.match(/^(.*?)='(.*)'$/))
                key   = m[1].downcase.to_sym
                value = m[2]
                context[key] = value
            end
        end
        context
    end
end

router = Router.new

if !router.has_context?
    router.log("ERROR: Context not found. Stopping.")
    exit 1
end

router.log("configure network")
router.configure_network

if router.pubnet
    if router.dns || router.search
        router.log("write resolv.conf")
        router.write_resolv_conf
    end

    # Set masquerade
    router.log("set masquerade")
    router.configure_masquerade

    # Set ipv4 forward
    router.log("ip forward")
    router.configure_ip_forward

    # Set NAT rules
    if router.nat
        router.log("configure nat")
        router.configure_nat
    end
end

if router.privnet and router.dhcp
    router.log("configure dnsmasq")
    router.configure_dnsmasq
    router.service("dnsmasq")
end

if router.radvd
    router.log("configure radvd")
    router.configure_radvd
    router.service("radvd")
end

if router.root_password
    router.log("configure root password")
    router.configure_root_password
end

if router.root_pubkey
    router.log("configure root pubkey")
    router.configure_root_pubkey
end
