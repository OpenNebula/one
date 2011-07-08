require 'helper/test_helper.rb'

describe "1 Vm 1 10 steps" do
    before(:each) do
        clean_db

        @mock_client = MockClient.new
        @monitoring  = OneWatch::VmMonitoring.new

        @watch_client = OneWatchClient::WatchClient.new

        @db = WatchHelper::DB
        @db[:vms].count.should eql(0)
    end

    it "CPU testing" do
        ts1 = 100
        @monitoring.set_mock_timestamp(ts1)

        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(0)

        10.times { |i|
            ts2 = 200+100*i
            @monitoring.set_mock_timestamp(ts2)

            values = {
                :cpu => 80+i,
                :memory => 122+i,
                :net_tx => 200+i,
                :net_rx => 134+i,
                :last_poll => 1309275256+i,
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
            @db[:vm_samples].count.should eql(1+i > 5 ? 5 : 1+i)

            @watch_client.vm_monitoring(1, ['cpu', 'net_tx'])

            @watch_client.vm_total
        }
    end

    it "Total testing" do
        ts1 = 100
        @monitoring.set_mock_timestamp(ts1)

        @monitoring.insert(create_vmpool_hash)
        @db[:vms].count.should eql(0)

        10.times { |i|
            ts2 = 200+100*i
            @monitoring.set_mock_timestamp(ts2)

            values = {
                :cpu => 80+i,
                :memory => 122+i,
                :net_tx => 200+i,
                :net_rx => 134+i,
                :state => 7,
                :last_poll => 1309275256+i,
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

            values[:state] = 7
            @mock_client.add_vm(i+100, values)
            values[:state] = 3
            @mock_client.add_vm(i+10, values)

            @monitoring.insert(create_vmpool_hash)

            @db[:vm_samples].count
            total = @watch_client.vm_total([:total, :error, :active])
        }
    end
end