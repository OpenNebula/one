require_relative 'shared/spec_helper'

RSpec.describe ODS::UserInputSchema do
    subject(:schema) { described_class.new }

    it 'accepts every supported input type with matching defaults' do
        values = {
            'string' => 'x', 'number' => 2, 'bool' => false,
            'list' => [], 'tuple' => [], 'map' => {}, 'object' => {}
        }

        values.each do |type, default|
            expect(schema.call(:name => type, :type => type, :default => default)).to be_success
        end
    end

    it 'rejects unknown types and defaults whose types do not match' do
        expect(schema.call(:name => 'x', :type => 'secret').errors.to_h)
            .to include(:type)
        expect(schema.call(:name => 'x', :type => 'number', :default => '2').errors.to_h)
            .to include(:default)
    end

    it 'accepts decorated type names after normalization' do
        expect(schema.call(:name => 'items', :type => 'LIST(string)', :default => [])).to be_success
    end
end

RSpec.describe ODS::UserInputsRules do
    let(:contract_class) do
        Class.new(ODS::Schema) do
            params do
                optional(:user_inputs).array(:hash)
                optional(:user_inputs_values).hash
            end

            include ODS::UserInputsRules
        end
    end

    subject(:contract) { contract_class.new }

    def validate(input, value)
        contract.call(:user_inputs => [input],
                      :user_inputs_values => { input[:name].to_sym => value })
    end

    it 'validates string, numeric, boolean, list and map values' do
        expect(validate({ :name => 's', :type => 'string' }, 'ok')).to be_success
        expect(validate({ :name => 'n', :type => 'number' }, 2)).to be_success
        expect(validate({ :name => 'b', :type => 'bool' }, false)).to be_success
        expect(validate({ :name => 'l', :type => 'list' }, [])).to be_success
        expect(validate({ :name => 'm', :type => 'map' }, {})).to be_success
        expect(validate({ :name => 'n', :type => 'number' }, 'bad').errors.to_h).to include(:n)
    end

    it 'rejects missing values and duplicate definitions' do
        result = contract.call(
            :user_inputs => [
                { :name => 'same', :type => 'string' },
                { :name => 'same', :type => 'string' }
            ],
            :user_inputs_values => {}
        )

        expect(result.errors.to_h).to include(:same)
    end

    it 'validates regex, numeric range and enumerated matches' do
        regex = { :name => 'code', :type => 'string', :match => {
            :type => 'string', :values => { :regex => '^ok-' }
        } }
        range = { :name => 'size', :type => 'number', :match => {
            :type => 'number', :values => { :min => 2, :max => 4 }
        } }
        list = { :name => 'zone', :type => 'string', :match => {
            :type => 'list', :values => ['a', 'b']
        } }

        expect(validate(regex, 'ok-1')).to be_success
        expect(validate(regex, 'no').errors.to_h).to include(:code)
        expect(validate(range, 3)).to be_success
        expect(validate(range, 5).errors.to_h).to include(:size)
        expect(validate(list, 'a')).to be_success
        expect(validate(list, 'c').errors.to_h).to include(:zone)
    end

    it 'validates grouped map matches against another input value' do
        inputs = [
            { :name => 'region', :type => 'string' },
            { :name => 'zone', :type => 'string', :match => {
                :type => 'map', :grouped_by => :region,
                :values => { :eu => ['eu-1', 'eu-2'] }
            } }
        ]

        valid = contract.call(
            :user_inputs => inputs,
            :user_inputs_values => { :region => 'eu', :zone => 'eu-2' }
        )
        invalid = contract.call(
            :user_inputs => inputs,
            :user_inputs_values => { :region => 'eu', :zone => 'us-1' }
        )

        expect(valid).to be_success
        expect(invalid.errors.to_h).to include(:zone)
    end

    it 'reports an invalid match definition instead of raising from validation' do
        [
            { :match_type => 'string', :value => 'value' },
            { :match_type => 'number', :value => 1 },
            { :match_type => 'map', :value => 'value' }
        ].each do |example|
            input = {
                :name => 'code', :type => 'string',
                :match => { :type => example[:match_type] }
            }
            result = nil

            expect { result = validate(input, example[:value]) }.not_to raise_error
            expect(result).not_to be_success
        end
    end
end
