require_relative 'shared/spec_helper'

RSpec.describe ODS::AuthController do
    let(:client) { instance_double(OpenNebula::Client) }
    let(:user) do
        instance_double(
            OpenNebula::User,
            :id => 42, :gid => 10, :groups => [10], :name => 'alice',
            :info => nil, :login => 'new-token'
        )
    end

    it 'returns the first unexpired login token including permanent tokens' do
        allow(user).to receive(:to_hash).and_return(
            'USER' => {
                'LOGIN_TOKEN' => [
                    { 'TOKEN' => 'expired', 'EXPIRATION_TIME' => Time.now.to_i - 1 },
                    { 'TOKEN' => 'permanent', 'EXPIRATION_TIME' => -1 },
                    { 'TOKEN' => 'later', 'EXPIRATION_TIME' => Time.now.to_i + 100 }
                ]
            }
        )

        expect(described_class.first_unexpired_token(user)).to eq('permanent')
    end

    it 'reuses a token or creates one and returns username authentication' do
        allow(described_class).to receive(:current_user).and_return(user)
        allow(described_class).to receive(:first_unexpired_token).and_return('existing', nil)

        expect(described_class.user_auth(client)).to eq('alice:existing')
        expect(described_class.user_auth(client)).to eq('alice:new-token')
        expect(user).to have_received(:login).with('alice', '', -1)
        expect(described_class.user_auth(nil).message).to include('client must be provided')
    end

    it 'propagates user lookup and token allocation failures' do
        error = OpenNebula::Error.new('user failed')
        allow(described_class).to receive(:current_user).and_return(error)
        expect(described_class.user_auth(client)).to equal(error)

        allow(described_class).to receive(:current_user).and_return(user)
        allow(described_class).to receive(:first_unexpired_token).and_return(nil)
        allow(user).to receive(:login).and_return(error)
        expect(described_class.user_auth(client)).to equal(error)
    end

    it 'loads and refreshes the current OpenNebula user' do
        allow(OpenNebula::User).to receive(:new_with_id).and_return(user)

        expect(described_class.current_user(client)).to equal(user)
        expect(OpenNebula::User).to have_received(:new_with_id)
            .with(OpenNebula::User::SELF, client)
        expect(user).to have_received(:info)

        allow(user).to receive(:info).and_return(OpenNebula::Error.new('lookup failed'))
        expect(described_class.current_user(client).message).to eq('lookup failed')
    end

    it 'registers authentication helpers, conditions and the request hook' do
        app = double('app')
        allow(described_class).to receive(:register_cloud_auth)
        allow(app).to receive(:helpers)
        allow(app).to receive(:set)
        allow(app).to receive(:before)

        described_class.registered(app)

        expect(described_class).to have_received(:register_cloud_auth).with(app)
        expect(app).to have_received(:helpers).with(ODS::AuthController::Helpers)
        expect(app).to have_received(:set).with(:oneadmin_only)
        expect(app).to have_received(:set).with(:ensure_resource_access)
        expect(app).to have_received(:before)
    end

    it 'initializes CloudAuth with the configured cipher credentials' do
        app = double('app')
        cloud_auth = double('cloud auth')
        stub_const('SERVER_AUTH', 'cipher-secret')
        stub_const('SERVER_CONF', { :subscriber_endpoint => 'inproc://events' })
        stub_const('CloudAuth', class_double('CloudAuth', :new => cloud_auth))
        allow(described_class).to receive(:require).with('CloudAuth')
        allow(app).to receive(:set)
        previous = ENV['ONE_CIPHER_AUTH']

        described_class.register_cloud_auth(app)

        expect(ENV.fetch('ONE_CIPHER_AUTH')).to eq('cipher-secret')
        expect(CloudAuth).to have_received(:new).with(SERVER_CONF)
        expect(app).to have_received(:set).with(:cloud_auth, cloud_auth)
    ensure
        previous.nil? ? ENV.delete('ONE_CIPHER_AUTH') : ENV['ONE_CIPHER_AUTH'] = previous
    end

    describe ODS::AuthController::Helpers do
        let(:helper_class) do
            Class.new do
                include ODS::AuthController::Helpers

                attr_accessor :params

                def initialize(client)
                    @client = client
                    @params = {}
                end
            end
        end
        subject(:helper) { helper_class.new(client) }

        before do
            allow(ODS::AuthController).to receive(:current_user).and_return(user)
        end

        it 'memoizes authenticated users and identifies direct or secondary oneadmin membership' do
            expect(helper.authenticated_user).to equal(user)
            expect(helper.authenticated_user).to equal(user)
            expect(ODS::AuthController).to have_received(:current_user).once
            expect(helper).not_to be_oneadmin

            allow(user).to receive(:groups).and_return([10, 0])
            expect(helper).to be_oneadmin

            allow(user).to receive(:gid).and_return(0)
            allow(user).to receive(:groups).and_return([])
            expect(helper).to be_oneadmin
        end

        it 'allows sensitive values only when explicitly requested by owner or oneadmin' do
            document = double('document', :owner_id => 42)
            helper.params = { :include_sensitive => 'true' }
            expect(helper.include_sensitive?(document)).to be(true)

            allow(document).to receive(:owner_id).and_return(99)
            expect(helper.include_sensitive?(document)).to be(false)
            helper.params = {}
            expect(helper.include_sensitive?(document)).to be(false)
        end
    end
end
