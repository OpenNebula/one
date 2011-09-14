$: << '.'

require 'helper/test_helper.rb'
require 'watch_client'

describe "VmWatchClient tests" do
    before(:all) do
        clean_db

        @mock_client = MockClient.new
        @monitoring  = OneWatch::VmMonitoring.new

        @watch_client = OneWatchClient::VmWatchClient.new

        @db = WatchHelper::DB
        @db[:vms].count.should eql(0)
    end

    it "Create a VM: uid=2 gid=4, timestamp=100" do
        @monitoring.set_mock_timestamp(100)

        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(0)

        values = {
            :cpu => 1,
            :memory => 128,
            :net_tx => 200,
            :net_rx => 400,
            :last_poll => 100,
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
        monitoring[:cpu_usage].first.should eql([100,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([100,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([100,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([100,400])
    end

    it "should check all the monitoring resources are shown by default and filtered" do
        mon = @watch_client.resource_monitoring(1, nil, :uid=>2)

        mon[:id].should eql(1)
        mon[:resource].should eql("VM")

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(4)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([100,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([100,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([100,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([100,400])
    end

    it "should check no info for non exisiting user" do
        mon = @watch_client.resource_monitoring(1, nil, :uid=>1)

        mon.should eql(nil)
    end

    it "should check only one monitoring resource is shown if specified" do
        mon = @watch_client.resource_monitoring(1, [:net_tx])

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(1)

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([100,200])
    end

    it "should check only two monitoring resources are shown if specified" do
        mon = @watch_client.resource_monitoring(1, [:net_tx, :cpu_usage])

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(2)

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([100,200])

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([100,1])
    end

    it "should check all the total monitoring resources are shown by default" do
        mon = @watch_client.total_monitoring

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(1)
        monitoring[:total].first.should eql([100,1])

        monitoring[:active].size.should eql(1)
        monitoring[:active].first.should eql([100,1])

        monitoring[:error].size.should eql(1)
        monitoring[:error].first.should eql([100,0])

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([100,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([100,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([100,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([100,400])
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

    it "Create a second VM: uid=2 gid=4, timestamp=200" do
        @monitoring.set_mock_timestamp(200)

        values = {
            :cpu => 1,
            :memory => 128,
            :net_tx => 200,
            :net_rx => 400,
            :last_poll => 100,
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
        monitoring[:cpu_usage].first.should eql([100,1])

        monitoring[:mem_usage].size.should eql(2)
        monitoring[:mem_usage].first.should eql([100,128])

        monitoring[:net_tx].size.should eql(2)
        monitoring[:net_tx].first.should eql([100,200])

        monitoring[:net_rx].size.should eql(2)
        monitoring[:net_rx].first.should eql([100,400])

        mon = @watch_client.resource_monitoring(2)

        mon[:id].should eql(2)
        mon[:resource].should eql("VM")

        monitoring = mon[:monitoring]

        monitoring.keys.size.should eql(4)

        monitoring[:cpu_usage].size.should eql(1)
        monitoring[:cpu_usage].first.should eql([100,1])

        monitoring[:mem_usage].size.should eql(1)
        monitoring[:mem_usage].first.should eql([100,128])

        monitoring[:net_tx].size.should eql(1)
        monitoring[:net_tx].first.should eql([100,200])

        monitoring[:net_rx].size.should eql(1)
        monitoring[:net_rx].first.should eql([100,400])
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

        monitoring[:error].size.should eql(2)
        monitoring[:error].first.should eql([100,0])
        monitoring[:error][1].should eql([200,0])

        monitoring[:cpu_usage].size.should eql(2)
        monitoring[:cpu_usage].first.should eql([100,1])
        monitoring[:cpu_usage][1].should eql([200,1*2])

        monitoring[:mem_usage].size.should eql(2)
        monitoring[:mem_usage].first.should eql([100,128])
        monitoring[:mem_usage][1].should eql([200,128*2])

        monitoring[:net_tx].size.should eql(2)
        monitoring[:net_tx].first.should eql([100,200])
        monitoring[:net_tx][1].should eql([200,200*2])

        monitoring[:net_rx].size.should eql(2)
        monitoring[:net_rx].first.should eql([100,400])
        monitoring[:net_rx][1].should eql([200,400*2])
    end

    it "Create a third VM: uid=3 gid=5, timestamp=300" do
        @monitoring.set_mock_timestamp(300)

        values = {
            :cpu => 1,
            :memory => 128,
            :net_tx => 200,
            :net_rx => 400,
            :last_poll => 270,
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

    it "should check the total monitoring resources are filtered by uid(3)" do
        mon = @watch_client.total_monitoring(nil, :uid=>3)

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(3)
        monitoring[:total].first.should eql([100,0])
        monitoring[:total][1].should eql([200,0])
        monitoring[:total][2].should eql([300,1])

        monitoring[:active].size.should eql(3)
        monitoring[:active].first.should eql([100,0])
        monitoring[:active][1].should eql([200,0])
        monitoring[:active][2].should eql([300,1])

        monitoring[:error].size.should eql(3)
        monitoring[:error].first.should eql([100,0])
        monitoring[:error][1].should eql([200,0])
        monitoring[:error][2].should eql([300,0])

        monitoring[:cpu_usage].size.should eql(3)
        monitoring[:cpu_usage].first.should eql([100,0])
        monitoring[:cpu_usage][1].should eql([200,0])
        monitoring[:cpu_usage][2].should eql([300,1])

        monitoring[:mem_usage].size.should eql(3)
        monitoring[:mem_usage].first.should eql([100,0])
        monitoring[:mem_usage][1].should eql([200,0])
        monitoring[:mem_usage][2].should eql([300,128])

        monitoring[:net_tx].size.should eql(3)
        monitoring[:net_tx].first.should eql([100,0])
        monitoring[:net_tx][1].should eql([200,0])
        monitoring[:net_tx][2].should eql([300,200])

        monitoring[:net_rx].size.should eql(3)
        monitoring[:net_rx].first.should eql([100,0])
        monitoring[:net_rx][1].should eql([200,0])
        monitoring[:net_rx][2].should eql([300,400])
    end

    it "should check the total monitoring resources are filtered by gid(5)" do
        mon = @watch_client.total_monitoring(nil, :gid=>5)

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(3)
        monitoring[:total].first.should eql([100,0])
        monitoring[:total][1].should eql([200,0])
        monitoring[:total][2].should eql([300,1])

        monitoring[:active].size.should eql(3)
        monitoring[:active].first.should eql([100,0])
        monitoring[:active][1].should eql([200,0])
        monitoring[:active][2].should eql([300,1])

        monitoring[:error].size.should eql(3)
        monitoring[:error].first.should eql([100,0])
        monitoring[:error][1].should eql([200,0])
        monitoring[:error][2].should eql([300,0])

        monitoring[:cpu_usage].size.should eql(3)
        monitoring[:cpu_usage].first.should eql([100,0])
        monitoring[:cpu_usage][1].should eql([200,0])
        monitoring[:cpu_usage][2].should eql([300,1])

        monitoring[:mem_usage].size.should eql(3)
        monitoring[:mem_usage].first.should eql([100,0])
        monitoring[:mem_usage][1].should eql([200,0])
        monitoring[:mem_usage][2].should eql([300,128])

        monitoring[:net_tx].size.should eql(3)
        monitoring[:net_tx].first.should eql([100,0])
        monitoring[:net_tx][1].should eql([200,0])
        monitoring[:net_tx][2].should eql([300,200])

        monitoring[:net_rx].size.should eql(3)
        monitoring[:net_rx].first.should eql([100,0])
        monitoring[:net_rx][1].should eql([200,0])
        monitoring[:net_rx][2].should eql([300,400])
    end

    it "should check the total monitoring resources are filtered by uid(2)" do
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

        monitoring[:error].size.should eql(3)
        monitoring[:error].first.should eql([100,0])
        monitoring[:error][1].should eql([200,0])
        monitoring[:error][2].should eql([300,0])

        monitoring[:cpu_usage].size.should eql(3)
        monitoring[:cpu_usage].first.should eql([100,1])
        monitoring[:cpu_usage][1].should eql([200,2])
        monitoring[:cpu_usage][2].should eql([300,2])

        monitoring[:mem_usage].size.should eql(3)
        monitoring[:mem_usage].first.should eql([100,128])
        monitoring[:mem_usage][1].should eql([200,256])
        monitoring[:mem_usage][2].should eql([300,256])

        monitoring[:net_tx].size.should eql(3)
        monitoring[:net_tx].first.should eql([100,200])
        monitoring[:net_tx][1].should eql([200,400])
        monitoring[:net_tx][2].should eql([300,400])

        monitoring[:net_rx].size.should eql(3)
        monitoring[:net_rx].first.should eql([100,400])
        monitoring[:net_rx][1].should eql([200,800])
        monitoring[:net_rx][2].should eql([300,800])
    end

    it "should check the total monitoring resources are filtered by gid(4)" do
        mon = @watch_client.total_monitoring(nil, :gid=>4)

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(3)
        monitoring[:total].first.should eql([100,1])
        monitoring[:total][1].should eql([200,2])
        monitoring[:total].last.should eql([300,2])

        monitoring[:active].size.should eql(3)
        monitoring[:active].first.should eql([100,1])
        monitoring[:active][1].should eql([200,2])
        monitoring[:active].last.should eql([300,2])

        monitoring[:error].size.should eql(3)
        monitoring[:error].first.should eql([100,0])
        monitoring[:error][1].should eql([200,0])
        monitoring[:error][2].should eql([300,0])

        monitoring[:cpu_usage].size.should eql(3)
        monitoring[:cpu_usage].first.should eql([100,1])
        monitoring[:cpu_usage][1].should eql([200,2])
        monitoring[:cpu_usage][2].should eql([300,2])

        monitoring[:mem_usage].size.should eql(3)
        monitoring[:mem_usage].first.should eql([100,128])
        monitoring[:mem_usage][1].should eql([200,256])
        monitoring[:mem_usage][2].should eql([300,256])

        monitoring[:net_tx].size.should eql(3)
        monitoring[:net_tx].first.should eql([100,200])
        monitoring[:net_tx][1].should eql([200,400])
        monitoring[:net_tx][2].should eql([300,400])

        monitoring[:net_rx].size.should eql(3)
        monitoring[:net_rx].first.should eql([100,400])
        monitoring[:net_rx][1].should eql([200,800])
        monitoring[:net_rx][2].should eql([300,800])
    end

    it "should check no total info for non existing user" do
        mon = @watch_client.total_monitoring(nil, :uid=>5)

        mon[:resource].should eql("VM_POOL")

        monitoring = mon[:monitoring]

        monitoring[:total].size.should eql(3)
        monitoring[:total].first.should eql([100,0])
        monitoring[:total][1].should eql([200,0])
        monitoring[:total].last.should eql([300,0])

        monitoring[:active].size.should eql(3)
        monitoring[:active].first.should eql([100,0])
        monitoring[:active][1].should eql([200,0])
        monitoring[:active].last.should eql([300,0])

        monitoring[:error].size.should eql(3)
        monitoring[:error].first.should eql([100,0])
        monitoring[:error][1].should eql([200,0])
        monitoring[:error][2].should eql([300,0])

        monitoring[:cpu_usage].size.should eql(3)
        monitoring[:cpu_usage].first.should eql([100,0])
        monitoring[:cpu_usage][1].should eql([200,0])
        monitoring[:cpu_usage][2].should eql([300,0])

        monitoring[:mem_usage].size.should eql(3)
        monitoring[:mem_usage].first.should eql([100,0])
        monitoring[:mem_usage][1].should eql([200,0])
        monitoring[:mem_usage][2].should eql([300,0])

        monitoring[:net_tx].size.should eql(3)
        monitoring[:net_tx].first.should eql([100,0])
        monitoring[:net_tx][1].should eql([200,0])
        monitoring[:net_tx][2].should eql([300,0])

        monitoring[:net_rx].size.should eql(3)
        monitoring[:net_rx].first.should eql([100,0])
        monitoring[:net_rx][1].should eql([200,0])
        monitoring[:net_rx][2].should eql([300,0])
    end
end