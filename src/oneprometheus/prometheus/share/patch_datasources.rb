#!/usr/bin/env ruby
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
# -------------------------------------------------------------------------- #

# frozen_string_literal: true

ONE_LOCATION = ENV['ONE_LOCATION']

if ONE_LOCATION.nil?
    ONEPROMETHEUS_ETC_LOCATION = '/etc/one/'
else
    ONEPROMETHEUS_ETC_LOCATION = ONE_LOCATION + '/etc/'
end

require 'English'
require 'optparse'
require 'fileutils'
require 'socket'
require 'uri'
require 'yaml'
require 'resolv'
require 'ipaddr'

LOCAL_ADDRS = Socket.ip_address_list.map(&:ip_address) + [Socket.gethostname]

def list_to_dict(list, key: 'job_name')
    list.each_with_object({}) do |item, dict|
        dict[item[key]] = item
    end
end

def dict_to_list(dict)
    dict.each_with_object([]) do |item, list|
        list << item[1]
    end
end

def file(path, content, mode: 'u=rw,go=r',
         overwrite: false,
         backup: false)
    return if !overwrite && File.exist?(path)

    if content.nil?
        FileUtils.mkdir_p path
    else
        if overwrite && backup && File.exist?(path)
            FileUtils.cp path, "#{path}.#{Time.now.utc.to_i}.bak"
        end

        FileUtils.mkdir_p File.dirname path
        File.write path, content
    end

    begin
        FileUtils.chmod mode, path
    rescue StandardError
        nil
    end
end

def onezone_show(zone_name_or_id = 'OpenNebula')
    output = `onezone show '#{zone_name_or_id}' --yaml`
    result = $CHILD_STATUS.to_i

    exit(-1) if result != 0

    YAML.safe_load output
end

def onehost_list
    output = `onehost list --yaml`
    result = $CHILD_STATUS.to_i

    exit(-1) if result != 0

    hosts = YAML.safe_load(output)&.dig('HOST_POOL', 'HOST') || []

    [hosts].flatten.select {|v| v['TEMPLATE']['HOSTNAME'] }
end

def is_local?(host)
    case host.to_s.strip
    when Resolv::AddressRegex # IPv4 or IPv6
        v = Regexp.last_match(0)
        LOCAL_ADDRS.include?(v) || IPAddr.new(v).loopback?
    when /^.+$/ # hostname
        v = Regexp.last_match(0)
        begin
            Addrinfo.getaddrinfo(v, nil, nil, :STREAM).map do |addr|
                ip = addr.ip_address
                LOCAL_ADDRS.include?(ip) || IPAddr.new(ip).loopback?
            end.any?
        rescue Socket::ResolutionError
            Socket.gethostname == v
        end
    else
        false
    end
end

def detect_servers(zone_name_or_id = 'OpenNebula')
    servers = onezone_show(zone_name_or_id)&.dig('ZONE', 'SERVER_POOL', 'SERVER') || []

    # NOTE: OpenNebula strictly requires that all FEs have resolvable
    #       hostnames, otherwise some datastore related operations fail.
    #       Hence we can safely assume hostnames can be always used
    #       here instead of IP addresses.
    addresses = [servers].flatten.map {|v| URI(v['ENDPOINT']).host }

    myself = addresses.find {|v| is_local?(v) } || Socket.gethostname

    addresses.reject! {|v| v == myself }

    [addresses, myself].tap do |result|
        # assert addresses are resolvable (raises Socket::ResolutionError)
        result.flatten.each {|v| Addrinfo.ip(v) }
    end
end

def format_host(host)
    case host.to_s.strip
    when Resolv::IPv6::Regex
        "[#{Regexp.last_match(0)}]"
    when /^.+$/ # IPv4 or hostname
        Regexp.last_match(0)
    else
        raise ArgumentError, 'Invalid host'
    end
end

# Hardcoded list of optional prometheus exporters shipped by OpenNebula.
# `target` selects which set of nodes to probe:
#   - "hosts"   -> every entry in `onehost list`
#   - "servers" -> every entry in `onezone show ... SERVER_POOL` plus self
EXTRA_EXPORTERS = [
    { 'job_name' => 'ovs_exporter',      'port' => 9475, 'target' => 'hosts'   },
    { 'job_name' => 'smartctl_exporter', 'port' => 9633, 'target' => 'hosts'   },
    { 'job_name' => 'lvm_exporter',      'port' => 9845, 'target' => 'hosts'   },
    { 'job_name' => 'mysql_exporter',    'port' => 9104, 'target' => 'servers' }
].freeze

