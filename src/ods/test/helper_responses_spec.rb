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
            ODS::ResponseHelper::CONFLICT_EC => 409,
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

        describe 'optional heartbeats' do
            before { OdsSpecSupport.reset_thread_manager }

            it 'writes SSE comments and stops the managed worker on close' do
                output = StringIO.new
                written = Queue.new
                allow(output).to receive(:<<).and_wrap_original do |write, frame|
                    result = write.call(frame)
                    written << frame
                    result
                end
                stream = described_class.new(output)
                worker = stream.start_heartbeat(0.01)

                expect(Timeout.timeout(2) { written.pop }).to eq(": heartbeat\n\n")
                expect(stream.start_heartbeat(0.01)).to equal(worker)
                stream.close

                expect(worker).not_to be_alive
                expect(ODS::ThreadManager.instance.any_alive?).to be(false)
                expect(stream.emit('after-close')).to be(false)
            ensure
                stream&.close
            end

            it 'wakes the worker immediately when closing a long heartbeat interval' do
                stream = described_class.new(StringIO.new)
                waiting = Queue.new
                allow(stream.instance_variable_get(:@condition)).to receive(:wait)
                    .and_wrap_original do |wait, *args|
                    waiting << true
                    wait.call(*args)
                end
                worker = stream.start_heartbeat(15)
                Timeout.timeout(2) { waiting.pop }

                Timeout.timeout(1) { stream.close }

                expect(worker).not_to be_alive
            ensure
                stream&.close
            end

            it 'rejects invalid intervals without starting a worker' do
                stream = described_class.new(StringIO.new)

                [0, -1, Float::INFINITY, Float::NAN].each do |interval|
                    expect { stream.start_heartbeat(interval) }.to raise_error(ArgumentError)
                end
                expect(ODS::ThreadManager.instance.any_alive?).to be(false)
            ensure
                stream&.close
            end

            it 'stops writing after a client disconnects' do
                output = instance_double('Output', :close => nil)
                expect(output).to receive(:<<).once.and_raise(Errno::EPIPE)
                stream = described_class.new(output)
                worker = stream.start_heartbeat(0.01)

                Timeout.timeout(2) { worker.join }

                expect(worker).not_to be_alive
                expect { stream.progress('check', :success) }.to raise_error(
                    ODS::ResponseHelper::StreamClosed
                )
            ensure
                stream&.close
            end

            it 'serializes concurrent progress frames and heartbeat comments' do
                output = StringIO.new
                written = Queue.new
                allow(output).to receive(:<<).and_wrap_original do |write, frame|
                    frame.each_char do |char|
                        write.call(char)
                        Thread.pass
                    end
                    written << frame
                    frame
                end
                stream = described_class.new(output, :event_name => 'progress')
                stream.start_heartbeat(0.001)
                Timeout.timeout(2) { written.pop }

                writers = 2.times.map do |id|
                    Thread.new do
                        10.times {|index| stream.progress('check', :started, [id, index]) }
                    end
                end
                Timeout.timeout(3) { writers.each(&:join) }
                stream.close
                frames = output.string.split("\n\n")
                progress = frames.reject {|frame| frame == ': heartbeat' }

                expect(progress.size).to eq(20)
                progress.each do |frame|
                    expect(frame).to start_with("event: progress\ndata: ")
                    expect(JSON.parse(frame.split('data: ', 2).last)['name']).to eq('check')
                end
            ensure
                writers&.each(&:join)
                stream&.close
            end

            it 'honors managed server shutdown while waiting for the next heartbeat' do
                stream = described_class.new(StringIO.new)
                waiting = Queue.new
                allow(stream.instance_variable_get(:@condition)).to receive(:wait)
                    .and_wrap_original do |wait, *args|
                    waiting << true
                    wait.call(*args)
                end
                worker = stream.start_heartbeat(15)
                Timeout.timeout(2) { waiting.pop }
                deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 2

                expect(ODS::ThreadManager.instance.stop!(:deadline => deadline)).to be(true)
                expect(worker).not_to be_alive
            ensure
                stream&.close
            end
        end
    end

    it 'streams SSE success and close events with configured response metadata' do
        expect(ODS::ThreadManager.instance).not_to receive(:start)
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

    it 'stops heartbeats on failure and still emits failure and close events' do
        OdsSpecSupport.reset_thread_manager
        output = Queue.new
        worker = nil

        helper.stream_events(:heartbeat_interval => 0.01, :close_event => 'complete') do |events|
            worker = events.start_heartbeat(0.01)
            allow(helper.stream_output).to receive(:<<).and_wrap_original do |write, frame|
                result = write.call(frame)
                output << frame
                result
            end
            Timeout.timeout(2) { output.pop }
            raise 'check failed'
        end

        expect(worker).not_to be_alive
        expect(helper.stream_output).to be_closed
        expect(helper.stream_output.string).to include(
            ': heartbeat', 'event: error', '"error":"check failed"', 'event: complete'
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
