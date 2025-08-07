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

require 'base64'
require 'erb'
require 'json'
require 'open3'
require 'resolv'
require 'DriverLogger'

module VNMMAD

    # Module to handle transparent proxies.
    module TProxy

        LOCK_FILE = '/tmp/onevnm-tproxy-lock'

        # Return the hypervisor facing veth device
        def self.veth(nic)
            return "#{nic[:bridge]}b"
        end

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
                if a.find {|item| item[:service_port] == opts[:service_port] }
                    OpenNebula::DriverLogger.log_warning "Ignoring tproxy duplicate: #{opts}"
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

            # Prevent ARP requests from being propagated to other HV machines.
            # It reduces network traffic and ensures that the closest HV handles
            # proxied packets.
            nft(ERB.new(<<~NFT).result(binding))
                table bridge one_tproxy {
                    chain ch_<%= brdev %> {
                        type filter hook forward priority filter; policy accept;
                    };
                };
                flush chain bridge one_tproxy ch_<%= brdev %>;
                table bridge one_tproxy {
                    chain ch_<%= brdev %> {
                        meta ibrname "<%= brdev %>" \
                        oifname != "<%= brdev %>b" \
                        arp operation request \
                        arp daddr ip 169.254.16.9 \
                        drop;
                    };
                };
            NFT

            # The tproxy processes read their config from "ip one_tproxy ep_*" maps
            # defined in nftables, that way users can manually restart tproxy on demand
            # without the need for providing any command line arguments.
            # All maps are managed by the driver, proxies only read their contents.
            nft(ERB.new(<<~NFT).result(binding))
                table ip one_tproxy {
                    map ep_<%= brdev %> {
                        type inet_service : ipv4_addr . inet_service;
                    };
                };
                flush map ip one_tproxy ep_<%= brdev %>;
                <% endpoints.each do |ep| %>
                add element ip one_tproxy ep_<%= brdev %> \
                {<%= ep[:service_port] %> : <%= ep[:remote_addr] %> . <%= ep[:remote_port] %>};
                <% end %>
            NFT
        end

        def self.disable_tproxy(nic, endpoints)
            brdev = nic[:bridge]

            nft(ERB.new(<<~NFT).result(binding))
                table ip one_tproxy {
                    map ep_<%= brdev %> {
                        type inet_service : ipv4_addr . inet_service;
                    };
                };
                delete map ip one_tproxy ep_<%= brdev %>;
            NFT

            nft(ERB.new(<<~NFT).result(binding))
                table bridge one_tproxy {
                    chain ch_<%= brdev %> {
                        type filter hook forward priority filter; policy accept;
                    };
                };
                delete chain bridge one_tproxy ch_<%= brdev %>;
            NFT

            ip_link_delete_veth(brdev)

            ip_netns_delete(brdev)
        end

        def self.ip_link_add_veth(brdev)
            lockfd = File.open(LOCK_FILE, 'w')
            lockfd.flock(File::LOCK_EX)

            o, e, s = run(:ip, 'link', 'show', "#{brdev}b", :term => false)
            if s.success?
                [o, e, s]
            else
                run(:ip, 'link', 'add', "#{brdev}b", 'type', 'veth', 'peer', 'name', "#{brdev}a")
            end
        ensure
            lockfd.close
        end

        def self.ip_link_delete_veth(brdev)
            lockfd = File.open(LOCK_FILE, 'w')
            lockfd.flock(File::LOCK_EX)

            o, e, s = run(:ip, 'link', 'show', "#{brdev}b", :term => false)
            if s.success?
                run(:ip, 'link', 'delete', "#{brdev}b")
            else
                [o, e, s]
            end
        ensure
            lockfd.close
        end

        def self.ip_link_set(cmd)
            run(:ip, 'link', 'set', *cmd.strip.split(' '))
        end

        def self.ip_link_set_netns(brdev)
            lockfd = File.open(LOCK_FILE, 'w')
            lockfd.flock(File::LOCK_EX)

            o, e, s = run(:ip, 'link', 'show', "#{brdev}a", :term => false)
            if s.success?
                run(:ip, 'link', 'set', "#{brdev}a", 'netns', "one_tproxy_#{brdev}")
            else
                [o, e, s]
            end
        ensure
            lockfd.close
        end

        def self.ip_netns_add(brdev)
            lockfd = File.open(LOCK_FILE, 'w')
            lockfd.flock(File::LOCK_EX)

            o, e, s = run(:ip, 'netns', 'pids', "one_tproxy_#{brdev}", :term => false)
            if s.success?
                [o, e, s]
            else
                run(:ip, 'netns', 'add', "one_tproxy_#{brdev}")
            end
        ensure
            lockfd.close
        end

        def self.ip_netns_delete(brdev)
            lockfd = File.open(LOCK_FILE, 'w')
            lockfd.flock(File::LOCK_EX)

            o, e, s = run(:ip, 'netns', 'pids', "one_tproxy_#{brdev}", :term => false)
            if s.success?
                run(:ip, 'netns', 'delete', "one_tproxy_#{brdev}")
            else
                [o, e, s]
            end
        ensure
            lockfd.close
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
            # Normalize nft scripts to avoid potential segfaults..
            pass1 = script.lines.each_with_object([]) do |line, a|
                line.sub!(/\\\n$/, ' ') # undo explicit line breaks

                a << line
            end.join
            pass2 = pass1.lines.each_with_object([]) do |line, a|
                next if line =~ /^\s*$/ # ignore empty lines

                line.gsub!(/([^ ])[ ]+/, '\1 ') # remove redundant spaces

                a << line
            end.join
            run(:nft, '-f-', **opts, :stdin_data => pass2)
        end

        def self.run_tproxy(cmd)
            run(:tproxy, *cmd.strip.split(' '))
        end

        private_class_method def self.run(sym, *args, **opts)
            VNMNetwork::Command.no_shell(sym, *args, **opts)
        end

    end

end
