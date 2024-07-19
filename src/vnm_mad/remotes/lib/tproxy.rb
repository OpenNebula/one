# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'base64'
require 'erb'
require 'json'
require 'open3'
require 'resolv'

module VNMMAD

    # Module to handle transparent proxies.
    module TProxy

        # A helper class to manage the tproxy mapping in nftables.
        class ProxyMap

            def initialize(port_range = (16_000...32_000))
                @range = port_range
                reload
            end

            def reload
                @map   = self.class.load_proxy_map
                @ports = self.class.load_proxy_ports(@map)
            end

            def get_port(bridge, service_addr, service_port)
                if (v = @map[[bridge, service_addr, service_port]]).nil?
                    next_port
                else
                    v[0]
                end
            end

            # Delete all map entries that do not match current config (for a specific bridge).
            # This is a best-effort type of operation.
            def cleanup(bridge, keep: @ports)
                to_delete = @map.each_with_object({}) do |(k, v), acc|
                    acc[k] = v if k[0] == bridge && !keep.include?(v[0])
                end

                TProxy.nft(ERB.new(<<~NFT, :trim_mode => '-').result(binding), :term => false)
                    <%- to_delete.each do |k, v| -%>
                    delete element ip one_tproxy proxies { "<%= k[0] %>" . <%= k[1..(-1)].join(' . ') %> }
                    <%- end -%>
                NFT
            end

            def self.load_proxy_map
                TProxy.nft_json('list map ip one_tproxy proxies', :term => false)
                      .dig(0, 'nftables')
                      &.find {|item| !item['map'].nil? }
                      &.dig('map', 'elem')
                      .to_h {|item| item.map(&:values).map(&:flatten) }
            end

            def self.load_proxy_ports(proxy_map = get_proxy_map)
                proxy_map.map {|_, v| v[0] }
            end

            private

            def next_port
                # This is not the most efficient implementation, but we can safely assume
                # it is likely the number of proxy ports openned should be low.
                if (v = @range.find {|port| !@ports.include?(port) }).nil?
                    nil
                else
                    @ports << v
                    v
                end
            end

        end

        # The entry point for the tproxy feature.
        def self.setup_tproxy(nic, direction)
            # Short-circuit if no tproxy config is provided.
            return if CONF[:tproxy].to_a.empty?

            begin
                nonce = Integer(nic[:network_id]) % 16_000
            rescue ArgumentError
                return
            end

            proxy_map = ProxyMap.new

            proxy_opts = CONF[:tproxy].to_a.each_with_object([]) do |conf, acc|
                next if !conf[:network_id].nil? \
                    && Integer(conf[:network_id]) != Integer(nic[:network_id])

                next if !conf[:network].nil? \
                    && conf[:network] != nic[:network]

                next if conf[:remote_addr].nil? || conf[:remote_port].nil?

                opts = {
                    # Multiple proxies in the same VNET can reuse the same routing tables and rules.
                    :rt_in    => 16_000 + nonce,
                    :mark_in  => 16_000 + nonce,
                    :rt_out   => 32_000 + nonce,
                    :mark_out => 32_000 + nonce,

                    :service_addr => conf[:service_addr] || '169.254.16.9',
                    :service_port => Integer(conf[:service_port] || conf[:remote_port]),

                    :remote_addr => conf[:remote_addr],
                    :remote_port => Integer(conf[:remote_port])
                }

                next unless opts[:service_addr] =~ Resolv::IPv4::Regex

                next unless opts[:remote_addr] =~ Resolv::IPv4::Regex

                opts[:proxy_port] = proxy_map.get_port(nic[:bridge],
                                                       opts[:service_addr],
                                                       opts[:service_port])

                acc << opts
            rescue ArgumentError
                next
            end

            # Short-circuit if no valid config is recognized.
            return if proxy_opts.empty?

            if direction == :up
                proxy_map.cleanup(nic[:bridge],
                                  :keep => proxy_opts.map {|opts| opts[:proxy_port] })

                enable_tproxy(nic, proxy_opts)

                run_tproxy('start')
                run_tproxy('reload')
            else
                run_tproxy('stop')

                disable_tproxy(nic, proxy_opts)

                proxy_map.cleanup(nic[:bridge], :keep => []) # delete all
            end
        end

        def self.enable_tproxy(nic, proxy_opts)
            br = nic[:bridge]

            # Get the MAC of the bridge to later use it in NFT rules.
            mac = ip_json(<<~LINK).dig(0, 0, 'address')
                link show dev #{br}
            LINK

            return if mac.nil?

            # Completely disable reverse path filtering for the bridge at hand. This is required
            # for both proxy-arp to work and routing the response packets back to VM guests.
            sysctl(<<~SYSCTL)
                net.ipv4.conf.all.rp_filter=0
            SYSCTL
            sysctl(<<~SYSCTL)
                net.ipv4.conf.#{br}.rp_filter=0
            SYSCTL

            proxy_opts.each do |opts|
                # Enable proxy-arp.
                ip_neighbour_add_proxy(<<~NEIGHBOUR)
                    #{opts[:service_addr]} dev #{br}
                NEIGHBOUR

                # This is required for proxy-arp to work.
                ip_route_replace(<<~ROUTE)
                    #{opts[:service_addr]} dev lo
                ROUTE

                ip_rule_add(<<~RULE)
                    fwmark #{opts[:mark_in]} lookup #{opts[:rt_in]}
                RULE

                ip_route_replace(<<~ROUTE)
                    local default dev lo table #{opts[:rt_in]}
                ROUTE

                ip_rule_add(<<~RULE)
                    fwmark #{opts[:mark_out]} lookup #{opts[:rt_out]}
                RULE

                # Inject response packets (marked with :mark_out) back into the bridge.
                ip_route_replace(<<~ROUTE)
                    default dev #{br} table #{opts[:rt_out]}
                ROUTE
            end

            # This nftables config can be considered to be a failsafe. In case where proxy-arp
            # does not work for any reason, users can still manually set permanent ARP mapping
            # `arp -s 169.254.16.9 00:00:00:00:00:00` inside VM guests. Setting the mapping avoids
            # ARP resolution, then nftables overrides / corrects the destination MAC address.
            nft(ERB.new(<<~NFT, :trim_mode => '-').result(binding))
                table bridge one_tproxy {
                    chain #{br} {
                        type filter hook prerouting priority dstnat; policy accept;
                    }
                }

                flush chain bridge one_tproxy #{br}

                table bridge one_tproxy {
                    chain #{br} {
                <%- proxy_opts.each do |opts| -%>
                        meta ibrname "#{br}" \\
                        ip daddr <%= opts[:service_addr] %> \\
                        tcp dport <%= opts[:service_port] %> \\
                        counter \\
                        meta pkttype set host ether daddr set #{mac} \\
                        accept
                <%- end -%>
                    }
                }
            NFT

            # The tproxy.rb process reads its config from the "ip one_tproxy proxies" map
            # defined in nftables, that way users can manually restart the proxy on demand
            # without the need of providing any command line arguments. The map is managed
            # by the driver, proxy only reads its contents.
            nft(ERB.new(<<~NFT, :trim_mode => '-').result(binding))
                table ip one_tproxy {
                    map proxies {
                        type ifname . ipv4_addr . inet_service : inet_service . ipv4_addr . inet_service . mark;
                        elements = {
                <%- proxy_opts.each do |opts| -%>
                            "#{br}" . <%= opts[:service_addr] %> . <%= opts[:service_port] %> \\
                            : <%= opts[:proxy_port] %> . <%= opts[:remote_addr] %> . <%= opts[:remote_port] %> . <%= opts[:mark_out] %>,
                <%- end -%>
                        }
                    }
                    chain #{br} {
                        type filter hook prerouting priority mangle; policy accept;
                    }
                }

                flush chain ip one_tproxy #{br}

                table ip one_tproxy {
                    chain #{br} {
                <%- proxy_opts.each do |opts| -%>
                        iifname "#{br}" \\
                        meta l4proto tcp \\
                        ip daddr <%= opts[:service_addr] %> \\
                        tcp dport <%= opts[:service_port] %> \\
                        counter \\
                        mark set <%= opts[:mark_in] %> \\
                        tproxy to 127.0.0.1:<%= opts[:proxy_port] %>
                <%- end -%>
                    }
                }
            NFT
        end

        def self.disable_tproxy(nic, proxy_opts)
            br = nic[:bridge]

            proxy_opts.each do |opts|
                ip_rule_del(<<~RULE)
                    fwmark #{opts[:mark_in]} lookup #{opts[:rt_in]}
                RULE

                ip_rule_del(<<~RULE)
                    fwmark #{opts[:mark_out]} lookup #{opts[:rt_out]}
                RULE
            end

            nft(<<~NFT)
                table bridge one_tproxy {
                    chain #{br} {
                        type filter hook prerouting priority dstnat; policy accept;
                    }
                }

                flush chain bridge one_tproxy #{br}
            NFT

            nft(<<~NFT)
                table ip one_tproxy {
                    chain #{br} {
                        type filter hook prerouting priority mangle; policy accept;
                    }
                }

                flush chain ip one_tproxy #{br}
            NFT
        end

        def self.run_tproxy(cmd)
            run(:tproxy, *cmd.strip.split(' '))
        end

        def self.ip_json(cmd, **opts)
            o, e, s = run(:ip_unpriv, '-j', *cmd.strip.split(' '), **opts)
            if s.success?
                [JSON.parse(o), e, s]
            else
                [{}, e, s]
            end
        end

        def self.ip_neighbour_add_proxy(cmd)
            run(:ip, 'neighbour', 'add', 'proxy', *cmd.strip.split(' '))
        end

        def self.ip_rule_add(cmd)
            args = cmd.strip.split(' ')
            if (check = run(:ip, 'rule', 'list', *args))[0].strip.empty?
                run(:ip, 'rule', 'add', *args)
            else
                check
            end
        end

        def self.ip_rule_del(cmd)
            args = cmd.strip.split(' ')
            if (check = run(:ip, 'rule', 'list', *args))[0].strip.empty?
                check
            else
                run(:ip, 'rule', 'del', *args)
            end
        end

        def self.ip_route_replace(cmd)
            run(:ip, 'route', 'replace', *cmd.strip.split(' '))
        end

        def self.nft_json(cmd, **opts)
            o, e, s = run(:nft, '-j', *cmd.strip.split(' '), **opts)
            if s.success?
                [JSON.parse(o), e, s]
            else
                [{}, e, s]
            end
        end

        def self.nft(script, **opts)
            run(:nft, '-f-', **opts, :stdin_data => script)
        end

        def self.sysctl(cmd)
            run(:sysctl, *cmd.strip.split(' '))
        end

        private_class_method def self.run(sym, *args, **opts)
            VNMNetwork::Command.no_shell(sym, *args, **opts)
        end

    end

end
