require 'base64'
require 'fileutils'
require 'json'
require 'logger'
require 'open3'
require 'securerandom'
require 'singleton'
require 'stringio'
require 'syslog/logger'
require 'timeout'
require 'tempfile'
require 'tmpdir'

ODS_SOURCE_ROOT = ENV.fetch('ODS_SOURCE_ROOT', File.expand_path('../..', __dir__))

raise LoadError, "ODS source root not found at #{ODS_SOURCE_ROOT}; set ODS_SOURCE_ROOT" \
    unless File.directory?(ODS_SOURCE_ROOT)

# Mirror ODS runtime paths while keeping test logs in a temporary directory
ONE_LOCATION = ENV['ONE_LOCATION'] unless defined?(ONE_LOCATION)

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    VAR_LOCATION      = '/var/lib/one'
    ETC_LOCATION      = '/etc/one'
    LIB_LOCATION      = '/usr/lib/one'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    VAR_LOCATION      = ONE_LOCATION + '/var'
    ETC_LOCATION      = ONE_LOCATION + '/etc'
    LIB_LOCATION      = ONE_LOCATION + '/lib'
end

require 'load_opennebula_paths'

$LOAD_PATH << RUBY_LIB_LOCATION
$LOAD_PATH << RUBY_LIB_LOCATION + '/cloud'

one_root = File.expand_path('../..', ODS_SOURCE_ROOT)

['src/oca/ruby', 'src/cli', 'src/mad/ruby'].reverse_each do |relative_path|
    path = File.join(one_root, relative_path)
    $LOAD_PATH.unshift(path) if File.directory?(path) && !$LOAD_PATH.include?(path)
end

require 'dry-validation'
require 'nokogiri'
require 'ffi-rzmq'
require 'opennebula'
require 'CommandManager'

ODS_NAME    = 'ODS-SPEC' unless defined?(ODS_NAME)
APP_NAME    = 'ods-spec' unless defined?(APP_NAME)
LOG_LOCATION = Dir.tmpdir unless defined?(LOG_LOCATION)

# Minimal Puma namespace required while loading ODS source files
module Puma

    class ConnectionError < StandardError; end unless const_defined?(:ConnectionError)

end

# Test-only OpenNebula namespace extensions required by ODS loading
module OpenNebula

    # Placeholder server namespace used by isolated ODS specs
    module DocumentServer
    end

end

SOURCE_FILES = [
    'lib/hash.rb',
    'config/validator.rb',
    'lib/log.rb',
    'lib/thread_manager.rb',
    'lib/command.rb',
    'lib/jobs/job.rb',
    'lib/jobs/workflow.rb',
    'lib/jobs/scheduler.rb',
    'lib/modules/state_machine.rb',
    'lib/modules/errorable.rb',
    'lib/modules/historyable.rb',
    'lib/modules/jobable.rb',
    'app/models/schema.rb',
    'app/models/document.rb',
    'app/models/pool.rb',
    'lib/helpers/request_helper.rb',
    'lib/helpers/response_helper.rb',
    'lib/helpers/log_helper.rb',
    'lib/event_manager.rb',
    'lib/subscriber.rb',
    'app/controllers/auth_controller.rb',
    'app/controllers/error_controller.rb',
    'app/controllers/generic_controller.rb',
    'app/controllers/document_controller.rb',
    'app/routes.rb',
    'lib/helpers/one/resource.rb',
    'lib/helpers/one/cluster.rb',
    'lib/helpers/one/datastore.rb',
    'lib/helpers/one/host.rb',
    'lib/helpers/one/image.rb',
    'lib/helpers/one/marketplace.rb',
    'lib/helpers/one/template.rb',
    'lib/helpers/one/vm.rb',
    'lib/helpers/one/vnet.rb',
    'lib/helpers/one/vrouter.rb'
].freeze unless defined?(SOURCE_FILES)

SOURCE_FILES.each {|file| require File.join(ODS_SOURCE_ROOT, file) }

raise(
    LoadError, "ODS bootstrap did not define OpenNebula::DocumentServer from #{ODS_SOURCE_ROOT}"
) unless defined?(OpenNebula::DocumentServer)

ODS = OpenNebula::DocumentServer unless defined?(ODS)
Log = ODS::Log unless defined?(Log)

require_relative 'synchronization'
require_relative 'fakes'

RSpec.configure do |config|
    config.expect_with :rspec do |expectations|
        expectations.include_chain_clauses_in_custom_matcher_descriptions = true
    end

    config.mock_with :rspec do |mocks|
        mocks.verify_partial_doubles = true
    end

    config.shared_context_metadata_behavior = :apply_to_host_groups
    config.order = :random
    Kernel.srand config.seed

    config.before do
        allow(Log).to receive(:debug)
        allow(Log).to receive(:info)
        allow(Log).to receive(:warn)
        allow(Log).to receive(:error)
        allow(Log).to receive(:debug?).and_return(false)
    end

    config.after do
        OdsSpecSupport.cleanup_managed_threads
    end
end