def reachable?(host, port, timeout: 2)
    Socket.tcp(host, port, connect_timeout: timeout) { true }
rescue StandardError
    false
end

def patch_datasources(document, zone_name_or_id = 'OpenNebula')
    hosts = onehost_list

    servers, myself = detect_servers zone_name_or_id

    # Alertmanager
    document['alerting']['alertmanagers'] = [{
        'static_configs' => [{
            'targets' => (servers + [myself]).map {|server| "#{format_host(server)}:9093" }
        }]
    }]

    scrape_configs = []

    # OpenNebula exporter
    scrape_configs << {
        'job_name' => 'opennebula_exporter',
        'static_configs' => [{
            'targets' => ["#{format_host(myself)}:9925"]
        }]
    }

    # Node exporter
    node_exporters = []

    node_exporters += [{
        'targets' => servers.map {|server| "#{format_host(server)}:9100" }
    }] unless servers.empty?

    node_exporters += hosts.map do |host|
        { 'targets' => ["#{host['TEMPLATE']['HOSTNAME']}:9100"],
          'labels' => { 'one_host_id' => host['ID'] } }
    end unless hosts.empty?

    # if localhost is not included in hosts already
    node_exporters += [{ 'targets' => ["#{format_host(myself)}:9100"] }] \
        unless hosts.map {|v| v['TEMPLATE']['HOSTNAME'] }.any? {|v| is_local?(v) }

    scrape_configs << {
        'job_name' => 'node_exporter',
        'static_configs' => node_exporters
    }

    # Libvirt exporter
    scrape_configs << {
        'job_name' => 'libvirt_exporter',
        'static_configs' => hosts.map do |host|
            { 'targets' => ["#{host['TEMPLATE']['HOSTNAME']}:9926"],
              'labels' => { 'one_host_id' => host['ID'] } }
        end
    } unless hosts.empty?

    # Optional extra exporters: TCP-probe every candidate (host, port) and
    # add a scrape config only for the ones currently reachable. Lets an
    # admin install opennebula-prometheus-<exporter> on a node and have the
    # next patch_datasources run pick it up automatically.
    EXTRA_EXPORTERS.each do |ex|
        port = ex['port']
        static_configs = case ex['target']
                         when 'hosts'
                             hosts.select { |h| reachable?(h['TEMPLATE']['HOSTNAME'], port) }.map do |host|
                                 { 'targets' => ["#{host['TEMPLATE']['HOSTNAME']}:#{port}"],
                                   'labels'  => { 'one_host_id' => host['ID'] } }
                             end
                         when 'servers'
                             present = (servers + [myself]).select { |s| reachable?(s, port) }
                             present.empty? ? [] : [{
                                 'targets' => present.map { |s| "#{format_host(s)}:#{port}" }
                             }]
                         end
        next if static_configs.empty?

        scrape_configs << {
            'job_name' => ex['job_name'],
            'static_configs' => static_configs
        }
    end

    document['scrape_configs'] = dict_to_list(
        list_to_dict(document['scrape_configs']).merge(list_to_dict(scrape_configs))
    )

    document
end

if caller.empty?
    options = { :zone_name_or_id => 'OpenNebula' }

    OptionParser.new do |opts|
        opts.banner = "Usage: #{$PROGRAM_NAME} [options]"

        opts.on '-z ZONE_NAME_OR_ID',
                '--zone-name-or-id ZONE_NAME_OR_ID',
                'OpenNebula Zone name or ID' do |zone_name_or_id|
            options[:zone_name_or_id] = zone_name_or_id
        end

        opts.on_tail '-h', '--help', 'Show this message' do
            puts opts
            exit
        end
    end.parse!

    prometheus_yml_path = "#{ONEPROMETHEUS_ETC_LOCATION}/prometheus/prometheus.yml"

    prometheus_yml = patch_datasources YAML.load_file(prometheus_yml_path),
                                       options[:zone_name_or_id]

    file prometheus_yml_path,
         YAML.dump(prometheus_yml),
         :mode => 'ug=rw,o=',
         :overwrite => true,
         :backup => true
end
