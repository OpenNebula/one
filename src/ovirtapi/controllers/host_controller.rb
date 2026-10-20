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

require 'json'
require 'opennebula'
require_relative 'helper_functions'

# Helper functions for OpenNebula API controllers
class HostController

    # Auxiliary function to get a list of OpenNebula Hosts or
    # a single Host if an id is provided
    def self.get_one_hosts(client, id = nil)
        id = Helper.uuid_to_int(id) unless id.nil?
        host_pool = OpenNebula::HostPool.new(client)
        rc = host_pool.info_all
        Helper.check_lookup_error(rc, 'Unable to retrieve hosts')

        id ? host_pool.find {|host| host.id == id } : host_pool
    end

    # Host pool inventory does not include live monitoring. Request only the
    # latest sample for each host, using the same authenticated client.
    def self.get_one_host_monitoring(client)
        xml = OpenNebula::HostPool.new(client).monitoring_xml(0)
        if OpenNebula.is_error?(xml)
            raise "Unable to retrieve host monitoring: #{xml.message}"
        end

        data = OpenNebula::XMLElement.new
        data.initialize_xml(xml, 'MONITORING_DATA')
        raise 'Invalid host monitoring response' if data.xml_nil?

        monitoring = {}
        data.each('MONITORING') do |sample|
            monitoring[sample['ID'].to_i] = sample.to_hash['MONITORING']
        end
        return monitoring
    end

    def self.follow_statistics?(follows)
        follows.to_s.split(',').map(&:strip).include?('statistics')
    end

    # Struct Reference: http://ovirt.github.io/ovirt-engine-api-model/master/#types/host
    def self.onehost_to_ovirthost(host, follows: nil, monitoring: nil)
        status_dict = {
            0 => 'initializing',
          1 => 'unassigned',
          2 => 'up',
          3 => 'error',
          4 => 'down',
          5 => 'unassigned',
          6 => 'unassigned',
          7 => 'unassigned'
        }

        host_hash = host.to_hash
        vms = host_hash.dig('HOST', 'VMS')

        if vms.nil?
            active = 0
        elsif vms.is_a?(Array)
            active = vms.length
        else
            active = 1
        end

        host_uuid = Helper.int_to_uuid(host.id.to_i).to_s
        cluster_uuid = Helper.int_to_uuid(host_hash.dig('HOST', 'CLUSTER_ID').to_i).to_s

        formatted_host = {
            :name => host.name,
              :address => host.name,
              :id => host_uuid,
              :href => "/ovirt-engine/api/hosts/#{host_uuid}",
              :status => status_dict.fetch(host_hash.dig('HOST', 'STATE').to_i, 'unassigned'),

              # Add summary with existing values
              :summary => {
                  :active => active,
                :migrating => 0,
                :total => active
              },

              # Add cluster with existing values
              :cluster => {
                  :id => cluster_uuid,
                :href => "/ovirt-engine/api/clusters/#{cluster_uuid}"
              },

              # Add memory values with existing values
              :max_scheduling_memory => host_hash.dig('HOST', 'HOST_SHARE', 'MAX_MEM').to_i*1024,
              :memory => host_hash.dig('HOST', 'HOST_SHARE', 'TOTAL_MEM').to_i*1024,

              # Hardcoded additional values below
              :auto_numa_status => 'unknown',
              :certificate => {
                  :organization => 'opennebula.io',
                :subject => "O=opennebula.io,CN=#{host.name}"
              },
              :cpu => {
                  :name => 'Intel(R) Xeon(R) CPU E5-1650 0 @ 3.20GHz',
                :speed => 3396,
                :topology => {
                    :cores => '6',
                  :sockets => '1',
                  :threads => '2'
                },
                :type => 'Secure Intel SandyBridge Family'
              },
              :device_passthrough => {
                  :enabled => 'true'
              },
              :external_status => 'ok',
              :hardware_information => {
                  :family => 'ProLiant',
                :manufacturer => 'HP',
                :product_name => 'ProLiant DL160 Gen8',
                :serial_number => 'CZ3408195F',
                :supported_rng_sources => {
                    :supported_rng_source => [
                        'random',
                        'hwrng'
                    ]
                },
                :uuid => '32363636-3238-5A43-3334-303831393546',
                :version => ''
              },
              :iscsi => {
                  :initiator => 'iqn.1988-12.com.oracle:99cb397e9a'
              },
              :kdump_status => 'disabled',
              :ksm => {
                  :enabled => 'false'
              },
              :libvirt_version => {
                  :build => '0',
                :full_version => 'libvirt-9.0.0-10.module+el8.10.0+90488+43ab228f',
                :major => '9',
                :minor => '0',
                :revision => '0'
              },
              :numa_supported => 'false',
              :os => {
                  :custom_kernel_cmdline => '',
                :reported_kernel_cmdline =>
                  'BOOT_IMAGE=(mduuid/3786bce0d90a96fe1fc7eff013e5cbab)' \
                  '/vmlinuz-5.4.17-2136.339.5.1.el8uek.x86_64 ' \
                  'root=UUID=2c0b165b-bb0c-414d-843d-ded600b4281f ro crashkernel=auto ' \
                  'resume=UUID=73084e3e-c157-404c-87e8-bde8a5dd56b4 ' \
                  'rd.md.uuid=aef9c805:0043518f:0a2f54a0:206ca750 ' \
                  'rd.md.uuid=3786bce0:d90a96fe:1fc7eff0:13e5cbab ' \
                  'biosdevname=0 net.ifnames=0 rhgb quiet',
                :type => 'RHEL',
                :version => {
                    :full_version => '8.10 - 1.0.7.el8',
                  :major => '8',
                  :minor => '10'
                }
              },
              :ovn_configured => 'true',
              :port => '54321',
              :power_management => {
                  :automatic_pm_enabled => 'true',
                :enabled => 'false',
                :kdump_detection => 'true',
                :pm_proxies => {}
              },
              :protocol => 'stomp',
              :reinstallation_required => 'false',
              :se_linux => {
                  :mode => 'disabled'
              },
              :spm => {
                  :priority => '5',
                :status => 'spm'
              },
              :ssh => {
                  :fingerprint => 'SHA256:VcpAqhW7RbMUEqpLdf7CnMz7bEXSaL7fVQiRshAOV4E',
                :port => '22',
                :public_key => 'ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAA' \
                  'AIbmlzdHAyNTYAAABBBH6NqDKB+giHfu+zNlJjGaPFpQBnF9OSgjW4AXbNrboHEMwyt' \
                  'Uia4binyDaC0aV+Uqnp9wdhfNoct5DFk1doNRc='
              },
              :transparent_hugepages => {
                  :enabled => 'true'
              },
              :type => 'rhel',
              :update_available => 'true',
              :version => {
                  :build => '5',
                :full_version => 'vdsm-4.50.5.1-4.el8',
                :major => '4',
                :minor => '50',
                :revision => '1'
              },
              :vgpu_placement => 'consolidated',
              :comment => '',
              :link => [
                  {
                      :href => "/ovirt-engine/api/hosts/#{host_uuid}/statistics",
                    :rel => 'statistics'
                  }
              ]
        }

        if follow_statistics?(follows)
            formatted_host[:statistics] = onehost_to_statistics(
                host_hash, :monitoring => monitoring
            )
        end

        return formatted_host
    end

    # Use measured load, not CPU_USAGE/MEM_USAGE (VM allocations) or the
    # MAX_* scheduling limits, which may include reserved/overcommitted capacity.
    def self.onehost_to_statistics(host_hash, monitoring: nil)
        share = host_hash.dig('HOST', 'HOST_SHARE') || {}
        monitoring ||= host_hash.dig('HOST', 'MONITORING') || {}
        capacity = monitoring['CAPACITY'] || {}

        total_cpu = share['TOTAL_CPU'].to_f
        used_cpu = (capacity['USED_CPU'] || share['USED_CPU']).to_f
        # Unmonitored hosts have no usable CPU total. Avoid division by zero.
        idle_cpu = total_cpu > 0 ? (100.0 - 100.0 * used_cpu / total_cpu).clamp(0.0, 100.0) : 100.0
        total_memory = [share['TOTAL_MEM'].to_i, 0].max * 1024
        used_memory = [(capacity['USED_MEMORY'] || share['USED_MEM']).to_i, 0].max * 1024

        statistics = [
            ['cpu.current.idle', 'Idle CPU usage', 'decimal', 'percent', idle_cpu],
            ['memory.used', 'Used memory', 'integer', 'bytes', used_memory],
            ['memory.total', 'Total memory', 'integer', 'bytes', total_memory]
        ].map do |name, description, type, unit, datum|
            {
                :name => name,
                :description => description,
                :kind => 'gauge',
                :type => type,
                :unit => unit,
                :values => { :value => [{ :datum => datum }] }
            }
        end

        return { :statistic => statistics }
    end

    def self.get_ovirt_host_statistics(client, id)
        host = get_one_hosts(client, id)
        return 404, Helper.fault_response("Host #{id} not found") if host.nil?

        monitoring = get_one_host_monitoring(client)
        return 200, onehost_to_statistics(host.to_hash, :monitoring => monitoring[host.id])
    end

    # Return list of formatted oVirt Hosts
    def self.get_ovirt_hosts(client, id: nil, max: nil, search: nil, follows: nil)
        if id
            LOGGER.info("Finding host with ID: #{id}")
            host = get_one_hosts(client, id)

            if host.nil?
                LOGGER.error("Host with ID #{id} not found")
                return 404, Helper.fault_response("Host #{id} not found")
            end

            monitoring = follow_statistics?(follows) ? get_one_host_monitoring(client) : {}
            return 200, onehost_to_ovirthost(host, :follows => follows,
                                           :monitoring => monitoring[host.id])
        end

        pagination = Helper::Pagination.new(:max => max, :search => search)
        hosts = get_one_hosts(client)

        if hosts.nil?
            LOGGER.warn('No hosts found')
            return 404, {}
        end

        hosts = pagination.apply(hosts)
        monitoring = if follow_statistics?(follows) && !hosts.empty?
                         get_one_host_monitoring(client)
                     else
                         {}
                     end

        formatted_hosts = []
        hosts.each do |h|
            formatted_hosts << onehost_to_ovirthost(h, :follows => follows,
                                                  :monitoring => monitoring[h.id])
        end
        return 200, { :host => formatted_hosts }
    end

end
