$LOAD_PATH << File.expand_path('..', __dir__)

require 'HostSyncManager'

describe HostSyncManager do
    before(:each) do
        @one_location = ENV['ONE_LOCATION']
        # ONE_LOCATION/var/remotes does not exist, so the local sync fails
        ENV['ONE_LOCATION'] = '/nonexistent-one-location'

        # The remote mkdir succeeds, only the local sync step runs for real
        ok = double('ssh', :code => 0, :stdout => '', :stderr => '')
        allow(SSHCommand).to receive(:run).and_return(ok)
    end

    after(:each) do
        ENV['ONE_LOCATION'] = @one_location
    end

    it 'logs the stderr of a failed sync' do
        logs = []
        logger = lambda {|message| logs << message }

        rc = HostSyncManager.new.update_remotes('host', logger)

        expect(rc).not_to eq(0)
        expect(logs.join).to match(/No such file or directory/)
    end
end
