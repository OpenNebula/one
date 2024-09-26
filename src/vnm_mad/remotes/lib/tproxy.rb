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

require 'base64'
require 'erb'
require 'json'
require 'open3'
require 'resolv'

module VNMMAD

    # Module to handle transparent proxies.
    module TProxy

        # The entry point for the tproxy feature.
        def self.setup_tproxy(nic, direction)
            # Short-circuit if no tproxy config is provided.
            return if CONF[:tproxy].to_a.empty?

            endpoints = CONF[:tproxy].to_a.each_with_object([]) do |conf, a|
                # When networks are not specified add this proxy to all bridges.
                next if !(nets = conf[:networks].to_a.map(&:to_s)).empty? \
                     && (nets & nic.slice(:network, :network_id).values.map(&:to_s)).empty?

                next if conf[:service_port].nil?
                next if conf[:remote_addr].nil? || conf[:remote_addr] !~ Resolv::IPv4::Regex
                next if conf[:remote_port].nil?

                opts = {
                    :service_port => Integer(conf[:service_port] || conf[:remote_port]),
                    :remote_addr  => conf[:remote_addr],
                    :remote_port  => Integer(conf[:remote_port])
                }

                # Remove duplicated services, only the top one (lowest index) defined in the
                # :tproxy array will be used, others must be ignored.
                # This is not considered a limitation since users can define multiple arbitrary
                # services by picking different service ports. At the same time it significantly
                # simplifies tproxy implementation on HV machines.
                if !(a.find {|item| item[:service_port] == opts[:service_port] }).nil?
                    OpenNebula.log_warning "Ignoring tproxy duplicate: #{opts}"
                    next
                end

                a << opts
            rescue ArgumentError
                next
            end

            # Short-circuit if no valid config is recognized.
            return if endpoints.empty?

            if direction == :up
                enable_tproxy(nic, endpoints)
            else
                disable_tproxy(nic, endpoints)
            end

            # With empty config tproxy should voluntarily terminate,
            # that effectively makes the "stop" operation unnecessary.
            run_tproxy('start')
            run_tproxy('reload')
        end

        def self.enable_tproxy(nic, endpoints)
            brdev = nic[:bridge]

            # IFNAMSIZ = 16 causes we cannot use custom prefixes for veth devices..
            ip_link_add_veth(brdev)
            ip_link_set("dev #{brdev}b master #{brdev} up")

            ip_netns_add(brdev)
            ip_link_set_netns(brdev)

            ip_netns_exec(brdev, "ip address replace 169.254.16.9/32 dev #{brdev}a")
            ip_netns_exec(brdev, "ip link set dev #{brdev}a up")

            ip_netns_exec(brdev, "ip route replace default dev #{brdev}a")

            veth_mac = ip_netns_exec(brdev,
                                     "ip -j link show dev #{brdev}a",
                                     :expect_json => true).dig(0, 0, 'address')

            # This is required to avoid 169.254.16.9 address conflicts in case of VNETs
            # used on multiple different HV hosts are attached to multiple guest VMs.
            # Basically, we short-circuit any 169.254.16.9 communication and
            # forcefully redirect every packet destined to 169.254.16.9 to be handled
            # locally (regardless of the actual ARP resolution in guest VMs).
            nft(ERB.new(<<~NFT, :trim_mode => '-').result(binding))
                table bridge one_tproxy {
                    chain ch_<%= brdev %> {
                        type filter hook prerouting priority dstnat; policy accept;
                    }
                }

                flush chain bridge one_tproxy ch_<%= brdev %>;

                table bridge one_tproxy {
                    chain ch_<%= brdev %> {
                        meta ibrname "<%= brdev %>" \\
                        ip daddr 169.254.16.9 \\
                        meta pkttype set host ether daddr set <%= veth_mac %> \\
                        accept
                    }
                }
            NFT

            # The tproxy processes read their config from "ip one_tproxy ep_*" maps
            # defined in nftables, that way users can manually restart tproxy on demand
            # without the need for providing any command line arguments.
            # All maps are managed by the driver, proxies only read their contents.
            nft(ERB.new(<<~NFT, :trim_mode => '-').result(binding))
                table ip one_tproxy {
                    map ep_<%= brdev %> {
                        type inet_service : ipv4_addr \\
                                          . inet_service;
                    }
                }

                flush map ip one_tproxy ep_<%= brdev %>;

                <%- endpoints.each do |ep| -%>
                add element ip one_tproxy ep_<%= brdev %> {
                    <%= ep[:service_port] %> : <%= ep[:remote_addr] %> \\
                                             . <%= ep[:remote_port] %>
                }
                <%- end -%>
            NFT
        end

        def self.disable_tproxy(nic, endpoints)
            brdev = nic[:bridge]

            nft(ERB.new(<<~NFT, :trim_mode => '-').result(binding))
                table ip one_tproxy {
                    map ep_<%= brdev %> {
                        type inet_service : ipv4_addr \\
                                          . inet_service;
                    }
                }

                delete map ip one_tproxy ep_<%= brdev %>;
            NFT

            nft(ERB.new(<<~NFT, :trim_mode => '-').result(binding))
                table bridge one_tproxy {
                    chain ch_<%= brdev %> {
                        type filter hook prerouting priority dstnat; policy accept;
                    }
                }

                delete chain bridge one_tproxy ch_<%= brdev %>;
            NFT

            ip_link_delete_veth(brdev)

            ip_netns_delete(brdev)
        end

        def self.ip_link_add_veth(brdev)
            o, e, s = run(:ip, 'link', 'show', "#{brdev}b", :term => false)
            if s.success?
                [o, e, s]
            else
                run(:ip, 'link', 'add', "#{brdev}b", 'type', 'veth', 'peer', 'name', "#{brdev}a")
            end
        end

        def self.ip_link_delete_veth(brdev)
            o, e, s = run(:ip, 'link', 'show', "#{brdev}b", :term => false)
            if s.success?
                run(:ip, 'link', 'delete', "#{brdev}b")
            else
                [o, e, s]
            end
        end

        def self.ip_link_set(cmd)
            run(:ip, 'link', 'set', *cmd.strip.split(' '))
        end

        def self.ip_link_set_netns(brdev)
            o, e, s = run(:ip, 'link', 'show', "#{brdev}a", :term => false)
            if s.success?
                run(:ip, 'link', 'set', "#{brdev}a", 'netns', "one_tproxy_#{brdev}")
            else
                [o, e, s]
            end
        end

        def self.ip_netns_add(brdev)
            o, e, s = run(:ip, 'netns', 'pids', "one_tproxy_#{brdev}", :term => false)
            if s.success?
                [o, e, s]
            else
                run(:ip, 'netns', 'add', "one_tproxy_#{brdev}")
            end
        end

        def self.ip_netns_delete(brdev)
            o, e, s = run(:ip, 'netns', 'pids', "one_tproxy_#{brdev}", :term => false)
            if s.success?
                run(:ip, 'netns', 'delete', "one_tproxy_#{brdev}")
            else
                [o, e, s]
            end
        end

        def self.ip_netns_exec(brdev, cmd, expect_json: false)
            env = { 'NETNS' => "one_tproxy_#{brdev}" }
            o, e, s = run(:ip_netns_exec, env, *cmd.strip.split(' '))
            if expect_json
                if s.success?
                    [JSON.parse(o), e, s]
                else
                    [{}, e, s]
                end
            else
                [o, e, s]
            end
        end

        def self.nft(script, **opts)
            run(:nft, '-f-', **opts, :stdin_data => script)
        end

        def self.run_tproxy(cmd)
            run(:tproxy, *cmd.strip.split(' '))
        end

        private_class_method def self.run(sym, *args, **opts)
            VNMNetwork::Command.no_shell(sym, *args, **opts)
        end

    end

end
