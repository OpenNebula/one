#!/usr/bin/env ruby
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
# -------------------------------------------------------------------------- #

# frozen_string_literal: true

ONE_LOCATION = ENV['ONE_LOCATION']

if ONE_LOCATION.nil?
    ONEPROMETHEUS_ETC_LOCATION = '/etc/one/'
else
    ONEPROMETHEUS_ETC_LOCATION = ONE_LOCATION + '/etc/'
end

require 'optparse'
require 'fileutils'
require 'socket'
require 'uri'
require 'yaml'
require 'resolv'
require 'ipaddr'

LOCAL_IPS = Socket.ip_address_list.map { |ip| ip.ip_address }

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
    result = $?.to_i

    exit(-1) if result != 0

    YAML.safe_load output
end

def detect_servers(zone_name_or_id = 'OpenNebula')
    servers = onezone_show(zone_name_or_id)&.dig('ZONE', 'SERVER_POOL', 'SERVER')

    if servers.is_a?(Hash)
        servers = [servers]
    end

    addresses = servers&.map do |server|
        hostname = URI(server['ENDPOINT']).host
        Addrinfo.ip(hostname).ip_address
    end

    interface_addresses = Socket.ip_address_list.map do |address|
        address.ip_address
    end

    address = addresses&.find do |addr|
        interface_addresses.include? addr
    end

    index = addresses&.index address
    addresses&.delete_at index

    [addresses || [], address || Socket.gethostname]
end

def onehost_list
    hosts = YAML.safe_load `onehost list --yaml`
    hosts = hosts.dig('HOST_POOL', 'HOST') || []
    hosts = [hosts] if hosts.is_a? Hash

    hosts.select { |h| h['TEMPLATE']['HOSTNAME'] }
end

def is_local?(srv)
    ip_regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

    if srv.match(ip_regex)
        return LOCAL_IPS.include?(srv) || IPAddr.new('127.0.0.0/8').include?(srv)
    else
        begin
            ip = Resolv.getaddress(srv)
        rescue
            return Socket.gethostname == srv
        end

        return LOCAL_IPS.include?(ip) || IPAddr.new('127.0.0.0/8').include?(ip)
    end
end

def patch_datasources(document, zone_name_or_id = 'OpenNebula')
    hosts = onehost_list

    servers, myself = detect_servers zone_name_or_id

    # Alertmanager
    document['alerting']['alertmanagers'] = [{
        'static_configs' => [{
            'targets' => (servers + [myself]).map do |server|
                "#{server}:9093"
            end
        }]
    }]

    scrape_configs = []

    # OpenNebula exporter
    scrape_configs << {
        'job_name' => 'opennebula_exporter',
        'static_configs' => [{
            'targets' => ["#{myself}:9925"]
        }]
    }

    # Node exporter
    node_exporters = []

    node_exporters += [{
        'targets' => servers.map { |server| "#{server}:9100" }
    }] unless servers.empty?

    node_exporters += hosts.map do |host|
        { 'targets' => ["#{host['TEMPLATE']['HOSTNAME']}:9100"],
          'labels' => { 'one_host_id' => host['ID'] } }
    end unless hosts.empty?

    # if localhost is not included in hosts already
    node_exporters += [{ 'targets' => ["#{myself}:9100"] }] \
        unless hosts.map { |h| h['TEMPLATE']['HOSTNAME'] }.any? { |h| is_local?(h) }

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
