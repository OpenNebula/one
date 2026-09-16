require_relative 'shared/spec_helper'

RSpec.describe ODS::Validator do
    let(:schema) do
        {
            'name' => { :type => 'string', :required => true },
            'workers' => { :type => :integer, :default => 4, :min => 1 },
            'enabled' => { :type => :boolean, :default => true },
            'bind' => { :type => :address },
            'mode' => { :type => :string, :allowed => ['dev', 'prod'] },
            'nested' => {
                :type => :object,
                :keys => {
                    'enabled' => { :type => :string, :default => 'yes' }
                }
            }
        }
    end

    it 'normalizes string and symbol keys and applies nested defaults' do
        result = described_class.validate(
            {
                'name' => 'ods', :bind => '127.0.0.1', 'mode' => 'prod',
                :nested => { 'extra' => true }
            },
            schema
        )

        expect(result).to eq(
            :name => 'ods', :workers => 4, :enabled => true, :bind => '127.0.0.1',
            :mode => 'prod', :nested => { :enabled => 'yes' }
        )
    end

    it 'preserves extras only when requested at each object level' do
        permissive = {
            :server => {
                :type => :object,
                :allow_extra => true,
                :keys => { :port => { :type => :integer } }
            }
        }

        expect(
            described_class.validate(
                { 'top_extra' => 1, :server => { 'port' => 80, 'extra' => 2 } },
                permissive
            )
        ).to eq(:server => { :port => 80, 'extra' => 2 })
    end

    {
        'missing required' => [{}, 'Missing required key: name'],
        'wrong string type' => [{ :name => 1 }, 'expected String'],
        'wrong integer type' => [{ :name => 'ods', :workers => '4' }, 'expected Integer'],
        'wrong boolean type' => [{ :name => 'ods', :enabled => 'true' }, 'expected Boolean'],
        'invalid address' => [{ :name => 'ods', :bind => 'not-an-ip' }, 'Invalid address'],
        'wrong object type' => [{ :name => 'ods', :nested => [] }, 'expected Hash'],
        'disallowed value' => [{ :name => 'ods', :mode => 'qa' }, 'Invalid value for mode'],
        'below minimum' => [{ :name => 'ods', :workers => 0 }, '(min: 1)']
    }.each do |label, (config, message)|
        it "rejects #{label}" do
            expect { described_class.validate(config, schema) }
                .to raise_error(described_class::ValidationError, /#{Regexp.escape(message)}/)
        end
    end

    it 'rejects unknown schema types with the full nested path' do
        invalid = { :server => { :type => :object, :keys => { :flag => { :type => :bool } } } }

        expect { described_class.validate({ :server => { :flag => true } }, invalid) }
            .to raise_error(described_class::ValidationError, /Unknown type for server.flag/)
    end
end
