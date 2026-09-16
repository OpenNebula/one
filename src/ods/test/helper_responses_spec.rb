require_relative 'shared/spec_helper'

RSpec.describe ODS::ResponseHelper do
    let(:host_class) do
        Class.new do
            include ODS::ResponseHelper

            attr_reader :status_value, :body_value, :content_type_value,
                        :headers_value, :stream_output

            def initialize(content_type = 'application/json')
                @request = Struct.new(:env).new({ 'CONTENT_TYPE' => content_type })
            end

            attr_reader :request

            def status(value)
                @status_value = value
            end

            def body(value)
                @body_value = value
            end

            def content_type(value)
                @content_type_value = value
            end

            def headers(value)
                @headers_value = value
            end

            def stream
                @stream_output = StringIO.new
                yield @stream_output
                @stream_output
            end
        end
    end

    subject(:helper) { host_class.new }

    it 'maps every OpenNebula error family to its HTTP status' do
        mapping = {
            OpenNebula::Error::ESUCCESS => 200,
            OpenNebula::Error::ENOTDEFINED => 400,
            OpenNebula::Error::EAUTHORIZATION => 401,
            OpenNebula::Error::EAUTHENTICATION => 403,
            OpenNebula::Error::ENO_EXISTS => 404,
            OpenNebula::Error::EACTION => 405,
            OpenNebula::Error::EXML_RPC_CALL => 502,
            OpenNebula::Error::EINTERNAL => 500,
            OpenNebula::Error::EALLOCATE => 507
        }

        codes = mapping.transform_values do |_|
            nil
        end.keys
        actual = codes.to_h {|code| [code, helper.one_error_to_http(code)] }

        expect(actual).to eq(mapping)
        expect(helper.one_error_to_http(-99)).to eq(500)
    end

    it 'sanitizes API method markers and attaches structured context' do
        helper.internal_error(
            { 'message' => '[one.vm.info] Failed [42].', 'context' => { 'id' => 42 } },
            400
        )
        payload = JSON.parse(helper.body_value)

        expect(helper.status_value).to eq(400)
        expect(payload).to include('message' => 'Failed 42', 'context' => { 'id' => 42 })
    end

    it 'converts generic exceptions and includes backtraces only in debug mode' do
        error = RuntimeError.new('broken')
        error.set_backtrace(['first.rb:1'])
        allow(Log).to receive(:debug?).and_return(false, true)

        helper.general_error(error)
        expect(JSON.parse(helper.body_value)).not_to have_key('context')

        helper.general_error(error)
        expect(JSON.parse(helper.body_value).dig('context', 'backtrace')).to eq('first.rb:1')
    end

    it 'serializes JSON arrays with per-object options' do
        items = [instance_double('Item'), instance_double('Item')]
        allow(items[0]).to receive(:to_json).with(:public).and_return('{"id":1}')
        allow(items[1]).to receive(:to_json).with(:public).and_return('{"id":2}')

        expect(helper.process_response(items) { :public }).to eq('[{"id":1},{"id":2}]')
        expect(helper.content_type_value).to eq(:json)
    end

    it 'always uses safe JSON serialization regardless of the request content type' do
        item = instance_double('Item')
        allow(item).to receive(:to_json)
            .with(:public)
            .and_return('{"password":"__redacted__"}')
        expect(item).not_to receive(:to_s)

        ['text/plain', 'application/json; charset=utf-8'].each do |request_content_type|
            host = host_class.new(request_content_type)

            expect(host.process_response([item]) { :public })
                .to eq('[{"password":"__redacted__"}]')
            expect(host.content_type_value).to eq(:json)
        end
    end

    describe ODS::ResponseHelper::EventStream do
        it 'writes valid SSE events, progress payloads and closes the output' do
            output = StringIO.new
            stream = described_class.new(output, :event_name => 'progress')

            expect(stream.progress('apply', :started, { :id => 1 })).to be(true)
            expect(output.string).to include('event: progress')
            expect(output.string).to include('"state":"started"')
            expect { stream.close }.not_to raise_error
        end

        it 'acts as a callable object and a Proc adapter' do
            output = StringIO.new
            stream = described_class.new(output)

            expect(stream.call(:first, :id => 1)).to be(true)
            expect(stream.to_proc.call(:second, :id => 2)).to be(true)
            expect(output.string).to include('event: first', 'event: second')
        end

        it 'marks broken streams closed and optionally raises StreamClosed' do
            output = instance_double('Output')
            allow(output).to receive(:<<).and_raise(IOError)
            stream = described_class.new(output)

            expect(stream.emit(:event, {})).to be(false)
            expect { stream.progress('x', 'y') }.to raise_error(ODS::ResponseHelper::StreamClosed)
            expect(stream.progress('x', 'y', nil, :abort_on_close => false)).to be(false)
        end
    end

    it 'streams SSE success and close events with configured response metadata' do
        result = helper.stream_events(
            :event_name => 'progress', :close_event => 'complete',
            :close_payload => { :ok => true }, :status_code => 202,
            :headers => { 'X-Test' => 'yes' }
        ) do |events|
            events.progress('apply', :started)
        end

        expect(result).to equal(helper.stream_output)
        expect(helper.status_value).to eq(202)
        expect(helper.content_type_value).to eq('text/event-stream')
        expect(helper.headers_value).to include(
            'Cache-Control' => 'no-cache', 'X-Test' => 'yes'
        )
        expect(helper.stream_output.string).to include(
            'event: progress', 'event: complete', '"ok":true'
        )
    end

    it 'emits default failures or delegates stream errors to a handler' do
        helper.stream_events { raise 'stream failed' }
        expect(helper.stream_output.string).to include(
            'event: error', '"error":"stream failed"'
        )

        handled = []
        handler = proc {|events, error|
            handled << error.message
            events.emit('handled')
        }
        helper.stream_events(:error_handler => handler) { raise 'custom failed' }
        expect(handled).to eq(['custom failed'])
        expect(helper.stream_output.string).to include('event: handled')
    end
end

RSpec.describe ODS::ValidationError do
    it 'retains structured validation context and defaults to an internal error' do
        error = described_class.new('invalid', :context => { :name => ['missing'] })

        expect(error.message).to eq('invalid')
        expect(error.context).to eq(:name => ['missing'])
        expect(error.errno).to eq(OpenNebula::Error::EINTERNAL)
    end
end
