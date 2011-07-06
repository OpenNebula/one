module WatchHelper
    require 'yaml'

    ONE_LOCATION=ENV["ONE_LOCATION"]

    if !ONE_LOCATION
        ACCTD_CONF="/etc/one/acctd.conf"
    else
        ACCTD_CONF=ONE_LOCATION+"/etc/acctd.conf"
    end

    CONF = YAML.load_file(ACCTD_CONF)

    DB = Sequel.connect(CONF[:DB])

    VM_SAMPLE = {
        :cpu => {
            :type => Integer,
            :path => 'CPU'
        },
        :memory => {
            :type => Integer,
            :path => 'MEMORY'
        },
        :net_tx => {
            :type => Integer,
            :path => 'NET_TX'
        },
        :net_rx => {
            :type => Integer,
            :path => 'NET_RX'
        }
    }

    HOST_SAMPLE = {
        :disk_usage => {
            :type => Integer,
            :path => 'DISK_USAGE'
        },
        :mem_usage => {
            :type => Integer,
            :path => 'MEM_USAGE'
        },
        :cpu_usage => {
            :type => Integer,
            :path => 'CPU_USAGE'
        },
        :max_disk => {
            :type => Integer,
            :path => 'MAX_DISK'
        },
        :max_mem => {
            :type => Integer,
            :path => 'MAX_MEM'
        },
        :mem_cpu => {
            :type => Integer,
            :path => 'MAX_CPU'
        },
        :free_disk => {
            :type => Integer,
            :path => 'FREE_DISK'
        },
        :free_mem => {
            :type => Integer,
            :path => 'FREE_MEM'
        },
        :free_cpu => {
            :type => Integer,
            :path => 'FREE_CPU'
        },
        :used_disk => {
            :type => Integer,
            :path => 'USED_DISK'
        },
        :used_mem => {
            :type => Integer,
            :path => 'USED_MEM'
        },
        :used_cpu => {
            :type => Integer,
            :path => 'USED_CPU'
        },
        :rvms => {
            :type => Integer,
            :path => 'RUNNING_VMS'
        }
    }

    class VmSample < Sequel::Model
        plugin :schema

        set_schema do
            foreign_key :vm_id, :vms
            Integer :state
            Integer :lcm_state
            Integer :last_poll
            Integer :timestamp

            VM_SAMPLE.each { |key,value|
                column key, value[:type]
            }

            primary_key [:vm_id, :timestamp]
        end

        create_table unless table_exists?

        unrestrict_primary_key

        many_to_one :vm

        def self.create_from_vm(vm, timestamp)
            hash = {
                :timestamp  => timestamp,
                :last_poll  => vm['LAST_POLL'],
                :state      => vm['STATE'],
                :lcm_state  => vm['LCM_STATE'],
            }

            VM_SAMPLE.each { |key,value|
                hash[key] = vm[value[:path]]
            }

            VmSample.create(hash)
        end

        def self.active
            self.filter(:state=>3)
        end

        def self.error
            self.filter(:state=>7)
        end
    end

    class HostSample < Sequel::Model
        plugin :schema

        set_schema do
            foreign_key :host_id, :hosts
            Integer :last_poll
            Integer :timestamp
            Integer :state

            HOST_SAMPLE.each { |key,value|
                column key, value[:type]
            }

            primary_key [:host_id, :timestamp]
        end

        create_table unless table_exists?

        unrestrict_primary_key

        many_to_one :host

        def self.create_from_host(host, timestamp)
            hash = {
                :timestamp  => timestamp,
                :last_poll  => host['LAST_MON_TIME'],
                :state      => host['STATE'],
            }

            host_share = host['HOST_SHARE']
            HOST_SAMPLE.each { |key,value|
                hash[key] = host_share[value[:path]]
            }

            HostSample.create(hash)
        end

        def self.active
            self.filter(:state<3)
        end

        def self.error
            self.filter(:state=>3)
        end
    end

    class Register < Sequel::Model
        plugin :schema

        set_schema do
            foreign_key :vm_id, :vms
            Integer     :hid
            String      :hostname
            Integer     :seq
            Integer     :pstime
            Integer     :petime
            Integer     :rstime
            Integer     :retime
            Integer     :estime
            Integer     :eetime
            Integer     :reason

            primary_key [:vm_id, :seq]
        end

        create_table unless table_exists?

        unrestrict_primary_key

        many_to_one :vm

        def update_from_history(history)
            self.seq      = history['SEQ']
            self.hostname = history['HOSTNAME']
            self.hid      = history['HID']
            self.pstime   = history['PSTIME']
            self.petime   = history['PETIME']
            self.rstime   = history['RSTIME']
            self.retime   = history['RETIME']
            self.estime   = history['ESTIME']
            self.eetime   = history['EETIME']
            self.reason   = history['REASON']

            self.save
        end

        def self.create_from_history(history)
            a = Register.create(
                :seq      => history['SEQ'],
                :hostname => history['HOSTNAME'],
                :hid      => history['HID'],
                :pstime   => history['PSTIME'],
                :petime   => history['PETIME'],
                :rstime   => history['RSTIME'],
                :retime   => history['RETIME'],
                :estime   => history['ESTIME'],
                :eetime   => history['EETIME'],
                :reason   => history['REASON']
            )
        end
    end

    class Delta < Sequel::Model
        plugin :schema

        set_schema do
            foreign_key :vm_id, :vms
            Integer     :timestamp
            Integer     :ptimestamp
            Integer     :net_rx
            Integer     :net_tx

            primary_key [:vm_id, :timestamp]
        end

        create_table unless table_exists?

        unrestrict_primary_key

        many_to_one :vm
    end

    class Vm < Sequel::Model
        plugin :schema

        set_schema do
            Integer :id, :primary_key=>true
            String  :name
            Integer :uid
            Integer :gid
            Integer :mem
            Integer :cpu
            Integer :vcpu
            Integer :stime
            Integer :etime
        end

        create_table unless table_exists?

        unrestrict_primary_key

        # Accounting
        one_to_many :registers, :order=>:seq
        one_to_many :deltas

        # Monitoring
        one_to_many :samples, :before_add=>:control_regs, :order=>:timestamp, :class=>VmSample

        def self.info(vm)
            Vm.find_or_create(:id=>vm['ID']) { |v|
                v.name  = vm['NAME']
                v.uid   = vm['UID'].to_i
                v.gid   = vm['GID'].to_i
                v.mem   = vm['MEMORY'].to_i
                v.cpu   = vm['CPU'].to_i
                v.vcpu  = vm['VCPU'].to_i
                v.stime = vm['STIME'].to_i
                v.etime = vm['ETIME'].to_i
            }
        end

        def add_sample_from_resource(vm, timestamp)
            vs = VmSample.create_from_vm(vm, timestamp)
            self.add_sample(vs)
        end

        private

        def control_regs(sample)
            if self.samples.count > CONF[:WINDOW_SIZE] - 1
                self.samples.first.delete
            end
        end
    end

    class Host < Sequel::Model
        plugin :schema

        set_schema do
            Integer :id, :primary_key=>true
            String  :name
            String  :im_mad
            String  :vm_mad
            String  :tm_mad
        end

        create_table unless table_exists?

        unrestrict_primary_key

        # Monitoring
        one_to_many :samples, :before_add=>:control_regs, :order=>:timestamp, :class=>HostSample

        def self.info(host)
            Host.find_or_create(:id=>host['ID']) { |h|
                h.name   = host['NAME']
                h.im_mad = host['IM_MAD']
                h.vm_mad = host['VM_MAD']
                h.tm_mad = host['TM_MAD']
            }
        end

        def add_sample_from_resource(host, timestamp)
            hs = HostSample.create_from_host(host, timestamp)
            self.add_sample(hs)
        end

        private

        def control_regs(sample)
            if self.samples.count > CONF[:WINDOW_SIZE] - 1
                self.samples.first.delete
            end
        end
    end
end
