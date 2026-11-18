# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may   #
# not use this file except in compliance with the License. You may obtain   #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
# -------------------------------------------------------------------------- #

require 'rspec'
require 'digest'
require 'nokogiri'

# ---------------------------------------------------------------------------
# Minimal stubs so onedb.rb can be loaded without a real OpenNebula install
# ---------------------------------------------------------------------------
ONE_LOCATION      = nil   unless defined?(ONE_LOCATION)
LOCK_FILE         = '/var/lock/one/one' unless defined?(LOCK_FILE)
NOKOGIRI_ENCODING = nil   unless defined?(NOKOGIRI_ENCODING)
LOG_TIME          = false unless defined?(LOG_TIME)

# Stub the Fiddle/RubyVM block that onedb.rb executes at load time
module Fiddle
    module Handle
        DEFAULT = { 'rb_iseq_load' => 0 } unless defined?(DEFAULT)
    end
    class Function
        def initialize(*); end
        def call(*); 0; end
    end
    def self.dlwrap(_); 0; end
end

class RubyVM::InstructionSequence
    def self.load(*); end
end

# Stub OpenNebula client used by one_not_running
module OpenNebula
    def self.is_error?(rc); rc.is_a?(RuntimeError); end
    class Client
        def initialize(*); end
        def get_version; RuntimeError.new('not running'); end
        def one_endpoint; 'http://localhost:2633/RPC2'; end
    end
end

require_relative '../onedb_backend'
require_relative '../onedb'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
VALID_BODY = <<~XML
    <USER>
      <ID>0</ID>
      <NAME>oneadmin</NAME>
      <AUTH_DRIVER>core</AUTH_DRIVER>
      <PASSWORD>oldhash</PASSWORD>
      <TOKEN_PASSWORD>tok123</TOKEN_PASSWORD>
      <TEMPLATE><EXTRA>preserved</EXTRA></TEMPLATE>
    </USER>
XML

def build_onedb(body: VALID_BODY, update_rows: 1)
    db_obj = instance_double('Sequel::Database')
    ds     = instance_double('Sequel::Dataset')

    allow(db_obj).to receive(:[]).with(:user_pool).and_return(ds)
    allow(ds).to receive(:where).with(:oid => 0).and_return(ds)
    allow(ds).to receive(:first).and_return(body.nil? ? nil : { :body => body })
    allow(ds).to receive(:update).and_return(update_rows)

    # transaction yields and returns the block value
    allow(db_obj).to receive(:transaction) do |&blk|
        blk.call
    end

    backend = instance_double('BackEndMySQL')
    allow(backend).to receive(:db).and_return(db_obj)
    allow(backend).to receive(:nokogiri_doc) do |b, _|
        Nokogiri::XML(b) {|c| c.default_xml.noblanks }
    end

    onedb = OneDB.allocate
    onedb.instance_variable_set(:@backend, backend)
    onedb
end

def stub_not_running(onedb)
    allow(File).to receive(:exist?).and_call_original
    allow(File).to receive(:exist?).with(LOCK_FILE).and_return(false)
end

def stub_running(onedb)
    allow(File).to receive(:exist?).and_call_original
    allow(File).to receive(:exist?).with(LOCK_FILE).and_return(true)
end

def stub_password_input(onedb, password, confirm = password)
    inputs = [password, confirm]
    allow(onedb).to receive(:get_password) { inputs.shift }
