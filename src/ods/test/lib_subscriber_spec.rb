require_relative 'shared/spec_helper'

RSpec.describe ODS::EventManager do
    let(:action_manager) { instance_double(ActionManager) }
    let(:manager_class) do
        klass = Class.new(described_class) do
            def perform(*); end
        end
        klass.const_set(:ACTIONS, [:perform].freeze)
        klass
    end

    before do
        allow(ActionManager).to receive(:new).and_return(action_manager)
        allow(action_manager).to receive(:register_action)
        allow(action_manager).to receive(:trigger_action)
    end

    it 'registers declared actions and triggers them with a generated identifier' do
        allow(SecureRandom).to receive(:uuid).and_return('event-id')
        manager = manager_class.new(nil, :concurrency => 3)

        expect(ActionManager).to have_received(:new).with(3, true)
        expect(action_manager).to have_received(:register_action).with(:perform, kind_of(Method))
        expect(manager.trigger_action(:name => :perform, :args => [1, 2])).to eq('event-id')
        expect(action_manager).to have_received(:trigger_action).with(:perform, 'event-id', 1, 2)
    end

    it 'converts ActionManager dependency failures into OpenNebula errors' do
        manager = manager_class.new(nil, :concurrency => 1)
        allow(action_manager).to receive(:trigger_action).and_raise('queue unavailable')

        result = manager.trigger_action(:name => :perform)

        expect(OpenNebula.is_error?(result)).to be(true)
        expect(result.message).to include('queue unavailable')
        expect(Log).to have_received(:error).with('ACT', /queue unavailable/, kind_of(String))
    end
end

