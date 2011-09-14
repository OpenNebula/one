$: << '.'

require 'helper/test_helper.rb'

describe "VM Monitoring tests" do
    before(:all) do
        clean_db

        @mock_client = MockClient.new
        @monitoring  = OneWatch::VmMonitoring.new

        #@watch_client = OneWatchClient::WatchClient.new

        @db = WatchHelper::DB
        @db[:vms].count.should eql(0)
        @db[:vm_samples].count.should eql(0)
        @db[:vm_timestamps].count.should eql(0)
    end

    it "after monitoring an empty pool: 0 VMs, 0 Samples, 1 Timestamp" do
        ts1 = 100
        @monitoring.set_mock_timestamp(ts1)

        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(0)
        @db[:vm_samples].count.should eql(0)
        @db[:vm_timestamps].count.should eql(1)
    end

    it "after monitoring a pool of 1 VM: 1 VMs, 1 Samples, 2 Timestamp" do
        values = {
            :cpu => 80,
            :memory => 122,
            :net_tx => 200,
            :net_rx => 134,
            :last_poll => 1309275256,
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 0,
                :rstime => 0,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }
        
        @mock_client.add_vm(0, values)
        
        ts2 = 200
        @monitoring.set_mock_timestamp(ts2)
        
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(1)
        @db[:vm_samples].count.should eql(1)
        @db[:vm_timestamps].count.should eql(2)
    end
    
    it "after monitoring a pool of 1 VM: 1 VMs, 2 Samples, 3 Timestamp" do
        values = {
            :cpu => 80,
            :memory => 122,
            :net_tx => 200,
            :net_rx => 134,
            :last_poll => 1309275256,
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 0,
                :rstime => 0,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }
        
        @mock_client.add_vm(0, values)
        
        ts = 300
        @monitoring.set_mock_timestamp(ts)
        
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(1)
        @db[:vm_samples].count.should eql(2)
        @db[:vm_timestamps].count.should eql(3)
    end
    
    it "after monitoring a pool of 2 VM: 2 VMs, 4 Samples, 4 Timestamp" do
        values = {
            :cpu => 80,
            :memory => 122,
            :net_tx => 200,
            :net_rx => 134,
            :last_poll => 1309275256,
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 0,
                :rstime => 0,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }
        
        @mock_client.add_vm(1, values)
        
        ts = 400
        @monitoring.set_mock_timestamp(ts)
        
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(2)
        @db[:vm_samples].count.should eql(4)
        @db[:vm_timestamps].count.should eql(4)
    end
    
    it "after monitoring a pool of 2 VM: 2 VMs, 6 Samples, 5 Timestamp" do
        values = {
            :cpu => 80,
            :memory => 122,
            :net_tx => 200,
            :net_rx => 134,
            :last_poll => 1309275256,
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 0,
                :rstime => 0,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }
        
        @mock_client.add_vm(1, values)
        
        ts = 500
        @monitoring.set_mock_timestamp(ts)
        
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(2)
        @db[:vm_samples].count.should eql(6)
        @db[:vm_timestamps].count.should eql(5)
    end
    
    it "after monitoring a pool of 3 VM: 3 VMs, 9 Samples, 5 Timestamp" do
        values = {
            :cpu => 80,
            :memory => 122,
            :net_tx => 200,
            :net_rx => 134,
            :last_poll => 1309275256,
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 0,
                :rstime => 0,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }
        
        @mock_client.add_vm(2, values)
        
        ts = 600
        @monitoring.set_mock_timestamp(ts)
        
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(3)
        @db[:vm_samples].count.should eql(9)
        @db[:vm_timestamps].count.should eql(5)
    end
    
    it "after monitoring a pool of 3 VM: 3 VMs, 11 Samples, 5 Timestamp" do
        values = {
            :cpu => 80,
            :memory => 122,
            :net_tx => 200,
            :net_rx => 134,
            :last_poll => 1309275256,
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 0,
                :rstime => 0,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }
        
        @mock_client.add_vm(2, values)
        
        ts = 700
        @monitoring.set_mock_timestamp(ts)
        
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(3)
        @db[:vm_samples].count.should eql(11)
        @db[:vm_timestamps].count.should eql(5)
    end
    
    
    it "after monitoring a pool of 3 VM: 3 VMs, 13 Samples, 5 Timestamp" do
        values = {
            :cpu => 80,
            :memory => 122,
            :net_tx => 200,
            :net_rx => 134,
            :last_poll => 1309275256,
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 0,
                :rstime => 0,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }
        
        @mock_client.add_vm(2, values)
        
        ts = 800
        @monitoring.set_mock_timestamp(ts)
        
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(3)
        @db[:vm_samples].count.should eql(13)
        @db[:vm_timestamps].count.should eql(5)
    end
    
    it "after monitoring a pool of 4 VM: 4 VMs, 16 Samples, 5 Timestamp" do
        values = {
            :cpu => 80,
            :memory => 122,
            :net_tx => 200,
            :net_rx => 134,
            :last_poll => 1309275256,
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 0,
                :rstime => 0,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }
        
        @mock_client.add_vm(3, values)
        
        ts = 900
        @monitoring.set_mock_timestamp(ts)
        
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(4)
        @db[:vm_samples].count.should eql(15)
        @db[:vm_timestamps].count.should eql(5)
    end
    
    it "after (10)monitoring a pool of 4 VM: 4 VMs, 20 Samples, 5 Timestamp" do
        10.times { |i|
            ts = 1000+i*100
            @monitoring.set_mock_timestamp(ts)

            @monitoring.insert(create_vmpool_hash)
        }
        
        @db[:vms].count.should eql(4)
        @db[:vm_samples].count.should eql(20)
        @db[:vm_timestamps].count.should eql(5) 
    end
end