end

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
RSpec.describe OneDB, '#passwd' do
    describe 'daemon guard' do
        it 'aborts when the lock file is present' do
            onedb = build_onedb
            stub_running(onedb)

            expect { onedb.passwd }.to raise_error(/First stop OpenNebula/)
        end

        it 'proceeds when the lock file is absent and daemon is unreachable' do
            onedb = build_onedb
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.not_to raise_error
        end
    end

    describe 'password input' do
        it 'raises when confirmation does not match' do
            onedb = build_onedb
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass', 'different')

            expect { onedb.passwd }.to raise_error(/Passwords do not match/)
        end

        it 'raises when password is empty' do
            onedb = build_onedb
            stub_not_running(onedb)
            stub_password_input(onedb, '')

            expect { onedb.passwd }.to raise_error(/Password cannot be empty/)
        end
    end

    describe 'database record validation' do
        it 'raises when oid=0 row is missing' do
            onedb = build_onedb(:body => nil)
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.to raise_error(/not found in database/)
        end

        it 'raises on invalid XML' do
            onedb = build_onedb(:body => '<USER><BROKEN')
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.to raise_error(/Invalid XML/)
        end

        it 'raises when root element is not USER' do
            body = VALID_BODY.sub('<USER>', '<NOTUSER>').sub('</USER>', '</NOTUSER>')
            onedb = build_onedb(:body => body)
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.to raise_error(/Unexpected root element/)
        end

        it 'raises when NAME is not oneadmin' do
            body = VALID_BODY.sub('<NAME>oneadmin</NAME>', '<NAME>other</NAME>')
            onedb = build_onedb(:body => body)
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.to raise_error(/NAME mismatch/)
        end

        it 'raises when AUTH_DRIVER is not core' do
            body = VALID_BODY.sub('<AUTH_DRIVER>core</AUTH_DRIVER>',
                                  '<AUTH_DRIVER>ssh</AUTH_DRIVER>')
            onedb = build_onedb(:body => body)
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.to raise_error(/AUTH_DRIVER is not 'core'/)
        end

        it 'raises when PASSWORD element is missing' do
            body = VALID_BODY.sub('<PASSWORD>oldhash</PASSWORD>', '')
            onedb = build_onedb(:body => body)
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.to raise_error(/PASSWORD element not found/)
        end

        it 'raises when more than one PASSWORD element exists' do
            body = VALID_BODY.sub('<PASSWORD>oldhash</PASSWORD>',
                                  '<PASSWORD>a</PASSWORD><PASSWORD>b</PASSWORD>')
            onedb = build_onedb(:body => body)
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.to raise_error(/exactly one PASSWORD/)
        end
    end

    describe 'successful update' do
        let(:password) { 'supersecret' }
        let(:expected_hash) { Digest::SHA256.hexdigest(password) }

        it 'writes the correct SHA-256 hash to the database' do
            onedb    = build_onedb
            backend  = onedb.instance_variable_get(:@backend)
            db_obj   = backend.db
            ds       = db_obj[:user_pool]

            stub_not_running(onedb)
            stub_password_input(onedb, password)

            onedb.passwd

            expect(ds).to have_received(:update) do |args|
                written_xml = args[:body]
                doc = Nokogiri::XML(written_xml)
                expect(doc.at_xpath('/USER/PASSWORD').text).to eq(expected_hash)
            end
        end

        it 'preserves all unrelated XML content' do
            onedb   = build_onedb
            backend = onedb.instance_variable_get(:@backend)
            db_obj  = backend.db
            ds      = db_obj[:user_pool]

            stub_not_running(onedb)
            stub_password_input(onedb, password)

            onedb.passwd

            expect(ds).to have_received(:update) do |args|
                doc = Nokogiri::XML(args[:body])
                expect(doc.at_xpath('/USER/TOKEN_PASSWORD').text).to eq('tok123')
                expect(doc.at_xpath('/USER/TEMPLATE/EXTRA').text).to eq('preserved')
                expect(doc.at_xpath('/USER/NAME').text).to eq('oneadmin')
                expect(doc.at_xpath('/USER/AUTH_DRIVER').text).to eq('core')
            end
        end

        it 'returns 0 on success' do
            onedb = build_onedb
            stub_not_running(onedb)
            stub_password_input(onedb, password)

            expect(onedb.passwd).to eq(0)
        end
    end

    describe 'database update failure' do
        it 'raises when update affects zero rows' do
            onedb = build_onedb(:update_rows => 0)
            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            expect { onedb.passwd }.to raise_error(/Database update failed/)
        end

        it 'rolls back the transaction on failure' do
            onedb   = build_onedb(:update_rows => 0)
            backend = onedb.instance_variable_get(:@backend)
            db_obj  = backend.db

            stub_not_running(onedb)
            stub_password_input(onedb, 'newpass')

            rollback_raised = false
            allow(db_obj).to receive(:transaction) do |&blk|
                begin
                    blk.call
                rescue Sequel::Rollback
                    rollback_raised = true
                end
            end

            onedb.passwd rescue nil
            expect(rollback_raised).to be true
        end
    end
end
