require 'helper/test_helper.rb'

describe "VmWatchClient tests" do
    before(:all) do
        clean_db

        @mock_client = MockClient.new
        @monitoring  = OneWatch::VmMonitoring.new

        @watch_client = OneWatchClient::VmWatchClient.new

        @db = WatchHelper::DB
        @db[:vms].count.should eql(0)
    end

    it "1 VM, 1 timestamp. Check totals, sums and resource info" do
        @monitoring.set_mock_timestamp(100)

        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(0)

        values = {
            :cpu => 1,
            :memory => 128,
            :net_tx => 200,
            :net_rx => 400,
            :last_poll => 90,
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
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(1)
    end

    it "should check all the monitoring resources are shown by default" do
        mon = @watch_client.resource_monitoring(1)

        mon[:id].should eql(1)
        mon[:resource].should eql("VM")

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(4)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([90,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([90,400])
    end

    it "should check only one monitoring resource is shown if specified" do
        mon = @watch_client.resource_monitoring(1, [:net_tx])

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(1)

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200])
    end

    it "should check only two monitoring resources are shown if specified" do
        mon = @watch_client.resource_monitoring(1, [:net_tx, :cpu_usage])

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(2)

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200])

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1])
    end

    it "should check all the total monitoring resources are shown by default" do
        mon = @watch_client.total_monitoring

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(1)
        monitoring[:total].first.should eql([100,1])

        monitoring[:active].size.should eql(1)
        monitoring[:active].first.should eql([100,1])

        monitoring[:error].size.should eql(0)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([90,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([90,400])
    end

    it "should check only one total monitoring resources is shown if specified" do
        mon = @watch_client.total_monitoring([:total])

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(1)

        monitoring[:total].size.should eql(1)
        monitoring[:total].first.should eql([100,1])
    end

    it "should return an empty Hash if no valid monitoring resource" do
        mon = @watch_client.resource_monitoring(1, [:oranges])
        mon[:monitoring].empty?.should eql(true)
    end

    it "should return nil if the VM does not exist" do
        mon = @watch_client.resource_monitoring(100, [:oranges])
        mon.should eql(nil)
    end

    it "add a second VM" do
        @monitoring.set_mock_timestamp(200)

        values = {
            :cpu => 1,
            :memory => 128,
            :net_tx => 200,
            :net_rx => 400,
            :last_poll => 90,
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
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(2)
    end

    it "should check all the monitoring resources are shown by default" do
        mon = @watch_client.resource_monitoring(1)

        mon[:id].should eql(1)
        mon[:resource].should eql("VM")

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(4)

        monitoring[:cpu_usage].size.should eql(2)
        monitoring[:cpu_usage].first.should eql([90,1])

        monitoring[:mem_usage].size.should eql(2)
        monitoring[:mem_usage].first.should eql([90,128])

        monitoring[:net_tx].size.should eql(2)
        monitoring[:net_tx].first.should eql([90,200])

        monitoring[:net_rx].size.should eql(2)
        monitoring[:net_rx].first.should eql([90,400])

        mon = @watch_client.resource_monitoring(2)

        mon[:id].should eql(2)
        mon[:resource].should eql("VM")

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(4)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([90,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([90,400])
    end

    it "should check all the total monitoring resources are shown by default" do
        mon = @watch_client.total_monitoring

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(2)
        monitoring[:total].first.should eql([100,1])
        monitoring[:total][1].should eql([200,2])

        monitoring[:active].size.should eql(2)
        monitoring[:active].first.should eql([100,1])
        monitoring[:active][1].should eql([200,2])

        monitoring[:error].size.should eql(0)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1*2])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([90,128*2])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200*2])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([90,400*2])
    end

    it "add a third VM" do
        @monitoring.set_mock_timestamp(300)

        values = {
            :cpu => 1,
            :memory => 128,
            :net_tx => 200,
            :net_rx => 400,
            :last_poll => 90,
            :uid => 3,
            :gid => 5,
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
        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(3)
    end

    it "should check the total monitoring resources are filtered by user" do
        mon = @watch_client.total_monitoring(nil, :uid=>3)

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(1)
        monitoring[:total].first.should eql([300,1])

        monitoring[:active].size.should eql(1)
        monitoring[:active].first.should eql([300,1])

        monitoring[:error].size.should eql(0)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([90,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([90,400])
    end

    it "should check the total monitoring resources are filtered by group" do
        mon = @watch_client.total_monitoring(nil, :gid=>5)

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(1)
        monitoring[:total].first.should eql([300,1])

        monitoring[:active].size.should eql(1)
        monitoring[:active].first.should eql([300,1])

        monitoring[:error].size.should eql(0)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([90,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([90,400])
    end

    it "should check the total monitoring resources are filtered by user" do
        mon = @watch_client.total_monitoring(nil, :uid=>2)

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(3)
        monitoring[:total].first.should eql([100,1])
        monitoring[:total][1].should eql([200,2])
        monitoring[:active].last.should eql([300,2])

        monitoring[:active].size.should eql(3)
        monitoring[:active].first.should eql([100,1])
        monitoring[:active][1].should eql([200,2])
        monitoring[:active].last.should eql([300,2])

        monitoring[:error].size.should eql(0)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1*2])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([90,128*2])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200*2])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([90,400*2])
    end

    it "should check the total monitoring resources are filtered by group" do
        mon = @watch_client.total_monitoring(nil, :gid=>4)

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(3)
        monitoring[:total].first.should eql([100,1])
        monitoring[:total][1].should eql([200,2])
        monitoring[:active].last.should eql([300,2])

        monitoring[:active].size.should eql(3)
        monitoring[:active].first.should eql([100,1])
        monitoring[:active][1].should eql([200,2])
        monitoring[:active].last.should eql([300,2])

        monitoring[:error].size.should eql(0)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([90,1*2])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([90,128*2])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([90,200*2])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([90,400*2])
    end
end