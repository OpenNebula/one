$: << '.'

require 'helper/test_helper.rb'

describe "1 Vm 1 History" do
    before(:each) do
        clean_db

        @mock_client = MockClient.new
        @accounting  = OneWatch::Accounting.new(@mock_client)

        @watch_client = AcctClient.new

        @db = WatchHelper::DB
        check_lines(0,0)
    end

    it "Prolog testing" do
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

        @accounting.insert(create_vmpool_hash)
        check_lines(1,1)

        history = values[:history].first
        sum = ts2 - history[:pstime]

        warn "* T1 PSTIME T2"
        @watch_client.prolog_time(ts1, ts2).to_i.should eql(sum)
        warn " - By User"
        @watch_client.prolog_time(ts1, ts2, :uid => 2).to_i.should eql(sum)
        warn " - By Host"
        @watch_client.prolog_time(ts1, ts2, :hid => 7).to_i.should eql(sum)
        warn " - By Vm"
        @watch_client.prolog_time(ts1, ts2, :vmid => 1).to_i.should eql(sum)

        warn " - Non existent User"
        @watch_client.prolog_time(ts1, ts2, :uid => 555).to_i.should eql(0)
        warn " - Non existent Host"
        @watch_client.prolog_time(ts1, ts2, :hid => 555).to_i.should eql(0)
        warn " - Non existent Vm"
        @watch_client.prolog_time(ts1, ts2, :vmid => 555).to_i.should eql(0)

        warn "* PSTIME T1 T2"
        @watch_client.prolog_time(160, ts2).to_i.should eql(sum-10)
        warn "* T1 PSTIME T2-10"
        @watch_client.prolog_time(ts1, ts2-10).to_i.should eql(sum-10)
        warn "* T1 T2 PSTIME"
        @watch_client.prolog_time(110, 130).to_i.should eql(0)

        warn "* Non Epilog time"
        @watch_client.epilog_time(ts1, ts2).to_i.should eql(0)
        warn "* Non Running time"
        @watch_client.running_time(ts1, ts2).to_i.should eql(0)

        ts3 = 300
        @accounting.set_mock_timestamp(ts3)

        values = {
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 240,
                :rstime => 0,
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
        sum = history[:petime] - history[:pstime]

        warn "* T1 PSTIME PETIME T3"
        @watch_client.prolog_time(ts1, ts3).to_i.should eql(sum)
        warn " - By User"
        @watch_client.prolog_time(ts1, ts3, :uid => 2).to_i.should eql(sum)
        warn " - By Host"
        @watch_client.prolog_time(ts1, ts3, :hid => 7).to_i.should eql(sum)
        warn " - By Vm"
        @watch_client.prolog_time(ts1, ts3, :vmid => 1).to_i.should eql(sum)

        warn "* T1 PSTIME T3 PETIME"
        @watch_client.prolog_time(ts1, 230).to_i.should eql(230 - history[:pstime])

        warn "* PSTIME T1 PETIME T3"
        @watch_client.prolog_time(160, ts3).to_i.should eql(history[:petime] - 160)

        warn "* PSTIME T1 T3 PETIME"
        @watch_client.prolog_time(160, 230).to_i.should eql(230 - 160)
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
        warn " - By User"
        @watch_client.running_time(ts1, ts2, :uid => 2).to_i.should eql(sum)
        warn " - By Host"
        @watch_client.running_time(ts1, ts2, :hid => 7).to_i.should eql(sum)
        warn " - By Vm"
        @watch_client.running_time(ts1, ts2, :vmid => 1).to_i.should eql(sum)

        warn " - Non existent User"
        @watch_client.running_time(ts1, ts2, :uid => 555).to_i.should eql(0)
        warn " - Non existent Host"
        @watch_client.running_time(ts1, ts2, :hid => 555).to_i.should eql(0)
        warn " - Non existent Vm"
        @watch_client.running_time(ts1, ts2, :vmid => 555).to_i.should eql(0)

        warn "* RSTIME T1 T2"
        @watch_client.running_time(160, ts2).to_i.should eql(ts2-160)
        warn "* T1 RSTIME T2-10"
        @watch_client.running_time(ts1, ts2-10).to_i.should eql(sum-10)
        warn "* T1 T2 RSTIME"
        @watch_client.running_time(110, 130).to_i.should eql(0)

        warn "* Non Epilog time"
        @watch_client.epilog_time(ts1, ts2).to_i.should eql(0)
        warn "* Non Prolog time"
        @watch_client.prolog_time(ts1, ts2).to_i.should eql(5)

        ts3 = 300
        @accounting.set_mock_timestamp(ts3)

        values = {
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 155,
                :rstime => 155,
                :retime => 230,
                :estime => 0,
                :eetime => 0,
                :reason => 0
            ]
        }

        @mock_client.add_vm(1, values)

        @accounting.insert(create_vmpool_hash)
        check_lines(1,1)

        history = values[:history].first
        sum = history[:retime] - history[:rstime]

        warn "* T1 PSTIME PETIME T3"
        @watch_client.running_time(ts1, ts3).to_i.should eql(sum)
        warn " - By User"
        @watch_client.running_time(ts1, ts3, :uid => 2).to_i.should eql(sum)
        warn " - By Host"
        @watch_client.running_time(ts1, ts3, :hid => 7).to_i.should eql(sum)
        warn " - By Vm"
        @watch_client.running_time(ts1, ts3, :vmid => 1).to_i.should eql(sum)

        warn "* T1 PSTIME T3 PETIME"
        @watch_client.running_time(ts1, 230).to_i.should eql(230 - history[:rstime])

        warn "* PSTIME T1 PETIME T3"
        @watch_client.running_time(160, ts3).to_i.should eql(history[:retime] - 160)

        warn "* PSTIME T1 T3 PETIME"
        @watch_client.running_time(160, 230).to_i.should eql(230 - 160)
    end

    it "Epilog testing" do
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
                :pstime => 150,
                :petime => 155,
                :rstime => 155,
                :retime => 170,
                :estime => 180,
                :eetime => 0,
                :reason => 0
            ]
        }

        @mock_client.add_vm(1, values)

        @accounting.insert(create_vmpool_hash)
        check_lines(1,1)

        history = values[:history].first
        sum = ts2 - history[:estime]

        warn "* T1 ESTIME T2"
        @watch_client.epilog_time(ts1, ts2).to_i.should eql(sum)
        warn " - By User"
        @watch_client.epilog_time(ts1, ts2, :uid => 2).to_i.should eql(sum)
        warn " - By Host"
        @watch_client.epilog_time(ts1, ts2, :hid => 7).to_i.should eql(sum)
        warn " - By Vm"
        @watch_client.epilog_time(ts1, ts2, :vmid => 1).to_i.should eql(sum)

        warn " - Non existent User"
        @watch_client.epilog_time(ts1, ts2, :uid => 555).to_i.should eql(0)
        warn " - Non existent Host"
        @watch_client.epilog_time(ts1, ts2, :hid => 555).to_i.should eql(0)
        warn " - Non existent Vm"
        @watch_client.epilog_time(ts1, ts2, :vmid => 555).to_i.should eql(0)

        warn "* ESTIME T1 T2"
        @watch_client.epilog_time(190, ts2).to_i.should eql(ts2-190)
        warn "* T1 ESTIME T2-10"
        @watch_client.epilog_time(ts1, ts2-10).to_i.should eql(sum-10)
        warn "* T1 T2 ESTIME"
        @watch_client.epilog_time(110, 130).to_i.should eql(0)

        warn "* Non Running time"
        @watch_client.running_time(ts1, ts2).to_i.should eql(15)
        warn "* Non Prolog time"
        @watch_client.prolog_time(ts1, ts2).to_i.should eql(5)

        ts3 = 300
        @accounting.set_mock_timestamp(ts3)

        values = {
            :uid => 2,
            :gid => 4,
            :history => [
                :hid => 7,
                :pstime => 150,
                :petime => 155,
                :rstime => 155,
                :retime => 170,
                :estime => 180,
                :eetime => 230,
                :reason => 0
            ]
        }

        @mock_client.add_vm(1, values)

        @accounting.insert(create_vmpool_hash)
        check_lines(1,1)

        history = values[:history].first
        sum = history[:eetime] - history[:estime]

        warn "* T1 PSTIME PETIME T3"
        @watch_client.epilog_time(ts1, ts3).to_i.should eql(sum)
        warn " - By User"
        @watch_client.epilog_time(ts1, ts3, :uid => 2).to_i.should eql(sum)
        warn " - By Host"
        @watch_client.epilog_time(ts1, ts3, :hid => 7).to_i.should eql(sum)
        warn " - By Vm"
        @watch_client.epilog_time(ts1, ts3, :vmid => 1).to_i.should eql(sum)

        warn "* T1 PSTIME T3 PETIME"
        @watch_client.epilog_time(ts1, 230).to_i.should eql(230 - history[:estime])

        warn "* PSTIME T1 PETIME T3"
        @watch_client.epilog_time(190, ts3).to_i.should eql(history[:eetime] - 190)

        warn "* PSTIME T1 T3 PETIME"
        @watch_client.epilog_time(190, 220).to_i.should eql(220 - 190)
    end
end