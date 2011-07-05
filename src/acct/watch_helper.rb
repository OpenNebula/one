module WatchHelper
    DB = Sequel.connect('sqlite:///tmp/test_one_acct.db')

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
    
    class Metric < Sequel::Model
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
        one_to_many :metrics
        
        # Monitoring
        one_to_many :vm_shares, :before_add=>:control_regs, :order=>:timestamp
        
        def self.info(vm)
            Vm.find_or_create(:id=>vm['ID']) { |v|
                v.uid   = vm['UID'].to_i
                v.name  = vm['NAME']
                v.gid   = vm['GID'].to_i
                v.mem   = vm['MEMORY'].to_i
                v.cpu   = vm['CPU'].to_i
                v.vcpu  = vm['VCPU'].to_i
                v.stime = vm['STIME'].to_i
                v.etime = vm['ETIME'].to_i
            }
        end
        
        def add_share(vm, timestamp)
            vs = VmShare.create_from_vm(vm, timestamp)
            self.add_vm_share(vs)
        end
        
        private
        
        def control_regs(share)
            if self.vm_shares.count > 4
                self.vm_shares.first.delete
            end
        end
    end
    
    class Host < Sequel::Model
        plugin :schema
        
        set_schema do
            Integer :id, :primary_key=>true
            String  :name
            Integer :im_mad
            Integer :vm_mad
            Integer :tm_mad
        end

        create_table unless table_exists?
        
        unrestrict_primary_key
        
        # Monitoring
        one_to_many :host_shares, :before_add=>:control_regs, :order=>:timestamp
        
        def add_share(host, timestamp)
            hs = HostShare.create_from_host(host, timestamp)
            self.add_host_share(hs)
        end
        
        private
        
        def control_regs(share)
            if self.host_shares.count > 4
                self.host_shares.first.delete
            end
        end
    end
    
    HOST_SHARE = {
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

    class HostShare < Sequel::Model
        plugin :schema
        
        set_schema do
            foreign_key :host_id, :hosts
            Integer :last_poll
            Integer :timestamp

            HOST_SHARE.each { |key,value|
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
            HOST_SHARE.each { |key,value|
                hash[key] = host_share[value[:path]]
            }
            
            HostShare.create(hash)
        end
    end
    
    VM_SHARE = {
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
    
    class VmShare < Sequel::Model
        plugin :schema
        
        set_schema do
            foreign_key :vm_id, :vms
            Integer :state
            Integer :lcm_state
            Integer :last_poll
            Integer :timestamp
            
            VM_SHARE.each { |key,value|
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
            
            VM_SHARE.each { |key,value|
                hash[key] = vm[value[:path]]
            }
            
            VmShare.create(hash)
        end
    end
end
    