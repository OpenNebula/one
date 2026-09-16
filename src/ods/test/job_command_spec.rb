require_relative 'shared/spec_helper'

RSpec.describe ODS::Command::Result do
    it 'represents successful output without an error' do
        result = described_class.new(:exit_code => 0, :stdout => "ok\n", :stderr => nil)

        expect(result).to be_success
        expect(result.stdout).to eq("ok\n")
        expect(result.error).to be_nil
    end

    it 'prefers a formatter, then stderr, then a generic failure' do
        formatter = proc {|stdout, stderr, code| "#{code}:#{stdout}:#{stderr}" }
        formatted = described_class.new(
            :exit_code => 2, :stdout => 'out', :stderr => 'err', :stderr_formatter => formatter
        )
        stderr = described_class.new(:exit_code => 2, :stdout => '', :stderr => 'bad')
        generic = described_class.new(:exit_code => 2, :stdout => '', :stderr => '')

        expect(formatted.error).to eq('2:out:err')
        expect(stderr.error).to eq('bad')
        expect(generic.error).to eq('Command failed with exit status 2')
    end

    it 'falls back when the formatter raises or returns an empty message' do
        raising = proc { raise 'formatter failed' }
        empty = proc { '' }

        expect(described_class.new(
            :exit_code => 1, :stdout => '', :stderr => 'bad', :stderr_formatter => raising
        ).error).to eq('bad')
        expect(described_class.new(
            :exit_code => 1, :stdout => '', :stderr => 'bad', :stderr_formatter => empty
        ).error).to eq('bad')
    end
end

