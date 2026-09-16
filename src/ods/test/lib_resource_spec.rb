require_relative 'shared/spec_helper'

RSpec.describe ODS::OneHelper::Resource do
    let(:client) { instance_double(OpenNebula::Client) }

    it 'resolves every helper that declares a resource type' do
        expect(described_class.resolve(:cluster)).to eq(ODS::OneHelper::Cluster)
        expect(described_class.resolve('datastore')).to eq(ODS::OneHelper::Datastore)
        expect(described_class.resolve(:host)).to eq(ODS::OneHelper::Host)
        expect(described_class.resolve(:image)).to eq(ODS::OneHelper::Image)
        expect(described_class.resolve(:network)).to eq(ODS::OneHelper::VirtualNetwork)
        expect(described_class.resolve(:vm)).to eq(ODS::OneHelper::VirtualMachine)

        unsupported = described_class.resolve(:unknown)
        expect(OpenNebula.is_error?(unsupported)).to be(true)
        expect(unsupported.message).to include('Unsupported OpenNebula resource type')
    end

    it 'finds every pool object matching all requested attributes and refreshes matches' do
        matching = double('matching', :info => nil)
        other = double('other', :info => nil)
        allow(matching).to receive(:[]).with('TEMPLATE/UUID').and_return('one')
        allow(matching).to receive(:[]).with('ID').and_return(7)
        allow(other).to receive(:[]).and_return('different')
        pool = double('pool', :info => nil)
        allow(pool).to receive(:select).and_yield(matching).and_yield(other).and_return([matching])
        pool_class = class_double(OpenNebula::HostPool, :new => pool)
        helper = Module.new
        helper.const_set(:RESOURCE_TYPE, 'searchable')
        helper.const_set(:POOL_CLASS, pool_class)
        stub_const('OpenNebula::DocumentServer::OneHelper::Searchable', helper)

        result = described_class.find_all_by_attributes(
            client, :searchable, 'TEMPLATE/UUID' => 'one', 'ID' => 7
        )

        expect(result).to eq([matching])
        expect(matching).to have_received(:info)
    end

    it 'rejects empty searches, missing pool support, and pool dependency failures' do
        expect(described_class.find_all_by_attributes(client, :host, {}).message)
            .to include('cannot be empty')
        expect(described_class.find_all_by_attributes(client, :image, :id => 1).message)
            .to include('does not support pool attribute searches')

        pool = double('pool', :info => OpenNebula::Error.new('pool failed'))
        allow(OpenNebula::HostPool).to receive(:new).and_return(pool)
        expect(described_class.find_all_by_attributes(client, :host, :id => 1).message)
            .to eq('pool failed')
    end

    it 'updates non-empty template content and refreshes the resource' do
        object = double('resource', :update => nil, :info => nil)

        expect(described_class.update_template(object, :NAME => 'demo')).to equal(object)
        expect(object).to have_received(:update).with('NAME = "demo"', true)
        expect(object).to have_received(:info)
        expect(described_class.update_template(object, {}).message).to include('cannot be empty')
    end

    it 'propagates update and refresh failures' do
        object = double('resource')
        allow(object).to receive(:update).and_return(OpenNebula::Error.new('update failed'))
        expect(described_class.update_template(object, :NAME => 'demo').message)
            .to eq('update failed')

        allow(object).to receive(:update).and_return(nil)
        allow(object).to receive(:info).and_return(OpenNebula::Error.new('refresh failed'))
        expect(described_class.update_template(object, :NAME => 'demo').message)
            .to eq('refresh failed')
    end

    it 'waits for readiness and propagates refresh failures without real delays' do
        object = double('resource', :id => 7)
        allow(described_class).to receive(:sleep)
        allow(object).to receive(:info).and_return(nil, nil)
        allow(object).to receive(:state).and_return(0, 1)

        expect(described_class.wait_until_ready(
                   object, :timeout => 1, :interval => 0
               )).to equal(object)

        allow(object).to receive(:info).and_return(OpenNebula::Error.new('refresh failed'))
        expect(described_class.wait_until_ready(
            object, :timeout => 1, :interval => 0
        ).message).to eq('refresh failed')
    end

    it 'recognizes deletion by missing object or terminal state' do
        object = double('resource', :id => 7, :state => 6)
        allow(described_class).to receive(:sleep)
        allow(object).to receive(:info).and_return(OpenNebula::Error.new('missing'))
        expect(described_class.wait_until_deleted(
                   object, :timeout => 1, :interval => 0
               )).to be(true)

        allow(object).to receive(:info).and_return(nil)
        expect(described_class.wait_until_deleted(
                   object, :timeout => 1, :interval => 0, :state => 6
               )).to be(true)
    end

    it 'converts readiness and deletion timeouts into action errors' do
        object = double('resource', :id => 7)
        allow(Timeout).to receive(:timeout).and_raise(Timeout::Error)

        expect(described_class.wait_until_ready(object).message).to include('did not become ready')
        expect(described_class.wait_until_deleted(object).message).to include('Could not delete')
    end
end
