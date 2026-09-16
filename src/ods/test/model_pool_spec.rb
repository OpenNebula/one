require_relative 'shared/spec_helper'

RSpec.describe ODS::Pool do
    let(:resource_class) do
        klass = Class.new do
            class << self

                attr_accessor :factory

                def new_from_id(*args, **options)
                    factory.call(*args, **options)
                end

                def new_from_xml(*args)
                    factory.call(*args)
                end

            end
        end
        klass.const_set(:RESOURCE_NAME, 'resource')
        klass
    end

    let(:pool_class) do
        document_class = resource_class
        Class.new(described_class) do
            const_set(:DOCUMENT_CLASS, document_class)
            const_set(:DOCUMENT_TYPES, {})
        end
    end

    let(:client) { instance_double(OpenNebula::Client) }
    let(:auth) { instance_double('CloudAuth') }
    let(:pool) { pool_class.allocate }

    before do
        pool.instance_variable_set(:@cloud_auth, auth)
        pool.instance_variable_set(:@client, client)
        allow(auth).to receive(:client).and_return(client)
    end

    it 'requires exactly one client source during construction' do
        expect { pool_class.new }.to raise_error(ArgumentError, /either client or auth/)
        expect { pool_class.new(:client => client, :auth => auth) }
            .to raise_error(ArgumentError, /not both/)
    end

    it 'impersonates through cloud auth and rejects it when unavailable' do
        expect(pool.impersonate('alice')).to equal(client)
        expect(auth).to have_received(:client).with('alice')

        pool.instance_variable_set(:@cloud_auth, nil)
        expect(pool.impersonate(nil)).to equal(client)
        expect { pool.impersonate('alice') }.to raise_error(ArgumentError, /Cloud auth/)
    end

    it 'loads and locks a resource, resolves dependencies, and returns the block result' do
        resource = instance_double('Resource', :info => nil, :respond_to? => false)
        resource_class.factory = proc { resource }
        allow(pool).to receive(:resolve_dependencies).and_return(:provider => 'loaded')

        result = pool.get(7, 'alice', :with => [:provider]) do |item, provider:|
            expect(item).to equal(resource)
            expect(provider).to eq('loaded')
            :result
        end

        expect(result).to equal(resource)
        expect(resource_class.factory).to be_a(Proc)
    end

    it 'propagates construction, refresh, dependency and block errors' do
        construction = OpenNebula::Error.new('construction failed')
        resource_class.factory = proc { construction }
        expect(pool.get(1).message).to eq('construction failed')

        resource = instance_double('Resource', :info => OpenNebula::Error.new('refresh failed'))
        resource_class.factory = proc { resource }
        expect(pool.get(1).message).to eq('refresh failed')

        allow(resource).to receive(:info).and_return(nil)
        allow(pool).to receive(:resolve_dependencies).and_return(
            OpenNebula::Error.new('dependency failed')
        )
        expect(pool.get(1, nil, :with => [:x]) { true }.message).to eq('dependency failed')

        allow(pool).to receive(:resolve_dependencies).and_return({})
        expect(pool.get(1) { raise 'block failed' }.message).to eq('block failed')
    end

    it 'serializes blocks for the same resource under concurrent callers' do
        resource = instance_double('Resource', :info => nil, :respond_to? => false)
        resource_class.factory = proc { resource }
        entered = OdsSpecSupport::Countdown.new(2)
        release = OdsSpecSupport::Gate.new
        active = 0
        max_active = 0
        mutex = Mutex.new

        threads = 2.times.map do
            Thread.new do
                entered.decrement
                pool.get(7) do
                    mutex.synchronize do
                        active += 1
                        max_active = [max_active, active].max
                    end
                    release.wait
                    mutex.synchronize { active -= 1 }
                end
            end
        end

        entered.wait
        release.open
        threads.each(&:join)

        expect(max_active).to eq(1)
    end

    it 'returns unsupported dependency errors and accepts empty dependencies' do
        expect(pool.resolve_dependencies(Object.new, [])).to eq({})
        result = pool.resolve_dependencies(Object.new, [:provider])
        expect(result.message).to include('Unsupported')
    end

    it 'summarizes names, ids and membership from enumerable resources' do
        allow(pool).to receive(:map).and_return(['a', 'b'], [1, 2], [1, 2])

        expect(pool.list).to eq(['a', 'b'])
        expect(pool.ids).to eq([1, 2])
        expect(pool.exists?(2)).to be(true)
    end

    it 'reads through a client-only pool without CloudAuth' do
        resource = instance_double('Resource', :info => nil, :respond_to? => false)
        resource_class.factory = proc { resource }
        allow(pool_class).to receive(:new).with(:client => client).and_return(
            pool_class.allocate.tap do |item|
                item.instance_variable_set(:@client, client)
                item.instance_variable_set(:@cloud_auth, nil)
            end
        )

        expect(pool_class.read(client, 7)).to equal(resource)
    end
end
