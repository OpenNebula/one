$: << '.'

require 'helper/test_helper.rb'

describe "X Vm 1 History" do
    before(:each) do
        clean_db

        @mock_client = MockClient.new
        @accounting  = OneWatch::Accounting.new(@mock_client)

        @watch_client = AcctClient.new

        @db = WatchHelper::DB
        check_lines(0,0)
    end

    it "Running testing" do
        ts1 = 100
        @accounting.set_mock_timestamp(ts1)

        @accounting.insert(create_vmpool_hash)
        check_lines(0,0)

        ts2 = 200
        @accounting.set_mock_timestamp(ts2)

        values = {
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 6,
                :seq => 0,
                :pstime => 150,
                :petime => 155,
                :rstime => 155,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }

        @mock_client.add_vm(1, values)

        @accounting.insert(create_vmpool_hash)
        check_lines(1,1)

        history = values[:history].first
        sum = ts2 - history[:rstime]

        warn "* T1 RSTIME T2"
        @watch_client.running_time(ts1, ts2).to_i.should eql(sum)

        ts3 = 300
        @accounting.set_mock_timestamp(ts3)

        values2 = {
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :seq => 0,
                :pstime => 220,
                :petime => 260,
                :rstime => 260,
                :retime => 0,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }

        @mock_client.add_vm(2, values2)

        @accounting.insert(create_vmpool_hash)
        check_lines(2,2)

        history1 = values[:history].first
        sum1 = ts3 - history1[:rstime]

        history2 = values2[:history].first
        sum2 = ts3 - history2[:rstime]

        warn "* T1 RSTIME T2"
        @watch_client.running_time(ts1, ts3).to_i.should eql(sum1 + sum2)
        @watch_client.running_time(ts1, ts3, :vmid=>1).to_i.should eql(sum1)
        @watch_client.running_time(ts1, ts3, :vmid=>2).to_i.should eql(sum2)
        @watch_client.running_time(ts1, ts3, :uid=>2).to_i.should eql(sum1 + sum2)
        @watch_client.running_time(ts1, ts3, :hid=>6).to_i.should eql(sum1)
        @watch_client.running_time(ts1, ts3, :hid=>7).to_i.should eql(sum2)
    end
end