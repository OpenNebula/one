require_relative 'shared/spec_helper'

RSpec.describe Hash do
    describe '#deep_merge' do
        it 'recursively merges hashes without mutating either input' do
            left = { :nested => { :one => 1 }, :value => 'old' }
            right = { :nested => { :two => 2 }, :value => 'new' }

            expect(left.deep_merge(right)).to eq(
                :nested => { :one => 1, :two => 2 }, :value => 'new'
            )
            expect(left).to eq(:nested => { :one => 1 }, :value => 'old')
        end

        it 'combines scalar arrays and removes duplicate hash entries' do
            expect({ :v => [1] }.deep_merge(:v => [1, 2])).to eq(:v => [1, 1, 2])
            expect({ :v => [{ :a => 1 }] }.deep_merge(:v => [{ :a => 1 }]))
                .to eq(:v => [{ :a => 1 }])
        end

        it 'replaces arrays when array merging is disabled' do
            expect({ :v => [1] }.deep_merge({ :v => [2] }, false)).to eq(:v => [2])
        end
    end

    describe '#deep_symbolize_keys' do
        it 'symbolizes nested hashes and hashes within arrays' do
            source = { 'UPPER' => { 'Nested' => 1 }, 'list' => [{ 'Key' => 2 }, 'raw'] }

            expect(source.deep_symbolize_keys(:downcase => true)).to eq(
                :upper => { :nested => 1 }, :list => [{ :key => 2 }, 'raw']
            )
        end
    end

    describe '.to_raw' do
        it 'renders scalars, nested vectors and repeated array attributes' do
            raw = described_class.to_raw(
                :NAME => 'demo',
                :NIC => [{ :NETWORK => 'blue' }, { :NETWORK => 'red' }],
                :QUOTE => 'a"b'
            )

            expect(raw).to include('NAME = "demo"')
            expect(raw.scan('NIC = [').size).to eq(2)
            expect(raw).to include('QUOTE = "a\\"b"')
        end

        it 'passes strings through and renders nil or empty hashes as empty strings' do
            expect(described_class.to_raw('NAME = "x"')).to eq('NAME = "x"')
            expect(described_class.to_raw(nil)).to eq('')
            expect(described_class.to_raw({})).to eq('')
        end

        it 'returns OpenNebula errors for unsupported values and conversion exceptions' do
            wrong = described_class.to_raw([1])
            exploding = Object.new
            allow(exploding).to receive(:to_s).and_raise('boom')
            error = described_class.to_raw(:VALUE => exploding)

            expect(OpenNebula.is_error?(wrong)).to be(true)
            expect(wrong.message).to include('expected Hash')
            expect(OpenNebula.is_error?(error)).to be(true)
            expect(error.message).to include('boom')
        end
    end
end
