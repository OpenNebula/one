require 'rubygems'
require 'sequel'

ONE_LOCATION = ENV['ONE_LOCATION']
if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'OpenNebula'

$: << './helper'
$: << '.'
$: << '..'


require 'examples/acct_client'
require 'mock_client'

require 'accounting'
require 'monitoring'

module OneWatch
    class Accounting
        def set_mock_timestamp(t)
            @mock_timestamp = t
        end

        def generate_timestamp
            @mock_timestamp
        end
    end

    class Monitoring
        def set_mock_timestamp(t)
            @mock_timestamp = t
        end

        def generate_timestamp
            @mock_timestamp
        end
    end
end

def create_vmpool_hash
    @vm_pool = OpenNebula::VirtualMachinePool.new(@mock_client, -2)
    @vm_pool.info
    hash = @vm_pool.to_hash
end

def clean_db
    begin
        WatchHelper::Register.destroy
        WatchHelper::VmDelta.destroy
        WatchHelper::VmSample.destroy
        WatchHelper::HostSample.destroy
        WatchHelper::VmTimestamp.destroy
        WatchHelper::HostTimestamp.destroy
        WatchHelper::Vm.destroy
        WatchHelper::Host.destroy
    rescue Exception => e
        warn e.message
    end
end

def check_lines(*args)
    @db[:vms].count.should eql(args[0])
    @db[:registers].count.should eql(args[1])
end
