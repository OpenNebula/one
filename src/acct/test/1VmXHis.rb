$: << '.'

require 'helper/test_helper.rb'

describe "1 Vm X History" do
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
                :hid => 7,
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

        values = {
            :uid => 2,
            :gid => 4,
            :history => [
                {
                    :hid => 7,
                    :seq => 0,
                    :pstime => 150,
                    :petime => 155,
                    :rstime => 155,
                    :retime => 230,
                    :estime => 230,
                    :eetime => 260,
                    :reason => 2
                },
                {
                    :hid => 8,
                    :seq => 1,
                    :pstime => 270,
                    :petime => 275,
                    :rstime => 275,
                    :retime => 0,
                    :estime => 0,
                    :eetime => 0,
                    :reason => 0
                }
            ]
        }

        @mock_client.add_vm(1, values)

        @accounting.insert(create_vmpool_hash)
        check_lines(1,2)

        h1 = values[:history].first
        sum1 =  h1[:retime] - h1[:rstime]

        h2 = values[:history].last
        sum2 = ts3 - h2[:rstime]

        warn "* T1 RSTIME1 RETIME1 RSTIME1 T2"
        @watch_client.running_time(ts1, ts3).to_i.should eql(sum1 + sum2)
    end
end