#!/usr/bin/env ruby

require 'rexml/document'
require 'base64'

class Router
    # Default files
    FILES = {
        :resolv_conf   => "/etc/resolv.conf",
        :context       => "/mnt/context/context.sh",
        :dnsmasq_conf  => "/etc/dnsmasq.conf"
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
        :gateway => [
            {
                :resource => :context
            },
            {
                :resource       => :pubnet,
                :resource_xpath => 'TEMPLATE/GATEWAY'
            }
        ],
        :netmask_pub => [
            {
                :resource => :context
            },
            {
                :resource       => :pubnet,
                :resource_xpath => 'TEMPLATE/NETWORK_MASK'
            }
        ],
        :netmask_priv => [
            {
                :resource => :context
            },
            {
                :resource       => :privnet,
                :resource_xpath => 'TEMPLATE/NETWORK_MASK'
            }
        ],
        :nat => [
            {
                :resource => :context
            },
            {
                :resource       => :pubnet,
                :resource_xpath => 'TEMPLATE/NAT'
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
        ]
    }

    def initialize
        @context = read_context
        unpack
    end

    ############################################################################
    # GETTERS
    ############################################################################

    def dns
        dns_raw = get_attribute(:dns)
        dns_raw.split if !dns_raw.nil?
    end

    def gateway
        get_attribute(:gateway)
    end

    def search
        get_attribute(:search)
    end

    def netmask(nic)
        if nic == "eth0"
            resource = :netmask_pub
        elsif nic == "eth1"
            resource = :netmask_priv
        end

        get_attribute(resource) || DEFAULT_NETMASK
    end

    def nat
        nat_raw = get_attribute(:nat)
        nat_raw.split if !nat_raw.nil?
    end

    def dhcp
        dhcp_raw = get_attribute(:dhcp)
        if dhcp_raw.downcase.match(/^y(es)?$/)
            true
        else
            false
        end
    end

    def mac_ip(nic)
        mac = File.read("/sys/class/net/#{nic}/address")
        ip  = mac2ip(mac)

        [mac, ip]
    end

    ############################################################################
    # ACTIONS
    ############################################################################

    def write_resolv_conf
        if dns
            File.open(FILE[:resolv_conf], 'w') do |resolv_conf|
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

    def set_network(nic)
        mac, ip      = mac_ip(nic)
        network_mask = netmask(nic)

        run "ip link set #{nic} up"
        run "ip addr add #{ip}/#{network_mask} dev #{nic}"

        if nic == "eth0"
            if gateway
                gw = gateway
            else
                gw = ip.gsub(/\.\d{1,3}$/,".#{DEFAULT_GW}")
            end

            run "ip route add default via #{gw}"
        end
    end

    def generate_dnsmasq_conf
        File.open(FILES[:dnsmasq_conf],'w') do |dnsmasq_conf|
            _,ip_start,_ = dhcp_ip_mac_pairs[0]
            _,ip_end,_   = dhcp_ip_mac_pairs[-1]

            mac, ip = mac_ip("eth1")

            dnsmasq_conf.puts "dhcp-range=#{ip_start},#{ip_end},infinite"

            dnsmasq_conf.puts "dhcp-option=42,#{ip} # ntp server"
            dnsmasq_conf.puts "dhcp-option=4,#{ip}  # name server"

            dhcp_ip_mac_pairs.each do |pair|
                mac, ip = pair
                dnsmasq_conf.puts "dhcp-host=#{mac},#{ip}"
            end
        end
    end

    def enable_dhcp
        start_service "dnsmasq"
    end

    def set_nat_rules
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

    def set_masquerade
        run "iptables -A POSTROUTING -o eth0 -j MASQUERADE"
    end

    ############################################################################
    # Private methods
    ############################################################################

private

    def start_service(service)
        run "/etc/rc.d/#{service} start"
    end

    def run(cmd)
        puts(cmd)
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

        order.each do |e|
            if e[:resource] != :context
                resource = e[:resource]
                xpath    = e[:resource_xpath]

                element = @xml[resource].elements[xpath]
                return element.text.to_s if !element.nil?
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

if router.dns || router.search
    router.write_resolv_conf
end

# Public Network
router.set_network("eth0")

# Private Network
router.set_network("eth1")

# Generate DHCP
if router.dhcp
    router.generate_dnsmasq_conf
    router.enable_dhcp
end

# # Set masquerade
router.set_masquerade

# # Set NAT rules
if router.nat
    router.set_nat_rules
end
