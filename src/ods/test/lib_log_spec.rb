require_relative 'shared/spec_helper'

RSpec.describe ODS::Log do
    it 'formats severity, component and timestamp consistently' do
        logger = described_class.new(
            :name => 'ods-spec', :path => Dir.tmpdir, :type => 'stderr',
            :level => Logger::DEBUG
        )
        backend = logger.instance_variable_get(:@logger)
        allow(backend).to receive(:info)

        logger.info('API', 'ready')

        expect(backend).to have_received(:info).with('[API]: ready')
        formatted = backend.formatter.call('INFO', Time.at(0), nil, 'message')
        expect(formatted).to match(/\[I\] message\n\z/)
    end

    it 'rejects unknown facilities and maps configured debug levels' do
        expect do
            described_class.new(:name => 'ods', :path => Dir.tmpdir, :type => 'unknown')
        end.to raise_error(RuntimeError, /Unknown log facility/)
        expect(described_class::DEBUG_LEVEL).to include(
            0 => Logger::ERROR, 1 => Logger::WARN, 2 => Logger::INFO, 3 => Logger::DEBUG
        )
    end

    it 'writes enabled resource logs and suppresses messages below the logger level' do
        name = "ods-spec-#{SecureRandom.hex(6)}"
        logger = described_class.new(
            :name => name, :path => Dir.tmpdir, :type => 'file',
            :level => Logger::INFO
        )
        resource_file = File.join(LOG_LOCATION, name, '7.log')

        logger.debug('JOB', 'hidden', 7)
        logger.info('JOB', 'visible', 7)

        expect(File.read(resource_file)).to include('[I] [JOB]: visible')
        expect(File.read(resource_file)).not_to include('hidden')
    ensure
        FileUtils.rm_f(resource_file) if resource_file
        resource_directory = File.dirname(resource_file) if resource_file
        Dir.rmdir(resource_directory) if resource_directory && Dir.exist?(resource_directory)
    end

    it 'logs resource file failures to the main backend without raising' do
        logger = described_class.new(
            :name => 'ods-spec', :path => Dir.tmpdir, :type => 'file',
            :level => Logger::INFO
        )
        backend = logger.instance_variable_get(:@logger)
        allow(FileUtils).to receive(:mkdir_p).and_raise('disk full')
        allow(backend).to receive(:error)

        expect { logger.info('JOB', 'value', 7) }.not_to raise_error
        expect(backend).to have_received(:error).with(/disk full/)
    end

    it 'adapts IO-style writes to main INFO messages' do
        logger = described_class.new(
            :name => 'ods-spec', :path => Dir.tmpdir, :type => 'stderr'
        )
        expect(logger).to receive(:info).with('MAIN', 'line')
        logger.write("line\n")
    end

    it 'logs extra configuration while omitting sensitive schema attributes' do
        stub_const('SERVER_CONF', {
                       :ee_token => 'secret',
                       :extra => 'visible',
                       :server => { :port => 13013, :extra => true },
                       :credentials => {
                           :user => 'alice', :password => 'hidden', :provider => 'custom'
                       }
                   })
        stub_const('SCHEMA_CONF', {
                       :ee_token => { :type => :string, :sensitive => true },
                       :server => {
                           :type => :object,
                           :keys => { :port => { :type => :integer } }
                       },
                       :credentials => {
                           :type => :object,
                           :keys => {
                               :user => { :type => :string },
                               :password => { :type => :string, :sensitive => true }
                           }
                       }
                   })
        expected = {
            :extra => 'visible',
            :server => { :port => 13013, :extra => true },
            :credentials => { :user => 'alice', :provider => 'custom' }
        }
        allow(described_class).to receive(:info)

        described_class.log_config

        expect(described_class).to have_received(:info).with(
            'SRV', "Initializing #{ODS_NAME} server:\n#{expected.to_yaml}"
        )
        expect(SERVER_CONF).to include(:ee_token => 'secret')
        expect(SERVER_CONF[:credentials]).to include(:password => 'hidden')
    end
end

RSpec.describe ODS::LogsHelper do
    let(:helper_class) { Class.new { include ODS::LogsHelper } }
    subject(:helper) { helper_class.new }

    it 'classifies all supported log severities and defaults to debug' do
        expect(helper.get_log_level('x [I] info')).to include('level' => 'info')
        expect(helper.get_log_level('x [D] debug')).to include('level' => 'debug')
        expect(helper.get_log_level('x [E] error')).to include('level' => 'error')
        expect(helper.get_log_level('x [W] warn')).to include('level' => 'warn')
        expect(helper.get_log_level('plain')).to eq('level' => 'debug', 'text' => 'plain')
    end

    it 'paginates newest entries while returning each page in chronological order' do
        file = Tempfile.new('ods-log')
        5.times {|index| file.puts("line #{index + 1}") }
        file.close

        page = helper.get_logs_page(file.path, 1, 2)
        second = helper.get_logs_page(file.path, 2, 2)

        expect(page[:meta]).to include('total_lines' => 5, 'total_pages' => 3, 'page' => 1)
        expect(page[:lines].map {|line| line['text'] }).to eq(['line 4', 'line 5'])
        expect(second[:lines].map {|line| line['text'] }).to eq(['line 2', 'line 3'])
    ensure
        file&.unlink
    end

    it 'returns complete history in original order when all mode is requested' do
        file = Tempfile.new('ods-log')
        file.write("one\ntwo\n")
        file.close

        result = helper.get_logs_page(file.path, 99, 1, true)

        expect(result[:meta]).to eq('mode' => 'all', 'total_lines' => 2)
        expect(result[:lines].map {|line| line['text'] }).to eq(['one', 'two'])
    ensure
        file&.unlink
    end
end
