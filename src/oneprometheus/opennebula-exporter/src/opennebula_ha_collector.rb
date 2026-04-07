# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require 'socket'
require 'timeout'
require 'xmlrpc/client'
require 'rexml/document'
require 'opennebula'

# Metrics exposed:
# - opennebula_ha_is_leader{one_server_fqdn="..."} 0|1
# - opennebula_ha_error_members{one_server_fqdn="..."} N
# - opennebula_ha_members{one_server_fqdn="..."} N
class OpenNebulaHACollector

    LABELS = [:one_server_fqdn].freeze

    STATE_FOLLOWER = 2
    STATE_LEADER   = 3

    METRICS = {
        'ha_is_leader' => {
            :type => :gauge,
          :docstr => 'This server is RAFT leader (1) or not (0)',
          :labels => LABELS
        },
      'ha_error_members' => {
          :type => :gauge,
        :docstr => 'Number of HA members with failed or unexpected RAFT state',
        :labels => LABELS
      },
      'ha_members' => {
          :type => :gauge,
        :docstr => 'Total number of HA members reported by zone pool',
        :labels => LABELS
      }
    }.freeze

    def initialize(registry, _client, namespace)
        @metrics = build_metrics(registry, namespace)
        @auth = load_auth
        @xmlrpc_endpoint = load_xmlrpc_endpoint
        @timeout = load_timeout
        @fqdn = resolve_fqdn
        @one_client = build_one_client
    end

    def collect
        labels = metric_labels
        statuses = cluster_statuses
        return if statuses.empty?

        write_metrics(statuses, labels)
    rescue StandardError => e
        warn("[OpenNebulaHACollector] #{e.class}: #{e.message}")
        nil
    end

    private

    def build_metrics(registry, namespace)
        metrics = {}

        METRICS.each do |name, conf|
            metrics[name] = registry.public_send(
                conf[:type],
                "#{namespace}_#{name}".to_sym,
                :docstring => conf[:docstr],
                :labels => conf[:labels]
            )
        end

        metrics
    end

    def load_auth
        path = ENV.fetch('ONE_AUTH', File.expand_path('~/.one/one_auth'))
        File.read(path).strip
    end

    def load_xmlrpc_endpoint
        ENV.fetch('ONE_XMLRPC', 'http://localhost:2633/RPC2')
    end

    def load_timeout
        (ENV['ONEZONE_TIMEOUT'] || '5').to_i
    end

    def build_one_client
        OpenNebula::Client.new(@auth, @xmlrpc_endpoint)
    end

    def metric_labels
        { :one_server_fqdn => @fqdn }
    end

    def cluster_statuses
        servers = fetch_zone_servers
        return [] if servers.empty?

        servers.map {|srv| fetch_server_status(srv) }
    end

    def write_metrics(statuses, labels)
        @metrics['ha_members'].set(member_count(statuses), :labels => labels)
        @metrics['ha_error_members'].set(error_member_count(statuses), :labels => labels)
        @metrics['ha_is_leader'].set(local_leader_value, :labels => labels)
    end

    def member_count(statuses)
        statuses.size
    end

    def error_member_count(statuses)
        statuses.count {|status| problem_state?(status) }
    end

    def local_leader_value
        local_status = fetch_local_status
        local_status[:state_num] == STATE_LEADER ? 1 : 0
    end

    def fetch_zone_servers
        pool = OpenNebula::ZonePool.new(@one_client)
        rc = pool.info

        raise rc.message if OpenNebula.is_error?(rc)

        extract_servers(pool)
    end

    def extract_servers(pool)
        servers = []

        pool.each do |zone|
            zone.each('SERVER_POOL/SERVER') do |srv|
                servers << zone_server_hash(srv)
            end
        end

        servers
    end

    def zone_server_hash(server)
        {
            :id => server['ID'].to_i,
          :name => server['NAME'].to_s,
          :endpoint => server['ENDPOINT'].to_s
        }
    end

    def fetch_local_status
        fetch_raft(@xmlrpc_endpoint)
    rescue StandardError
        error_status
    end

    def fetch_server_status(server)
        status = fetch_raft(server[:endpoint])
        merge_server_status(status, server)
    rescue StandardError
        merge_server_status(error_status, server)
    end

    def merge_server_status(status, server)
        status.merge(
            :id => server[:id],
            :name => server[:name]
        )
    end

    def error_status
        {
            :state_num => nil,
          :rpc_error => true
        }
    end

    def fetch_raft(endpoint)
        xml = rpc_call(endpoint, 'one.zone.raftstatus')
        parse_raft(xml)
    end

    def rpc_call(endpoint, method)
        Timeout.timeout(@timeout) do
            client = XMLRPC::Client.new2(endpoint)
            ok, payload, error_code = client.call(method, @auth)

            raise "#{method} failed: #{error_code}" unless ok

            payload
        end
    end

    def parse_raft(xml)
        doc = REXML::Document.new(xml)
        raft = REXML::XPath.first(doc, '//RAFT')

        raise 'RAFT not found' unless raft

        {
            :state_num => text(raft, 'STATE')&.to_i,
          :rpc_error => false
        }
    end

    def text(node, name)
        el = REXML::XPath.first(node, name)
        el&.text
    end

    def problem_state?(status)
        return true if status[:rpc_error]

        state = status[:state_num]
        state != STATE_LEADER && state != STATE_FOLLOWER
    end

    def resolve_fqdn
        host = Socket.gethostname
        Addrinfo.getaddrinfo(host, nil).first.getnameinfo.first
    rescue StandardError
        Socket.gethostname
    end

end
