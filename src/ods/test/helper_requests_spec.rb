require_relative 'shared/spec_helper'

RSpec.describe ODS::RequestHelper do
    let(:host_class) { Class.new { include ODS::RequestHelper } }
    subject(:helper) { host_class.new }

    def request_for(value, eof: false)
        body = StringIO.new(value)
        allow(body).to receive(:eof?).and_return(eof)
        instance_double('Request', :body => body)
    end

    it 'validates RFC1123 names and their length boundary' do
        expect(described_class.rfc1123_name?('valid-name')).to be(true)
        expect(described_class.rfc1123_name?('a' * 63)).to be(true)
        expect(described_class.rfc1123_name?('A_bad')).to be(false)
        expect(described_class.rfc1123_name?('a' * 64)).to be(false)
    end

    it 'parses JSON objects into deeply symbolized hashes' do
        expect(helper.check_body(request_for('{"outer":{"value":1}}')))
            .to eq(:outer => { :value => 1 })
    end

    it 'rejects empty, malformed and non-object request bodies' do
        expect { helper.check_body(request_for('', :eof => true)) }
            .to raise_error(ODS::RequestHelper::InvalidRequestError, /Missing/)
        expect { helper.check_body(request_for('{')) }
            .to raise_error(ODS::RequestHelper::InvalidRequestError, /Invalid JSON/)
        expect { helper.check_body(request_for('[]')) }
            .to raise_error(ODS::RequestHelper::InvalidRequestError, /must be an object/)
    end

    it 'returns OpenNebula validation errors for invalid bodies and params' do
        schema = Class.new(Dry::Validation::Contract) do
            params { required(:count).filled(:integer) }
        end

        body_error = helper.check_body(request_for('{"count":"x"}'), schema)
        params_error = helper.check_params({ :count => 'x' }, schema)

        expect(OpenNebula.is_error?(body_error)).to be(true)
        expect(body_error.errno).to eq(OpenNebula::Error::ENOTDEFINED)
        expect(OpenNebula.is_error?(params_error)).to be(true)
    end
end