RSpec.describe ODS::EventSubscriber do
    let(:socket) { instance_double(ZMQ::Socket) }
    let(:context) { instance_double(ZMQ::Context) }
    let(:subscriber) do
        described_class.allocate.tap do |instance|
            instance.instance_variable_set(:@endpoint, 'inproc://test')
            instance.instance_variable_set(:@timeout, 1000)
            instance.instance_variable_set(:@states, ['RUNNING'])
            instance.instance_variable_set(:@socket, socket)
            instance.instance_variable_set(:@context, context)
        end
    end

    before do
        allow(socket).to receive(:setsockopt)
        allow(socket).to receive(:connect)
        allow(socket).to receive(:close)
        allow(context).to receive(:socket).and_return(socket)
        allow(context).to receive(:terminate)
    end

    it 'constructs and connects a configured subscriber socket' do
        allow(ZMQ::Context).to receive(:new).and_return(context)

        instance = described_class.new(
            :endpoint => 'tcp://events:2101', :timeout => 3, :states => ['POWEROFF']
        )

        expect(instance.endpoint).to eq('tcp://events:2101')
        expect(instance.timeout).to eq(3000)
        expect(instance.states).to eq(['POWEROFF'])
        expect(context).to have_received(:socket).with(ZMQ::SUB)
        expect(socket).to have_received(:setsockopt).with(ZMQ::RCVTIMEO, 3000)
        expect(socket).to have_received(:connect).with('tcp://events:2101')
    end

    it 'builds exact filters and manages single and bulk subscriptions' do
        expect(subscriber.gen_filter('VM', 7, 'ACTIVE', 'RUNNING')).to eq(
            'EVENT STATE VM/ACTIVE/RUNNING/7'
        )

        subscriber.subscribe_all!(7, 'ACTIVE', 'RUNNING')
        subscriber.unsubscribe_all!(7, 'ACTIVE', 'RUNNING')

        expect(socket).to have_received(:setsockopt)
            .with(ZMQ::SUBSCRIBE, 'EVENT STATE VM/ACTIVE/RUNNING/7')
        expect(socket).to have_received(:setsockopt)
            .with(ZMQ::SUBSCRIBE, 'EVENT STATE VM/DONE/LCM_INIT/7')
        expect(socket).to have_received(:setsockopt)
            .with(ZMQ::UNSUBSCRIBE, 'EVENT STATE VM/RUNNING/LCM_INIT/7')
    end

    it 'manages raw API and individual state filters' do
        subscriber.subscribe('one.vm.info')
        subscriber.unsubscribe('one.vm.info')
        subscriber.subscribe_state('HOST', 9, 'MONITORED', nil)
        subscriber.unsubscribe_state('HOST', 9, 'MONITORED', nil)

        expect(socket).to have_received(:setsockopt).with(ZMQ::SUBSCRIBE, 'one.vm.info')
        expect(socket).to have_received(:setsockopt).with(ZMQ::UNSUBSCRIBE, 'one.vm.info')
        expect(socket).to have_received(:setsockopt)
            .with(ZMQ::SUBSCRIBE, 'EVENT STATE HOST/MONITORED//9')
        expect(socket).to have_received(:setsockopt)
            .with(ZMQ::UNSUBSCRIBE, 'EVENT STATE HOST/MONITORED//9')
    end

    it 'decodes valid XML and ignores malformed XML' do
        valid = subscriber.decode_xml(Base64.strict_encode64('<VM><ID>7</ID></VM>'))
        invalid = subscriber.decode_xml(Base64.strict_encode64('<VM>'))

        expect(valid.at_xpath('//ID').text).to eq('7')
        expect(invalid).to be_nil
    end

    it 'returns multipart events, empty frames and receive timeouts distinctly' do
        frame = 0
        allow(socket).to receive(:recv_string) do |buffer|
            frame += 1
            buffer.replace(frame == 1 ? 'key' : 'content')
            0
        end
        expect(subscriber.recv_event).to eq(['key', 'content'])

        calls = 0
        allow(socket).to receive(:recv_string) do |buffer|
            calls += 1
            buffer.replace('')
            calls
        end
        expect(subscriber.recv_event).to eq([nil, nil])

        allow(socket).to receive(:recv_string).and_return(-1)
        allow(ZMQ::Util).to receive(:errno).and_return(ZMQ::EAGAIN)
        expect(subscriber.recv_event).to eq([nil, nil])
    end

    it 'raises non-timeout socket errors' do
        allow(socket).to receive(:recv_string).and_return(-1)
        allow(ZMQ::Util).to receive(:errno).and_return(99)

        expect { subscriber.recv_event }.to raise_error(/Error reading subscriber key: 99/)
    end

    it 'processes API events until the block stops and always cleans resources' do
        allow(described_class).to receive(:default_subscriber).and_return(subscriber)
        allow(subscriber).to receive(:subscribe)
        allow(subscriber).to receive(:recv_event).and_return(
            ['call', Base64.strict_encode64('<EVENT/>')]
        )

        result = described_class.subscribe_for('one.vm.info') do |xml|
            expect(xml.root.name).to eq('EVENT')
            raise ODS::StopSubscription
        end

        expect(result).to be_nil
        expect(socket).to have_received(:close)
        expect(context).to have_received(:terminate)
    end

    it 'removes the API subscription when the subscription loop exits' do
        allow(described_class).to receive(:default_subscriber).and_return(subscriber)
        allow(subscriber).to receive(:subscribe)
        allow(subscriber).to receive(:recv_event).and_return(
            ['call', Base64.strict_encode64('<EVENT/>')]
        )
        allow(subscriber).to receive(:unsubscribe)

        described_class.subscribe_for('one.vm.info') { raise ODS::StopSubscription }

        expect(subscriber).to have_received(:unsubscribe).with('one.vm.info')
    end

    it 'honors cooperative cancellation before receiving an event' do
        allow(described_class).to receive(:default_subscriber).and_return(subscriber)
        allow(subscriber).to receive(:subscribe)
        flag = ODS::CancelFlag.new(true)

        expect(subscriber).not_to receive(:recv_event)

        result = described_class.subscribe_for('one.vm.info', :stop_flag => flag) { nil }

        expect(result.message).to include('cancelled')
    end

    it 'uses a monotonic deadline for API subscription timeouts' do
        allow(described_class).to receive(:default_subscriber).and_return(subscriber)
        allow(subscriber).to receive(:subscribe)
        allow(subscriber).to receive(:recv_event)
        allow(Process).to receive(:clock_gettime).and_return(10.0, 12.0)

        result = described_class.subscribe_for('one.vm.info', :timeout => 1) { nil }

        expect(result.message).to include('timed out after 1 seconds')
        expect(subscriber).not_to have_received(:recv_event)
    end

    it 'subscribes unique VM IDs, yields state events and removes every filter' do
        allow(described_class).to receive(:default_subscriber).and_return(subscriber)
        allow(subscriber).to receive(:subscribe_all!)
        allow(subscriber).to receive(:unsubscribe_all!)
        allow(subscriber).to receive(:recv_event).and_return(
            ['state', Base64.strict_encode64('<VM><ID>7</ID></VM>')]
        )
        allow(Process).to receive(:clock_gettime).and_return(10.0, 10.1)

        result = described_class.subscribe_for_state(
            [7, '7', 8], :state => 'ACTIVE', :lcm_state => 'RUNNING', :timeout => 2
        ) do |key, _content, xml|
            expect(key).to eq('state')
            expect(xml.at_xpath('//ID').text).to eq('7')
            raise ODS::StopSubscription
        end

        expect(result).to be_nil
        expect(subscriber).to have_received(:subscribe_all!)
            .with(7, 'ACTIVE', 'RUNNING').once
        expect(subscriber).to have_received(:subscribe_all!)
            .with(8, 'ACTIVE', 'RUNNING').once
        expect(subscriber).to have_received(:unsubscribe_all!)
            .with(7, 'ACTIVE', 'RUNNING').once
        expect(subscriber).to have_received(:unsubscribe_all!)
            .with(8, 'ACTIVE', 'RUNNING').once
    end

    it 'times out state subscriptions without receiving and still removes filters' do
        allow(described_class).to receive(:default_subscriber).and_return(subscriber)
        allow(subscriber).to receive(:subscribe_all!)
        allow(subscriber).to receive(:unsubscribe_all!)
        allow(subscriber).to receive(:recv_event)
        allow(Process).to receive(:clock_gettime).and_return(10.0, 12.0)

        result = described_class.subscribe_for_state(
            [7], :state => 'ACTIVE', :lcm_state => 'RUNNING', :timeout => 1
        ) { nil }

        expect(result.message).to include('timed out after 1 seconds')
        expect(subscriber).not_to have_received(:recv_event)
        expect(subscriber).to have_received(:unsubscribe_all!)
            .with(7, 'ACTIVE', 'RUNNING')
    end

    it 'converts subscription dependency exceptions into errors and cleanup' do
        allow(described_class).to receive(:default_subscriber).and_return(subscriber)
        allow(subscriber).to receive(:subscribe).and_raise('ZMQ down')

        result = described_class.subscribe_for('one.vm.info') { nil }

        expect(result.message).to include('ZMQ down')
        expect(Log).to have_received(:error).with('SUB', /loop crashed/)
        expect(socket).to have_received(:close)
    end

    it 'rejects missing blocks and missing default configuration' do
        expect(described_class.subscribe_for('call').message).to include('block required')
        hide_const('SERVER_CONF') if Object.const_defined?(:SERVER_CONF)
        expect { described_class.default_subscriber }.to raise_error(/SERVER_CONF is not defined/)
    end
end