RSpec.describe ODS::Command do
    let(:cwd) { Dir.tmpdir }
    let(:execution_class) { described_class.const_get(:Execution, false) }
    let(:execution) do
        instance_double(
            execution_class,
            :run => 0, :code => 0, :stdout => 'out', :stderr => '', :cancel => true
        )
    end

    before do
        allow(execution_class).to receive(:new).and_return(execution)
    end

    def build(**options)
        described_class.new(
            ['tool', '--flag'],
            :owner_id => 7,
            :operation => :apply,
            :cwd => cwd,
            :cancel_signal => 'TERM',
            :cancel_grace => 1,
            **options
        )
    end

    it 'validates construction and exposes a pending snapshot' do
        command = build(:env => { 'A' => 'B' })

        expect(command.info).to include(
            :status => :pending, :operation => :apply, :argv => ['tool', '--flag'],
            :exit_code => nil
        )

        invalid = described_class.build([], :owner_id => 7, :cwd => cwd)
        expect(OpenNebula.is_error?(invalid)).to be(true)
        expect(invalid.message).to include('non-empty Array')
    end

    it 'rejects invalid identifiers, argv, cwd, env and cancellation options' do
        expect { build(:component => '') }.to raise_error(ArgumentError, /component/)
        expect { build(:env => []) }.to raise_error(ArgumentError, /env/)
        expect { build(:cancel_grace => -1) }.to raise_error(ArgumentError, /grace/)
        expect { build(:stdout_formatter => :no) }.to raise_error(ArgumentError, /callable/)
        expect do
            described_class.new(
                ['x'], :owner_id => 1, :operation => :x, :cwd => '/missing',
                :cancel_signal => 'TERM', :cancel_grace => 1
            )
        end.to raise_error(ArgumentError, /not a directory/)
    end

    it 'runs exactly once, logs through the configured component and stores success' do
        command = build(:component => :terraform)
        result = command.run

        expect(result).to be_success
        expect(command.status).to eq(:success)
        expect(command.info[:exit_code]).to eq(0)
        expect(execution_class).to have_received(:new).with(
            ['tool', '--flag'], kind_of(Proc), nil,
            hash_including(:cwd => cwd, :cancel_signal => 'TERM')
        )

        second = command.run
        expect(second).not_to be_success
        expect(second.error).to include('already executed')
        expect(command.result).to equal(result)
    end

    it 'stores command failures and formatter-derived error messages' do
        allow(execution).to receive(:code).and_return(4)
        allow(execution).to receive(:stderr).and_return('raw')
        formatter = proc {|_, stderr, code| "exit #{code}: #{stderr}" }
        command = build(:stderr_formatter => formatter)

        result = command.run

        expect(command.status).to eq(:error)
        expect(result.error).to eq('exit 4: raw')
    end

    it 'cancels pending work and prevents execution' do
        command = build

        expect(command.cancel).to be_nil
        result = command.run

        expect(result.error).to include('was cancelled')
        expect(execution_class).not_to have_received(:new)
    end

    it 'forwards cancellation to a running execution without blocking observers' do
        entered = OdsSpecSupport::Gate.new
        release = OdsSpecSupport::Gate.new
        allow(execution).to receive(:run) do
            entered.open
            release.wait
            0
        end
        command = build
        runner = Thread.new { command.run }

        entered.wait
        expect(command.info[:status]).to eq(:running)
        expect(command.cancel).to be(true)
        expect(execution).to have_received(:cancel).once
        release.open
        runner.join
    end

    describe 'Execution internals' do
        before do
            allow(execution_class).to receive(:new).and_call_original
        end

        subject(:internal) do
            execution_class.new(
                ['tool'], proc {|level, message| logs << [level, message] }, nil,
                :env => {}, :cwd => cwd, :cancel_signal => 'TERM', :cancel_grace => 0,
                :stdout_formatter => formatter
            )
        end

        let(:logs) { [] }
        let(:formatter) { proc {|line| [:info, line.upcase] } }

        it 'captures streams, formats supported output and ignores formatter errors' do
            output = internal.send(:read_stream, StringIO.new("one\n\n"), :debug, formatter)
            expect(output).to eq("one\n\n")
            expect(logs).to eq([[:info, 'ONE']])

            bad = proc { raise 'bad formatter' }
            expect(internal.send(:format_stdout, 'line', :debug, bad)).to eq([:debug, 'line'])
            expect(internal.send(:format_stdout, 'line', :debug, proc { [:fatal, 'x'] }))
                .to eq([:debug, 'line'])
        end

        it 'maps timeout and internal execution errors to exit code 255' do
            allow(internal).to receive(:execute).and_raise(Timeout::Error)
            expect(internal.run).to eq(255)
            expect(internal.stderr).to include('Timeout executing')
            expect(logs).to include([:error, a_string_including('Timeout executing')])
        end

        it 'executes argv through Open3 and captures both streams without a shell' do
            stdin = instance_double(IO, :close => nil)
            stdout = StringIO.new("out\n")
            stderr = StringIO.new("warning\n")
            status = double('status', :exited? => true, :exitstatus => 0)
            wait_thread = double('wait thread', :pid => 123, :value => status)
            allow(Open3).to receive(:popen3)
                .and_yield(stdin, stdout, stderr, wait_thread)
            allow(Process).to receive(:getpgid).with(123).and_return(456)

            expect(internal.run).to eq(0)
            expect(internal.stdout).to eq("out\n")
            expect(internal.stderr).to eq("warning\n")
            expect(Open3).to have_received(:popen3).with(
                {}, 'tool', hash_including(:pgroup => true, :chdir => cwd)
            )
            expect(logs).to include([:info, 'OUT'], [:warn, 'warning'])
        end

        it 'uses a process group when available and falls back to the process ID' do
            allow(Process).to receive(:getpgid).with(123).and_return(456)
            expect(internal.send(:process_target, 123)).to eq(-456)

            allow(Process).to receive(:getpgid).with(123).and_raise(Errno::ESRCH)
            expect(internal.send(:process_target, 123)).to eq(123)
        end

        it 'waits directly without a timeout and terminates on timeout' do
            status = double('status')
            wait_thread = double('wait thread', :value => status)

            expect(internal.send(:wait_for, wait_thread, -123)).to equal(status)

            timed = execution_class.new(
                ['tool'], nil, 1,
                :env => {}, :cwd => cwd, :cancel_signal => 'TERM',
                :cancel_grace => 0, :stdout_formatter => nil
            )
            allow(Timeout).to receive(:timeout).and_raise(Timeout::Error)
            allow(timed).to receive(:terminate)

            expect { timed.send(:wait_for, wait_thread, -123) }
                .to raise_error(Timeout::Error)
            expect(timed).to have_received(:terminate).with(-123)
        end

        it 'tracks cooperative cancellation and passive termination deterministically' do
            allow(internal).to receive(:terminate).and_return(:terminated)
            internal.instance_variable_set(:@process_target, -123)

            expect(internal.send(:cancelled?)).to be(false)
            expect(internal.cancel).to eq(:terminated)
            expect(internal.send(:cancelled?)).to be(true)
            expect(internal).to have_received(:terminate).with(
                -123, :signal => 'TERM', :grace => 0
            )

            internal.instance_variable_set(:@process_target, nil)
            expect(internal.send(:terminated?, -123, 0)).to be(true)
            internal.instance_variable_set(:@process_target, -123)
            allow(Process).to receive(:clock_gettime).and_return(10.0)
            expect(internal.send(:terminated?, -123, 0)).to be(false)
        end

        it 'sends TERM then KILL only when graceful termination does not finish' do
            allow(Process).to receive(:kill)
            allow(internal).to receive(:terminated?).and_return(false)

            internal.send(:terminate, 123, :signal => 'INT', :grace => 0)

            expect(Process).to have_received(:kill).with('INT', 123).ordered
            expect(Process).to have_received(:kill).with('KILL', 123).ordered
        end
    end
end
