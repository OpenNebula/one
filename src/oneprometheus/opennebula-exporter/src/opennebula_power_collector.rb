# frozen_string_literal: true

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

require 'opennebula'

#   This class allows the opennebula prometheus collector to get power
#   consumption data. It requires scaphandre running on each host, that
#   the host has the `SCAPHANDRE_PORT` variable added. For the VMs to
#   report each process consumption, it requires a command on VMs that
#   gets each process number of CPU ticks per unit of time.
class OpenNebulaPowerCollector

    HOST_LABELS = [:one_host_id]
    VM_LABELS = [:one_vm_id]
    VMPROC_LABELS = [:one_vm_id] + [:proc_pid] + [:proc_name]

    # --------------------------------------------------------------------------
    # Host power metrics
    # --------------------------------------------------------------------------
    #   - opennebula_host_power_consumption_uW
    # --------------------------------------------------------------------------
    HOST_POWER_METRICS = {
        'host_power_consumption_uW' => {
            :type   => :gauge,
            :docstr => 'Scaphandre power usage per host uW',
            :labels => HOST_LABELS
        }
    }

    # --------------------------------------------------------------------------
    # VM power metrics
    # --------------------------------------------------------------------------
    #   - opennebula_vm_power_consumption_uW
    # --------------------------------------------------------------------------

    VM_POWER_METRICS = {
      'vm_power_consumption_uW' => {
          :type   => :gauge,
          :docstr => 'Scaphandre power usage per vm uW',
          :labels => VM_LABELS
        }
    }

    # --------------------------------------------------------------------------
    # VM proc power metrics
    # --------------------------------------------------------------------------
    #   - opennebula_vmproc_power_consumption_uW
    # --------------------------------------------------------------------------
    DEFAULT_PROC_INTERVAL = 5
    DEFAULT_PROC_OVERHEAD = 0.1
    DEFAULT_PROC_TICKER = '/var/lib/one-context/get_proc_ticks'

    VMPROC_POWER_METRICS = {
        'vmproc_power_consumption_uW' => {
            :type   => :gauge,
            :docstr => 'VM process estimated power usage',
            :labels => VMPROC_LABELS
        }
    }

    VMPROC_PERCENT_METRICS = {
        'vmproc_cpu_time_percent' => {
            :type   => :gauge,
            :docstr => 'VM process CPU time percent',
            :labels => VMPROC_LABELS
        }
    }

    class << self
        attr_accessor :scaph_data
    end

    def get_scaph_metrics(host, port, seconds = 2)
        hostname = String(host['NAME'])
        Timeout.timeout(seconds) do
            begin
                TCPSocket.new(hostname, port).close
                begin
                    res = Net::HTTP.get(hostname, '/metrics', port)
                    self.class.scaph_data[host['ID'].to_i] = res.split("\n")
                rescue StandardError => e
                    puts e.message
                    puts "Error accessing to scaphandre metrics on #{hostname}"
                end
            rescue Errno::ECONNREFUSED, Errno::EHOSTUNREACH
                puts "Error on #{hostname}:#{port}, is scaphandre running there?"
            end
        rescue Timeout::Error
            false
        end
    end

    def query_vm_agent(vm_id, query, host = 'localhost')
        cmd = "virsh -c 'qemu+ssh://#{host}/system' qemu-agent-command one-#{vm_id} '#{query.to_json}'"
        out = `#{cmd}`
        JSON.parse(out)
    end

    def issue_command(vm_id, host, cmd, args)
        query_processes = { :execute => 'guest-exec',
                            :arguments => { :path => cmd, :arg => args.split,
                                            :'capture-output' => true } }
        begin
            out = query_vm_agent(vm_id, query_processes, host)
            out['return']['pid']
        rescue StandardError
            -1
        end
    end

    def retrieve_stdout_command(vm_id, pid, host)
        query_get_stdout = { 'execute'   => 'guest-exec-status',
                             'arguments' => { 'pid' => pid } }
        out = query_vm_agent(vm_id, query_get_stdout, host)

        begin
            Base64.decode64(out['return']['out-data'])
        rescue StandardError
            ''
        end
    end

    def get_proc_consumption(vm_id, host = localhost, full_power = 0)
        interval = DEFAULT_PROC_INTERVAL
        overhead = DEFAULT_PROC_OVERHEAD
        cmd = DEFAULT_PROC_TICKER

        pid_cmd = issue_command(vm_id, host, cmd, "-s #{interval} -m #{vm_id} -p #{full_power}")
    rescue StandardError
        puts "Error executing command on VM #{vm_id}"
    else
        sleep interval + overhead

        unless pid_cmd == -1
            procs_info = retrieve_stdout_command(vm_id, pid_cmd, host)
        end
        return unless procs_info

        procs_info.each_line do |l|
            vm_id, vm_proc, vm_cmd, power, percent = l.split("\|")

            VMPROC_POWER_METRICS.each_key do |name|
                labels = { :one_vm_id => vm_id,
                           :proc_pid  => vm_proc,
                           :proc_name => vm_cmd }

                metric = @metrics[name]

                metric.set(power.to_i, :labels => labels)
            end

            VMPROC_PERCENT_METRICS.each_key do |name|
                labels = { :one_vm_id => vm_id,
                           :proc_pid  => vm_proc,
                           :proc_name => vm_cmd }

                metric = @metrics[name]

                metric.set(percent.to_i, :labels => labels)
            end

        end
    end

    def initialize(registry, client, namespace)
        @client  = client
        @metrics = {}

        [HOST_POWER_METRICS, VM_POWER_METRICS, VMPROC_POWER_METRICS, VMPROC_PERCENT_METRICS].each do |m|
            m.each do |name, conf|
                @metrics[name] = registry.method(conf[:type]).call(
                    "#{namespace}_#{name}".to_sym,
                    :docstring => conf[:docstr],
                    :labels    => conf[:labels]
                )
            end
        end
    end

    def collect
        self.class.scaph_data = {}

        host_pool = OpenNebula::HostPool.new(@client)
        rc        = host_pool.info_all!

        raise rc.message if OpenNebula.is_error?(rc)

        hosts = host_pool.retrieve_xmlelements('/HOST_POOL/HOST')

        # Get Host power
        hosts.each do |host|
            scaph_port = host['TEMPLATE/SCAPHANDRE_PORT'].to_i
            next unless scaph_port != 0

            get_scaph_metrics(host, scaph_port)
            labels = { :one_host_id => Integer(host['ID']) }
            HOST_POWER_METRICS.each_key do |name|
                metric = @metrics[name]
                next unless metric
                power = self.class.scaph_data[Integer(host['ID'])]\
                            .grep(/^scaph_host_power_microwatts [0-9]+/)[0].split(' ')[-1]

                metric.set(power.to_i, :labels => { :one_host_id => host['ID'] })
            end
        end

        # Get VM power and, if DEFAULT_PROC_TICKER exists, power per VM process

        vm_pool = OpenNebula::VirtualMachinePool.new(@client)
        rc      = vm_pool.info_all!

        raise rc.message if OpenNebula.is_error?(rc)

        threads = []
        vms = vm_pool.retrieve_xmlelements('/VM_POOL/VM')

        vms.each do |vm|
            # get power info per VM
            host = vm['HISTORY_RECORDS/HISTORY[last()]/HID'].to_i
            next unless host_pool.retrieve_xmlelements("HOST[ID=#{host}]/TEMPLATE/SCAPHANDRE_PORT")

            power_regex = /^scaph_process_power_consumption_microwatts.*nameguest=one-#{vm['ID']},/
            hostname = vm['HISTORY_RECORDS/HISTORY[last()]/HOSTNAME'].to_s

            power = self.class.scaph_data[host].grep(power_regex)[0].to_s.split[-1]
            next unless power # No scaphandre data for this host

            VM_POWER_METRICS.each_key do |name|
                metric = @metrics[name]
                next unless metric

                metric.set(power.to_i, :labels => { :one_vm_id => vm['ID'] })
            end

            begin
                threads << Thread.new do
                    get_proc_consumption(Integer(vm['ID']), hostname, power)
                end
            rescue StandardError => e
                puts e.message
                puts "Couldn't execute command on host #{host}-#{hostname} vm #{vm['ID']}"
            end
        end
    end

end
