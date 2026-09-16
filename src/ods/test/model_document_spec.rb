require_relative 'shared/spec_helper'

RSpec.describe ODS::Document do
    let(:attribute_class) do
        Class.new do
            def self.json_create(value)
                [:wrapped, value]
            end
        end
    end

    let(:schema) { instance_double(Dry::Validation::Contract) }
    let(:document_class) do
        attr_class = attribute_class
        validation_schema = schema

        klass = Class.new(described_class) do
            define_singleton_method(:schema) { validation_schema }
        end
        klass.const_set(:TEMPLATE_TAG, 'BODY')
        klass.const_set(
            :DOCUMENT_ATTRS,
            [:name, :settings, :items, :user_inputs, :user_inputs_values].freeze
        )
        klass.const_set(:UPDATE_ATTRS, [:name, :settings, :user_inputs_values].freeze)
        klass.const_set(:ATTRIBUTE_CLASSES, { :items => attr_class }.freeze)
        klass.const_set(:RESOURCE_NAME, 'widget')
        klass
    end

    let(:document) do
        document_class.allocate.tap do |item|
            item.instance_variable_set(:@body, {
                                           'name' => 'old', 'settings' => { 'one' => 1 },
                'items' => [{ 'id' => 1 }],
                'user_inputs' => [
                    { 'name' => 'password', 'type' => 'string', 'sensitive' => true },
                    { 'name' => 'public', 'type' => 'string' }
                ],
                'user_inputs_values' => { 'password' => 'secret', 'public' => 'visible' }
                                       })
        end
    end

    before do
        allow_any_instance_of(OpenNebula::DocumentJSON).to receive(:info).and_return(nil)
        allow_any_instance_of(OpenNebula::DocumentJSON).to receive(:update).and_return(nil)
        allow_any_instance_of(OpenNebula::DocumentJSON).to receive(:allocate).and_return(17)
        allow(document).to receive(:rename).and_return(nil)
        allow(document).to receive(:to_hash).and_return(
            'DOCUMENT' => { 'TEMPLATE' => { 'BODY' => {} } }
        )
    end

    it 'validates documents and returns structured schema failures' do
        success = instance_double(Dry::Validation::Result, :failure? => false)
        failure = instance_double(
            Dry::Validation::Result,
            :failure? => true,
            :errors => instance_double(Dry::Schema::MessageSet, :to_h => { :name => ['missing'] })
        )
        allow(schema).to receive(:call).and_return(success, failure)

        expect(document_class.validate(:name => 'ok')).to be_nil
        result = document_class.validate({})
        expect(OpenNebula.is_error?(result)).to be(true)
        expect(result.message['message']).to eq('Error validating document')
    end

    it 'loads, symbolizes and deserializes declared document attributes' do
        expect(document.info).to be_a(Hash)

        expect(document.name).to eq('old')
        expect(document.settings).to eq(:one => 1)
        expect(document.items).to eq([[:wrapped, { :id => 1 }]])
        document.name = 'new'
        expect(document.name).to eq('new')
    end

    it 'supports raw loading and explicit accessor skips' do
        document.info(:raw => true, :skip_methods => [:items])

        expect(document.instance_variable_get(:@body)[:items]).to eq([{ :id => 1 }])
        expect(document).not_to respond_to(:items)
    end

    it 'rewrites generic info errors with the concrete resource name' do
        error = OpenNebula::Error.new(
            '[one.document.info] Error getting document [17].',
            OpenNebula::Error::ENO_EXISTS
        )

        result = document.custom_info_error(error)

        expect(result.message).to eq('[one.document.info] Error getting widget [17].')
        expect(result.errno).to eq(OpenNebula::Error::ENO_EXISTS)
        expect(document.custom_info_error(OpenNebula::Error.new('other'))).to be_a(OpenNebula::Error)
    end

    it 'filters allocation attributes, validates first and reloads the allocated body' do
        valid = instance_double(Dry::Validation::Result, :failure? => false)
        allow(schema).to receive(:call).and_return(valid)
        allow(document).to receive(:info).and_return(nil)
        template = { :name => 'demo', :settings => {}, :ignored => true }
        expect(document.allocate(template)).to be_nil
        expect(schema).to have_received(:call).with(template)
        expect(document).to have_received(:info)
    end

    it 'merges only allowed updates, ignores redacted values and renames when needed' do
        document.info(:raw => true)

        expect(document.update(
                   :name => 'new',
                   :settings => { :two => 2, :secret => ODS::Document::REDACTED_MARK },
                   :user_inputs_values => {
                       :password => ODS::Document::REDACTED_MARK, :public => 'changed'
                   },
                   :ignored => 'value'
               )).to be_a(Hash)

        expect(document.name).to eq('new')
        expect(document.settings).to eq(:one => 1, :two => 2)
        expect(document.user_inputs_values).to eq(:password => 'secret', :public => 'changed')
        expect(document).to have_received(:rename).with('new')
    end

    it 'rejects malformed JSON and propagates rename or persistence errors' do
        document.info(:raw => true)
        expect(document.update('[]').message).to include('expected a JSON object')
        expect(document.update('{').message).to include('Error updating document')

        allow(document).to receive(:rename).and_return(OpenNebula::Error.new('rename failed'))
        expect(document.update(:name => 'new').message).to eq('rename failed')
    end

    it 'redacts sensitive values without mutating the stored body' do
        document.info(:raw => true)

        public_body = document.to_h.dig('DOCUMENT', 'TEMPLATE', 'BODY')
        private_body = document.to_h(:include_sensitive => true).dig(
            'DOCUMENT', 'TEMPLATE', 'BODY'
        )

        expect(public_body.dig(:user_inputs_values, :password))
            .to eq(ODS::Document::REDACTED_MARK)
        expect(public_body.dig(:user_inputs_values, :public)).to eq('visible')
        expect(private_body.dig(:user_inputs_values, :password)).to eq('secret')
        expect(document.user_inputs_values[:password]).to eq('secret')
    end

    it 'returns a plain representation of declared accessors' do
        document.info(:raw => true)
        allow(document).to receive(:id).and_return(17)

        expect(document.plain_body).to include(
            :id => 17, :name => 'old', :settings => { :one => 1 }
        )
    end
end
