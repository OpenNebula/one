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

require 'yaml'
require 'json'
require 'base64'
require 'opennebula'
require 'securerandom'
require 'rexml/document'
require_relative 'user_controller'
require_relative 'network_controller'
require_relative 'tag_controller'
require_relative 'host_controller'
require_relative 'disk_controller'
require_relative 'helper_functions'
require_relative 'jobs_controller'

# VmController manages OpenNebula Virtual Machines
class VmController

    # Preserve lookup status through nested controllers to the HTTP error handler.
    class LookupError < Helper::LookupError; end

    # Auxiliary function to get a list of OpenNebula Virtual Machines or
    # a single VM if an id is provided
    def self.get_one_vms(client, vm_id: nil, vm_name: nil, extended: false, full: false)
        if client.is_a?(Helper::Inventory)
            if vm_id
                id = Helper.uuid_to_int(vm_id).to_i
                return client.vm(id, :full => full) { get_one_vms(client.client, :vm_id => id) }
            end

            vms = client.pool(:vms) { get_one_vms(client.client, :extended => true) }
            return vm_name ? vms&.find {|vm| vm.name == vm_name } : vms
        end

        if vm_id
            vm_id = Helper.uuid_to_int(vm_id).to_i
            LOGGER.info("Retrieving VM with ID: #{vm_id}")
            vm = OpenNebula::VirtualMachine.new_with_id(vm_id, client)
            rc = vm.info
            if OpenNebula.is_error?(rc)
                LOGGER.error "Error retrieving VM: #{rc.message}"
                status = case rc.errno
                         when OpenNebula::Error::EAUTHENTICATION,
                              OpenNebula::Error::EAUTHORIZATION
                             401
                         when OpenNebula::Error::ENO_EXISTS
                             404
                         else
                             500
                         end
                raise LookupError.new(status, "Unable to retrieve VM #{vm_id}")
            end
            raise LookupError.new(404, "VM #{vm_id} not found") if vm['STATE'].to_i == 6

            return vm
        end

        vm_pool = OpenNebula::VirtualMachinePool.new(client)
        rc = extended ? vm_pool.info_all_extended : vm_pool.info_all

        if OpenNebula.is_error?(rc)
            LOGGER.error "Error: #{rc.message}"
            return
        end

        # check if there is a vm_id or vm_name
        if vm_name
            LOGGER.info("Searching VM with name: #{vm_name}")
            return vm_pool.find {|v| v.name == vm_name }
        end

        return vm_pool
    end

    # Convert an OpenNebula STATE+LCM_STATE into an oVirt VM status
    def self.get_vm_status(state, lcm_state)
        state_translations = {
            0 => 'powering_up',
          1 => 'wait_for_launch',
          2 => 'wait_for_launch',
          4 => 'paused',
          5 => 'suspended',
          6 => 'unknown',
          8 => 'down',
          9 => 'down',
          10 => 'unknown',
          11 => 'unknown'
        }

        lcm_translations = {
            3 => 'up'
        }
        return state_translations.fetch(state, 'unknown') if state != 3

        return lcm_translations.fetch(lcm_state, 'unknown')
    end

    # Convert an OpenNebula VM into an oVirt VM.
    # To fullfill a possible schema, we use an existing
    # oVirt template and modify the parameters we consider
    # are important to be translated.
    def self.onevm_to_ovirtvm(client, onevm, nics: nil, disks: nil, tags: nil)
        one_hash = Helper.resource_hash(client, onevm)

        history = one_hash['VM']['HISTORY_RECORDS']['HISTORY']

        # check if not nil
        if !history.nil?
            host_id = history.is_a?(Array) ? history.last['HID'] : history['HID']
            cluster_id = history.is_a?(Array) ? history.last['CID'] : history['CID']
        else
            host_id = nil
            cluster_id = nil
        end

        vm_template = '<VM>' + onevm.template_xml + '</VM>'
        # Add UID and GID to the template
        xml_element = OpenNebula::XMLElement.new
        xml_element.initialize_xml(vm_template, 'VM')
        xml_element.add_element('TEMPLATE', 'AS_UID' => one_hash['VM']['UID'].to_s)
        xml_element.add_element('TEMPLATE', 'AS_GID' => one_hash['VM']['GID'].to_s)

        vm_template = '<?xml version="1.0" encoding="UTF-8"?><VM>' \
            + xml_element.template_xml + '</VM>'

        status = get_vm_status(one_hash['VM']['STATE'].to_i, one_hash['VM']['LCM_STATE'].to_i)

        vm_id = Helper.int_to_uuid(onevm.id).to_s

        vcpu_count = one_hash.dig('VM', 'TEMPLATE', 'VCPU')
        vcpu_count = 1 if vcpu_count.nil? || vcpu_count.is_a?(Hash)

        response = {
            :next_run_configuration_exists => 'false',
          :status => status,
          :stop_time => 1740406744160,
          :original_template => {
              :id => '00000000-0000-0000-0000-000000000000'
          },
          :template => {
              :id => '00000000-0000-0000-0000-000000000000'
          },
          :actions => {
              :link => [
                  {
                      :href => "/ovirt-engine/api/vms/#{vm_id}/shutdown",
                      :rel => 'shutdown'
                  },
                  {
                      :href => "/ovirt-engine/api/vms/#{vm_id}/start",
                      :rel => 'start'
                  },
                  {
                      :href => "/ovirt-engine/api/vms/#{vm_id}/stop",
                      :rel => 'stop'
                  }
              ]
          },
          :name => onevm.name,
          :description => '',
          :comment => '',
          :host => {
              :href => "/ovirt-engine/api/hosts/#{Helper.int_to_uuid(host_id.to_i)}",
            :id => Helper.int_to_uuid(host_id.to_i).to_s
          },
          :bios => {
              :boot_menu => {
                  :enabled => 'false'
              },
              :type => 'q35_ovmf'
          },
          :console => {
              :enabled => 'false'
          },
          :cpu => {
              :architecture => 'x86_64',
              :topology => {
                  :cores => '1',
                  :sockets => vcpu_count.to_s,
                  :threads => '1'
              }
          },
          :display => {
              :address => '0.0.0.0',
              :certificate => {
                  :content => <<~CERTIFICATE_CONTENT,
                      -----BEGIN CERTIFICATE-----
                      MIID0jCCArqgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwTTELMAkGA1UEBhMCVVMxFjAUBgNVBAoM
                      DW9wZW5uZWJ1bGEuaW8xJjAkBgNVBAMMHW9sdm0tZGV2Mi5vcGVubmVidWxhLmlvLjY1NjE1MB4X
                      DTI1MDIwNTExMjkyMFoXDTQ1MDIwMTExMjkyMFowTTELMAkGA1UEBhMCVVMxFjAUBgNVBAoMDW9w
                      ZW5uZWJ1bGEuaW8xJjAkBgNVBAMMHW9sdm0tZGV2Mi5vcGVubmVidWxhLmlvLjY1NjE1MIIBIjAN
                      BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr7jvAGFeme9sKuFuLcJ77PR7uSU9bivgQ66CY51v
                      or5t885nnuVtX+vnz+UI9cVUjZazZt68PHA6CTPb90JocklXTllFJX9xne80UtHevoxo5Unezexy
                      hEjOfmefpO3fFw4trMKM2ftAihdRFr7me05D8rwd6cyX+nACj+Wp1nU7jDlNJ8J17YbyJD8cRyQU
                      R68/9yy16gbKpT8RvCv5qeuW56YJJA+114hSYgi2RovGzRqsqGHXr9fjqKE1iQBg8rnQUZWUX6j0
                      NIZLsNO7Jb9oxiyEFvTyyXijSiVecrnmx2fdN39AZ1Ffsh3fh3baPdK4D/3HBYGTYPRNrkr5QwID
                      AQABo4G7MIG4MB0GA1UdDgQWBBTz0Y42y36DDiL1EyHnyocxxFhKzTB2BgNVHSMEbzBtgBTz0Y42
                      y36DDiL1EyHnyocxxFhKzaFRpE8wTTELMAkGA1UEBhMCVVMxFjAUBgNVBAoMDW9wZW5uZWJ1bGEu
                      aW8xJjAkBgNVBAMMHW9sdm0tZGV2Mi5vcGVubmVidWxhLmlvLjY1NjE1ggIQADAPBgNVHRMBAf8E
                      BTADAQH/MA4GA1UdDwEB/wQEAwIBBjANBgkqhkiG9w0BAQsFAAOCAQEAFWPrPeIPJVxgndjosiGi
                      TN1s1klwmQN/9F8orXks1tv+CM4UIfXZi2WOcJxIIt0O6vFKUrco/cEGDXolBAOWctk+SZILmLWw
                      CKbdnjPEOyd8SDvZYmeNqdIEM7AVHYVZY40XbQvrGKPlWZ1tTe+4QoqOIlGsYqTlSEulq0tZ/ztX
                      hfBS5uyS71mrbJziqn4D19Z3a1CgC8Tb8cKp0Y6MlaDm6sTXe9nN17VuNCKStvJQT4C3Nv6ZGKok
                      xFTIvuAeEX+p7oPKxA5A0MexiIKnUvTvuxKYnYXlomjX+8eYDG6D9wjuFX5cLfstW8rPRmehg/sG
                      S/cFxwqTs9KmtqpWMw==
                      -----END CERTIFICATE-----
                  CERTIFICATE_CONTENT
                :organization => 'opennebula.io',
                :subject => 'O=opennebula.io,CN=localhost'
              },
              :allow_override => 'false',
              :copy_paste_enabled => 'true',
              :disconnect_action => 'LOCK_SCREEN',
              :disconnect_action_delay => '0',
              :file_transfer_enabled => 'true',
              :monitors => '1',
              :smartcard_enabled => 'false',
              :type => 'vnc'
          },
          :initialization => {
              :configuration => {
                  :data => vm_template,
                  :type => 'ovf'
              }
          },
          :io => {
              :threads => '1'
          },
          :memory => (one_hash['VM']['TEMPLATE']['MEMORY'].to_i*1024*1024).to_s,
          :migration => {
              :auto_converge => 'inherit',
              :compressed => 'inherit',
              :encrypted => 'inherit',
              :parallel_migrations_policy => 'inherit'
          },
          :origin => 'ovirt',
          :os => {
              :boot => {
                  :devices => {
                      :device => [
                          'hd'
                      ]
                  }
              },
              :type => 'other'
          },
          :sso => {
              :methods => {
                  :method => [
                      {
                          :id => 'guest_agent'
                      }
                  ]
              }
          },
          :stateless => 'false',
          :type => 'desktop',
          :usb => {
              :enabled => 'false'
          },
          :cluster => {
              :href => "/ovirt-engine/api/clusters/#{Helper.int_to_uuid(cluster_id.to_i)}",
              :id => Helper.int_to_uuid(cluster_id.to_i).to_s
          },
          :link => [
              {
                  :href => "/ovirt-engine/api/vms/#{vm_id}/reporteddevices",
                  :rel => 'reporteddevices'
              },
              {
                  :href => "/ovirt-engine/api/vms/#{vm_id}/snapshots",
                  :rel => 'snapshots'
              },
              {
                  :href => "/ovirt-engine/api/vms/#{vm_id}/backups",
                  :rel => 'backups'
              },
              {
                  :href => "/ovirt-engine/api/vms/#{vm_id}/checkpoints",
                  :rel => 'checkpoints'
              },
              {
                  :href => "/ovirt-engine/api/vms/#{vm_id}/nics",
                  :rel => 'nics'
              },
              {
                  :href => "/ovirt-engine/api/vms/#{vm_id}/diskattachments",
                  :rel => 'diskattachments'
              }
          ],
          :href => "/ovirt-engine/api/vms/#{vm_id}",
          :id => vm_id,
          :auto_pinning_policy => 'disabled',
          :cpu_pinning_policy => 'none',
          :cpu_shares => '0',
          :creation_time => one_hash['VM']['STIME'],
          :delete_protected => 'false',
          :high_availability => {
              :enabled => 'false',
              :priority => '1'
          },
          :large_icon => {
              :id => 'f5084e9e-6720-417c-902c-5e0fa2e7875a'
          },
          :memory_policy => {
              :ballooning => 'true',
              :guaranteed => one_hash['VM']['TEMPLATE']['MEMORY'].to_i*1024*1024,
              :max => one_hash['VM']['TEMPLATE']['MEMORY'].to_i*1024*1024
          },
          :migration_downtime => '-1',
          :multi_queues_enabled => 'true',
          :placement_policy => {
              :affinity => 'migratable'
          },
          :rng_device => {
              :source => 'urandom'
          },
          :small_icon => {
              :id => 'f050f11f-a529-4710-8c5e-989934e720cb'
          },
          :soundcard_enabled => 'false',
          :start_paused => 'false',
          :storage_error_resume_behaviour => 'auto_resume',
          :time_zone => {
              :name => 'Etc/GMT'
          },
          :tpm_enabled => 'false',
          :virtio_scsi => {
              :enabled => 'true'
          },
          :virtio_scsi_multi_queues_enabled => 'false',
          :cpu_profile => {
              :id => '58ca604e-01a7-003f-01de-000000000250'
          }
        }

        if nics
            response['nics'] =
                NetworkController.get_ovirt_nics(client, onevm.id,
                                                 :follows => Helper.remove_follow_start(nics))
        end
        if disks
            response['disk_attachments'] =
                DiskController.get_vm_diskattachments(client, onevm.id,
                                                      :follows => Helper.remove_follow_start(disks))
        end
        if tags
            response['tags'] = TagController.get_vm_tags(client, onevm.id)
        end

        return response
    end

    # Return list of formatted oVirt VMs
    def self.get_ovirt_vms(client, follows: nil, search: nil, vm_id: nil, max: nil)
        client = Helper::Inventory.wrap(client)
        # Check if there are any follow parameters
        nics = nil
        disks = nil
        tags = nil
        if follows
            LOGGER.info("Follows parameters: #{follows}")
            follows = follows.split(',')
            follows.each do |follow|
                follow_array = follow.split('.')
                case follow_array.first
                when 'nics'
                    nics = follow
                when 'disk_attachments'
                    disks = follow
                when 'tags'
                    tags = follow
                end
            end
        end

        # Check if only a specific vm is needed by ID
        if vm_id
            LOGGER.info("Retrieving specific VM with ID: #{vm_id}")
            vm = get_one_vms(client, :vm_id => vm_id, :full => true)

            return 200, onevm_to_ovirtvm(client, vm, :nics => nics, :disks => disks, :tags => tags)
        end

        pagination = Helper::Pagination.new(:max => max, :search => search)
        search = pagination.search

        # Check if there is any search parameters
        if search && search.include?('name=') && search.split[0] != 'sortby'
            vm_name = search.gsub('name=', '').gsub('*', '')
            LOGGER.info("Searching VM with name: #{vm_name}")
            vm = get_one_vms(client, :vm_name => vm_name)
            vms = vm.nil? ? [] : [vm]
        else
            # Get list of OpenNebula Virtual Machines
            vms = get_one_vms(client)
            if vms.nil?
                return 500, Helper.fault_response('Unable to obtain OpenNebula VMs')
            end
        end

        # Format each VM
        formatted_vms = []
        pagination.apply(vms).each do |v|
            next if v['STATE'].to_i == 6

            # Pool entries do not carry full monitoring. Refresh only selected VMs
            # whose reported devices are requested, before serializing any fields.
            if nics && NetworkController.reported_devices_follow?(Helper.remove_follow_start(nics))
                vm_nics = Helper.resource_hash(client, v).dig('VM', 'TEMPLATE', 'NIC')
                if vm_nics && !vm_nics.empty?
                    v = get_one_vms(client, :vm_id => v.id, :full => true)
                end
            end

            formatted_vms << onevm_to_ovirtvm(client, v, :nics => nics, :disks => disks,
                                            :tags => tags)
        rescue LookupError => e
            raise unless [401, 404].include?(e.status)

            LOGGER.info("Skipping unavailable VM #{v.id}: #{e.message}")
        end

        return 200, { :vm => formatted_vms }
    end

    # Start a VM
    def self.start_vm(client, vm_id, max_retries: 30, retry_interval: 5, timeout: 150)
        start_time = Time.now
        retries = 0

        loop do
            # Check if we've exceeded the timeout
            if Time.now - start_time > timeout
                # We return 200 despite the failure.
                # The client will retrieve the job status and respond accordingly
                LOGGER.error("Timeout reached (#{timeout}s) while waiting for" \
                    " VM #{vm_id} to become 'up'")
                return 200, JobsController.add_job('failed').to_json
            end

            # Get VM info
            vm = get_one_vms(client, :vm_id => vm_id)
            one_hash = vm.to_hash
            status = get_vm_status(one_hash['VM']['STATE'].to_i, one_hash['VM']['LCM_STATE'].to_i)

            LOGGER.info("VM status: #{status}, STATE: #{one_hash['VM']['STATE'].to_i}," \
                " LCM_STATE: #{one_hash['VM']['LCM_STATE'].to_i}")

            if status == 'up'
                LOGGER.info("VM #{vm_id} is up and running")
                job = JobsController.add_job('finished')
                body = {
                    'job' => {
                        'href' => "/ovirt-engine/api/jobs/#{job['id']}",
                        'id' => job['id']
                    },
                  'status' => 'complete',
                  'vm' => {
                      'href' => "/ovirt-engine/api/vms/#{vm_id}",
                      'id' => Helper.int_to_uuid(vm_id.to_i).to_s
                  }
                }
                return 200, body.to_json
            else
                # Increment retry counter
                retries += 1

                if retries > max_retries
                    LOGGER.error("Max retries (#{max_retries}) reached while waiting" \
                        " for VM #{vm_id} to become 'up'")
                    job = JobsController.add_job('failed')
                    body = {
                        'job' => {
                            'href' => "/ovirt-engine/api/jobs/#{job['id']}",
                            'id' => job['id']
                        },
                      'status' => 'complete',
                      'vm' => {
                          'href' => "/ovirt-engine/api/vms/#{vm_id}",
                          'id' => Helper.int_to_uuid(vm_id.to_i).to_s
                      }
                    }
                    return 200, body.to_json
                end

                # Try to start or resume the VM
                if status == 'unknown'
                    LOGGER.error("Can not start VM #{vm_id}. VM is in error state")
                #           job = JobsController.add_job("failed")
                #           body = {
                #             "job" => {
                #                 "href" => "/ovirt-engine/api/jobs/#{job["id"]}",
                #                 "id" => job["id"]
                #             },
                #             "status" => "complete",
                #             "vm" => {
                #                 "href" => "/ovirt-engine/api/vms/#{vm_id}",
                #                 "id" => "#{vm_id}"
                #             }
                #           }
                #           return 200, body.to_json
                elsif ['down', 'suspended', 'poweroff'].include?(status)
                    rc = vm.resume
                elsif status == 'running'
                    rc = vm.reboot(true)
                end

                if OpenNebula.is_error?(rc)
                    LOGGER.error("Error trying to start VM #{vm_id}: #{rc.message}")
                    job = JobsController.add_job('failed')
                    body = {
                        'job' => {
                            'href' => "/ovirt-engine/api/jobs/#{job['id']}",
                            'id' => job['id']
                        },
                      'status' => 'complete',
                      'vm' => {
                          'href' => "/ovirt-engine/api/vms/#{vm_id}",
                          'id' => Helper.int_to_uuid(vm_id.to_i).to_s
                      }
                    }
                    return 200, body.to_json
                end

                # Wait before checking again
                LOGGER.info("Retry #{retries}/#{max_retries}: Waiting #{retry_interval}" \
                    ' seconds before checking VM status again')
                sleep(retry_interval)
            end
        end
    end

    def self.shutdown_vm(client, vm_id, **options)
        stop_vm(client, vm_id, **options, :hard => false)
    end

    # rubocop:disable-next Metrics/ParameterLists
    def self.stop_vm(client, vm_id, max_retries: 10, retry_interval: 3, timeout: 60, hard: true)
        LOGGER.info("Stopping VM #{vm_id}...")
        start_time = Time.now
        retries = 0
        poweroff_requested = false
        loop do
            # Check if we've exceeded the timeout
            if Time.now - start_time > timeout
                # We return 200 despite the failure.
                # The client will retrieve the job status and respond accordingly
                LOGGER.error("Timeout reached (#{timeout}s) while waiting" \
                    " for VM #{vm_id} to become 'down'")
                return 200, JobsController.add_job('failed').to_json
            end
            # Get VM info
            vm = get_one_vms(client, :vm_id => vm_id)

            one_hash = vm.to_hash
            status = get_vm_status(one_hash['VM']['STATE'].to_i, one_hash['VM']['LCM_STATE'].to_i)
            LOGGER.info("VM status: #{status}, STATE: #{one_hash['VM']['STATE'].to_i}," \
                " LCM_STATE: #{one_hash['VM']['LCM_STATE'].to_i}")

            # State 6 is a special handling for the "done" VM state, not present in oVirt
            if status == 'down' || one_hash['VM']['STATE'].to_i == 6
                LOGGER.info("VM #{vm_id} is stopped successfully")
                job = JobsController.add_job('finished')
                body = {
                    'job' => {
                        'href' => "/ovirt-engine/api/jobs/#{job['id']}",
                        'id' => job['id']
                    },
                  'status' => 'complete',
                  'vm' => {
                      'href' => "/ovirt-engine/api/vms/#{vm_id}",
                      'id' => Helper.int_to_uuid(vm_id.to_i).to_s
                  }
                }
                return 200, body.to_json
            else
                # Increment retry counter
                retries += 1
                if retries > max_retries
                    LOGGER.error("Max retries (#{max_retries}) reached while" \
                        " waiting for VM #{vm_id} to become 'down'")
                    job = JobsController.add_job('failed')
                    body = {
                        'job' => {
                            'href' => "/ovirt-engine/api/jobs/#{job['id']}",
                            'id' => job['id']
                        },
                      'status' => 'complete',
                      'vm' => {
                          'href' => "/ovirt-engine/api/vms/#{vm_id}",
                          'id' => Helper.int_to_uuid(vm_id.to_i).to_s
                      }
                    }
                    return 200, body.to_json
                end

                # ACTIVE LCM transitions (including SHUTDOWN_POWEROFF) map to
                # unknown. Keep polling them until completion or the retry/timeout limit.
                rc = nil
                if status == 'unknown' && one_hash['VM']['STATE'].to_i != 3
                    LOGGER.error("Can not stop VM #{vm_id}. VM is in unknown state")
                    job = JobsController.add_job('failed')
                    body = {
                        'job' => {
                            'href' => "/ovirt-engine/api/jobs/#{job['id']}",
                            'id' => job['id']
                        },
                      'status' => 'complete',
                      'vm' => {
                          'href' => "/ovirt-engine/api/vms/#{vm_id}",
                          'id' => Helper.int_to_uuid(vm_id.to_i).to_s
                      }
                    }
                    return 200, body.to_json
                elsif status == 'up' && !poweroff_requested
                    rc = vm.poweroff(hard)
                    # The action is asynchronous; do not resubmit while it completes.
                    poweroff_requested = true
                end

                if OpenNebula.is_error?(rc)
                    LOGGER.error("Error trying to stop VM #{vm_id}: #{rc.message}")
                    job = JobsController.add_job('failed')
                    body = {
                        'job' => {
                            'href' => "/ovirt-engine/api/jobs/#{job['id']}",
                            'id' => job['id']
                        },
                      'status' => 'complete',
                      'vm' => {
                          'href' => "/ovirt-engine/api/vms/#{vm_id}",
                          'id' => Helper.int_to_uuid(vm_id.to_i).to_s
                      }
                    }
                    return 200, body.to_json
                end

                # Wait before checking again
                LOGGER.info("Retry #{retries}/#{max_retries}: Waiting" \
                    " #{retry_interval} seconds before checking VM status again")
                sleep(retry_interval)
            end
        end
    end

    # Poweroff a VM
    def self.poweroff_vm(client, vm_id)
        vm = get_one_vms(client, :vm_id => vm_id)

        one_hash = vm.to_hash
        status = get_vm_status(one_hash['VM']['STATE'].to_i, one_hash['VM']['LCM_STATE'].to_i)

        if status == 'up'
            rc = vm.poweroff(false)
        else
            return 409, {
                'fault' => {
                    'detail' => "[Cannot stop VM because the VM is in #{status} status.]",
                  'reason' => 'Operation Failed'
                },
              'status' => 'failed'
            }
        end

        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return 500, Helper.fault_response("Error: #{rc.message}")
        end
        return 200, {}
    end

    # Create a VM from a fake OVF template
    def self.create_vm_from_template(client, vm_template, cluster_id, name)
        xml_element = OpenNebula::XMLElement.new
        xml_element.initialize_xml(vm_template, 'VM')

        xml_element.add_element('TEMPLATE', 'NAME' => name)
        xml_element.add_element('TEMPLATE',
                                'SCHED_REQUIREMENTS' => 'CLUSTER_ID=' \
                                    "\"#{Helper.uuid_to_int(cluster_id)}\"")

        # Extract the disk prefix to keep it during restore
        disk_dev_prefixes = []
        xml_element.each('TEMPLATE/DISK') do |disk_xml|
            dev_prefix = disk_xml['TARGET']
            unless dev_prefix.nil?
                # add the first 2 letters of the dev_prefix to the array
                disk_dev_prefixes << dev_prefix[0, 2]
            end
        end
        LOGGER.info("Disk DEV_PREFIXes: #{disk_dev_prefixes.join(', ')}")

        xml_element.delete_element('TEMPLATE/NIC')
        xml_element.delete_element('TEMPLATE/DISK')
        xml_element.delete_element('TEMPLATE/GRAPHICS')
        xml_element.delete_element('TEMPLATE/OS/BOOT')
        xml_element.delete_element('TEMPLATE/VMID')
        xml_element.delete_element('TEMPLATE/OS/UUID')

        new_template_graphics_element = {
            'GRAPHICS' => {
                'TYPE'   => 'vnc',
                'LISTEN' => '0.0.0.0'
            }
        }
        xml_element.add_element('TEMPLATE', new_template_graphics_element)

        # Create vm
        vm = OpenNebula::VirtualMachine.new(OpenNebula::VirtualMachine.build_xml, client)
        rc = vm.allocate(xml_element.template_str)
        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return 500, Helper.fault_response("Error: #{rc.message}")
        end

        (1..12).each do |_|
            sleep 5
            begin
                rc = vm.info
                if OpenNebula.is_error?(rc)
                    LOGGER.error "Error retrieving VM: #{rc.message}"
                    return 500, Helper.fault_response("Error retrieving VM: #{rc.message}")
                end
                vm_hash = vm.to_hash
                break if get_vm_status(vm_hash['VM']['STATE'].to_i,
                                       vm_hash['VM']['LCM_STATE'].to_i) == 'up'
            rescue StandardError
            end
        end

        # Change owner of the VM
        uid = xml_element['TEMPLATE/AS_UID']
        gid = xml_element['TEMPLATE/AS_GID']
        rc = vm.info
        if OpenNebula.is_error?(rc)
            LOGGER.error "Error retrieving VM: #{rc.message}"
            return 500, Helper.fault_response("Error retrieving VM: #{rc.message}")
        end

        if uid && gid
            vm.chown(uid.to_i, gid.to_i)
            rc = vm.info
            if OpenNebula.is_error?(rc)
                LOGGER.error "Error retrieving VM: #{rc.message}"
                return 500, Helper.fault_response("Error retrieving VM: #{rc.message}")
            end
        end

        # Add disk prefix array into the VM user template
        unless disk_dev_prefixes.empty?
            new_template = <<-EOT
            DISK_DEV_PREFIXES = "#{disk_dev_prefixes.join(',')}"
            EOT
            vm.update(new_template, true)
            rc = vm.info
            if OpenNebula.is_error?(rc)
                LOGGER.error "Error retrieving VM: #{rc.message}"
                return 500, Helper.fault_response("Error retrieving VM: #{rc.message}")
            end
        end

        stop_vm(client, vm.id)

        return onevm_to_ovirtvm(client, vm)
    end

    # Create a VM template from scratch
    # Used by Veeam when creating the KVM appliance
    def self.create_template(body)
        # Convert the body to a standard hash with string keys first for consistent access.
        body_hash = JSON.parse(body.to_json)

        cloud_config_script = body_hash.dig('initialization', 'custom_script')

        context_block = ''
        veeam_worker = 'VEEAM_WORKER="False"'
        worker_ip_line = ''

        if cloud_config_script && !cloud_config_script.empty?
            cloud_config_encoded = Base64.encode64(cloud_config_script)
            context_block = <<-CONTEXT_BLOCK
        CONTEXT = [
            USERDATA_ENCODING = "base64",
            USER_DATA = "#{cloud_config_encoded}"
        ]
            CONTEXT_BLOCK
            veeam_worker = 'VEEAM_WORKER="True"'

            # Check if networking is configured with static IP (dhcp: false)
            if cloud_config_script =~ /dhcp:\s*false/i
                # Keep static addresses in the same order as the worker's networks.
                # rubocop:disable-next Layout/LineLength
                worker_ips = cloud_config_script.scan(/dhcp:\s*false[\s\S]*?ip:\s*["']?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})["']?/i).flatten
                unless worker_ips.empty?
                    worker_ip_line = "WORKER_IP = \"#{worker_ips.join(',')}\"\n"
                end
            end
        end

        # --- BIOS/UEFI Mapping Logic ---
        ovirt_bios_type = body_hash.dig('bios', 'type')

        # Set default values
        opennebula_firmware = 'UEFI'
        opennebula_machine = 'q35'
        secure_boot_line = ''

        case ovirt_bios_type
        when 'i440fx_sea_bios'
            opennebula_firmware = 'BIOS'
            opennebula_machine = 'pc-i440fx-6.2'
        when 'q35_sea_bios'
            opennebula_firmware = 'BIOS'
            opennebula_machine = 'q35'
        when 'q35_ovmf'
            opennebula_firmware = 'UEFI'
            opennebula_machine = 'q35'
        when 'q35_secure_boot'
            opennebula_firmware = 'UEFI'
            opennebula_machine = 'q35'
            # OpenNebula handles Secure Boot as a separate flag
            secure_boot_line = ",\n    SECURE_BOOT = \"YES\""
        end

        <<~TEMPLATE
                    NAME = "#{body_hash['name']}"
                    CPU_MODEL = [
                        MODEL = "host-passthrough"
                    ]
                    CPU = "#{body_hash['cpu']['topology']['sockets']}"
                    VCPU = "#{body_hash['cpu']['topology']['sockets']}"
                    MEMORY = "#{body_hash['memory']/(1024*1024)}"
                    SCHED_REQUIREMENTS = "CLUSTER_ID = #{Helper.uuid_to_int(body_hash['cluster']['id'])}"
                    GRAPHICS = [
                        LISTEN = "0.0.0.0",
                        TYPE = "vnc" ]
                    OS = [
                        ARCH = "x86_64",
                        FIRMWARE = "#{opennebula_firmware}",
                        MACHINE = "#{opennebula_machine}"
            #{secure_boot_line}
                    ]
                    #{veeam_worker}
                    #{worker_ip_line}#{context_block}
        TEMPLATE
    end

    def self.create_vm_from_text_template(client, text_template_str, disk_prefix)
        vm = OpenNebula::VirtualMachine.new(OpenNebula::VirtualMachine.build_xml, client)
        rc = vm.allocate(text_template_str)

        if OpenNebula.is_error?(rc)
            LOGGER.error("Error allocating OVF VM: #{rc.message}")
            return 500, Helper.fault_response("Error: #{rc.message}")
        end

        (1..12).each do |_|
            sleep 5
            begin
                rc = vm.info
                if OpenNebula.is_error?(rc)
                    LOGGER.error "Error retrieving VM: #{rc.message}"
                    return 500, Helper.fault_response("Error retrieving VM: #{rc.message}")
                end
                vm_hash = vm.to_hash
                break if get_vm_status(vm_hash['VM']['STATE'].to_i,
                                       vm_hash['VM']['LCM_STATE'].to_i) == 'up'
            rescue StandardError
            end
        end

        # --- Apply DISK_DEV_PREFIXES to the VM ---
        new_user_template = <<-EOT
            DISK_DEV_PREFIXES = "#{disk_prefix}"
        EOT
        vm.update(new_user_template, true)

        rc = vm.info
        if OpenNebula.is_error?(rc)
            LOGGER.error "Error retrieving VM after updating prefix: #{rc.message}"
            return 500, Helper.fault_response("Error retrieving VM: #{rc.message}")
        end

        stop_vm(client, vm.id)

        return onevm_to_ovirtvm(client, vm)
    end

    def self.create_template_from_ovf(ovf_xml, cluster_id)
        doc = REXML::Document.new(ovf_xml)

        name = doc.elements["//*[local-name()='Content']" \
            "/*[local-name()='Name']"]&.text || 'Imported-VM'
        cpu_element = doc.elements["//*[local-name()='Item'][*[local-name()='ResourceType']" \
            "='3']/*[local-name()='VirtualQuantity']"]
        cpu = cpu_element ? cpu_element.text : '1'
        memory_element = doc.elements["//*[local-name()='Item'][*[local-name()='ResourceType']" \
            "='4']/*[local-name()='VirtualQuantity']"]
        memory_mb = memory_element ? memory_element.text : '1024'
        bios_type = doc.elements["//*[local-name()='Content']/*[local-name()='BiosType']"]&.text

        # --- Extract OS Type for DISK_DEV_PREFIXES ---
        # We look for the Section where the Info tag says 'Guest Operating System'
        # and grab its Description
        os_element = doc.elements["//*[local-name()='Section'][*[local-name()='Info']='" \
            "Guest Operating System']/*[local-name()='Description']"]
        os_type = os_element ? os_element.text.to_s.downcase : ''
        disk_prefix = os_type.include?('windows') ? 'hd' : 'sd'

        opennebula_firmware = 'UEFI'
        opennebula_machine = 'q35'
        secure_boot_line = ''

        case bios_type
        when '0'
            opennebula_firmware = 'BIOS'
            opennebula_machine = 'pc-i440fx-6.2'
        when '1'
            opennebula_firmware = 'BIOS'
            opennebula_machine = 'q35'
        when '2'
            opennebula_firmware = 'UEFI'
            opennebula_machine = 'q35'
        when '3'
            opennebula_firmware = 'UEFI'
            opennebula_machine = 'q35'
            secure_boot_line = ",\n        SECURE_BOOT = \"YES\""
        end

        template_str = <<~TEMPLATE
            NAME = "#{name}"
            CPU_MODEL = [
                MODEL = "host-passthrough"
            ]
            CPU = "#{cpu}"
            VCPU = "#{cpu}"
            MEMORY = "#{memory_mb}"
            SCHED_REQUIREMENTS = "CLUSTER_ID = #{Helper.uuid_to_int(cluster_id)}"
            GRAPHICS = [
                LISTEN = "0.0.0.0",
                TYPE = "vnc" ]
            OS = [
                ARCH = "x86_64",
                FIRMWARE = "#{opennebula_firmware}",
                MACHINE = "#{opennebula_machine}"#{secure_boot_line}
            ]
        TEMPLATE

        # Return an array containing both the template string and the prefix we calculated
        return [template_str, disk_prefix]
    end

    # Create a VM from scratch
    # Used by Veeam when creating the KVM appliance
    def self.create_vm(client, body)
        one_template = create_template(body)

        vm = OpenNebula::VirtualMachine.new(OpenNebula::VirtualMachine.build_xml, client)
        rc = vm.allocate(one_template)
        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return {}
        end
        sleep 5
        (1..12).each do |_|
            begin
                vm.info
                vm_hash = vm.to_hash
                break if get_vm_status(vm_hash['VM']['STATE'].to_i,
                                       vm_hash['VM']['LCM_STATE'].to_i) == 'up'

                sleep 5
            rescue StandardError
                sleep 5
            end
        end

        # Add DISK_DEV_PREFIXES to the VM user template with sd value
        os_type = body.dig('os', 'type')

        # Default to "sd", then check if OS type includes "windows"
        disk_prefix = 'sd'
        if os_type && os_type.include?('windows')
            disk_prefix = 'hd'
        end

        # Add DISK_DEV_PREFIXES to the VM user template
        new_template = <<-EOT
            DISK_DEV_PREFIXES = "#{disk_prefix}"
        EOT
        vm.update(new_template, true)
        rc = vm.info
        if OpenNebula.is_error?(rc)
            LOGGER.error "Error retrieving VM: #{rc.message}"
            return 500, Helper.fault_response("Error retrieving VM: #{rc.message}")
        end

        stop_vm(client, vm.id)

        return onevm_to_ovirtvm(client, vm)
    end

    MOCK_SNAPSHOT_PREFIX = 'OVIRTAPI_SNAPSHOT_'

    def self.snapshot_fault(action, error)
        LOGGER.error("Snapshot #{action} failed: #{error.message}")
        return 409, Helper.fault_response("Unable to #{action} snapshot: #{error.message}")
    end

    def self.mock_snapshot_attribute(snap_id)
        return unless snap_id.to_s.match?(/\A[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\z/i)

        MOCK_SNAPSHOT_PREFIX + snap_id.delete('-').upcase
    end

    def self.mock_snapshots(vm_hash)
        user_template = vm_hash.dig('VM', 'USER_TEMPLATE') || {}
        records = {}
        user_template.each do |attribute, encoded|
            next unless attribute.match?(/\AOVIRTAPI_SNAPSHOT_[0-9A-F]{32}\z/)
            next if encoded.to_s.empty?

            record = JSON.parse(Base64.strict_decode64(encoded))
            unless record.is_a?(Hash) && mock_snapshot_attribute(record['id']) == attribute
                raise JSON::ParserError, 'invalid mock snapshot record'
            end

            records[record['id']] = record
        end

        records
    rescue ArgumentError, JSON::ParserError => e
        raise LookupError.new(500, "Invalid mock snapshot metadata: #{e.message}")
    end

    def self.save_mock_snapshot(vm, snap_id, record)
        attribute = mock_snapshot_attribute(snap_id)
        value = record ? Base64.strict_encode64(JSON.generate(record)) : ''
        rc = vm.update("#{attribute}=\"#{value}\"", true)
        return snapshot_fault('save mock', rc) if OpenNebula.is_error?(rc)

        nil
    end

    # rubocop:disable-next Metrics/ParameterLists
    def self.snapshot_response(vm_id, snap_id, description, date, status = 'ok', vm_template: nil)
        vm_uuid = Helper.int_to_uuid(vm_id.to_i).to_s
        response = {
            'date' => date.to_i,
            'persist_memorystate' => 'false',
            'snapshot_status' => status,
            'snapshot_type' => 'regular',
            'href' => "/ovirt-engine/api/vms/#{vm_uuid}/snapshots/#{snap_id}",
            'id' => snap_id,
            'description' => description,
            'vm' => {
                'href' => "/ovirt-engine/api/vms/#{vm_uuid}",
                'id' => vm_uuid
            }
        }
        if vm_template
            response['initialization'] = {
                'configuration' => {
                    'data' => '<?xml version="1.0" encoding="UTF-8"?><VM>' + vm_template + '</VM>',
                    'type' => 'ovf'
                }
            }
        end
        response
    end

    def self.take_snapshot(client, vm_id, description)
        vm = get_one_vms(client, :vm_id => vm_id)
        snap_id = SecureRandom.uuid
        date = Time.now.to_i
        record = {
            'id' => snap_id,
            'vm_id' => vm_id,
            'description' => description,
            'date' => date
        }
        error = save_mock_snapshot(vm, snap_id, record)
        return error if error

        return 201, snapshot_response(vm_id, snap_id, description, date, 'locked',
                                      :vm_template => vm.template_xml)
    end

    def self.get_snapshot(client, vm_id, snap_id)
        vm_hash = get_one_vms(client, :vm_id => vm_id).to_hash
        record = mock_snapshots(vm_hash)[snap_id]
        if record && record['vm_id'] == vm_id.to_i
            return 200, snapshot_response(vm_id, snap_id, record['description'], record['date'])
        end

        raise LookupError.new(404, "Resource #{snap_id} not found")
    end

    def self.delete_snapshot(client, vm_id, snap_id)
        vm = get_one_vms(client, :vm_id => vm_id)
        record = mock_snapshots(vm.to_hash)[snap_id]
        unless record && record['vm_id'] == vm_id.to_i
            raise LookupError.new(404, "Resource #{snap_id} not found")
        end

        error = save_mock_snapshot(vm, snap_id, nil)
        return error if error

        job = JobsController.add_job('finished')
        return 200, {
            'job' => {
                'href' => "/ovirt-engine/api/jobs/#{job['id']}",
                'id' => job['id']
            },
          'status' => 'complete'
        }
    end

    # Delete VM
    def self.terminate_vm(client, vm_id, detach_only)
        rc = nil
        vm_hash = nil
        (1..360).each do |attempt|
            vm = get_one_vms(client, :vm_id => vm_id)
            vm_hash = vm.to_hash

            rc = vm.terminate(true)
            if !OpenNebula.is_error?(rc)
                LOGGER.info("VM #{vm_id} terminated successfully.")
                break
            end
            LOGGER.info("Terminate VM #{vm_id}: attempt #{attempt}/360 failed...")
            sleep 5
        end

        if OpenNebula.is_error?(rc)
            LOGGER.error "Error terminating VM: #{rc.message}"
            return 500, Helper.fault_response("Error retrieving VM: #{rc.message}")
        end

        return if detach_only

        disks = vm_hash['VM']['TEMPLATE']['DISK']
        return if disks.nil? || disks.empty?

        if disks.is_a?(Hash)
            disks = [disks]
        end
        disks.each do |disk|
            # process persistent disks
            next unless disk['PERSISTENT'] == 'YES'

            (1..360).each do |attempt|
                image_id = disk['IMAGE_ID']
                image = DiskController.get_onedisks(client, image_id)
                if image.nil?
                    LOGGER.info("Image #{image_id} unavailable; skipping deletion.")
                    break
                end

                rc = image.delete
                if !OpenNebula.is_error?(rc)
                    LOGGER.info("Image #{image_id} deleted successfully.")
                    break
                end
                LOGGER.info("Delete image #{image_id}:" \
                        " attempt #{attempt}/360 failed...")
                sleep 5
            end
        end

        nil
    end

    # Update VM
    # Currently the only thing it does is remove the cloud-config
    def self.update_vm(client, vm_id, _params)
        vm = get_one_vms(client, :vm_id => vm_id)

        new_template = <<-EOT
      CONTEXT = [
        USER_DATA = ""
      ]
        EOT

        rc = vm.updateconf(new_template, true)

        if OpenNebula.is_error?(rc)
            LOGGER.error("Error: #{rc.message}")
            return 500, Helper.fault_response("Error: #{rc.message}")
        end

        vm.info

        return onevm_to_ovirtvm(client, vm)
    end

    def self.get_ovirt_snapshots(client, vm_id)
        vm_hash = get_one_vms(client, :vm_id => vm_id).to_hash
        snapshots = []
        mock_snapshots(vm_hash).each do |snap_id, record|
            next unless record['vm_id'] == vm_id.to_i

            snapshots << snapshot_response(vm_id, snap_id, record['description'], record['date'])
        end

        return 200, { 'snapshot' => snapshots }
    end

end
