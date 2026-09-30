require_relative 'shared/spec_helper'
require 'ods_helper'

RSpec.describe ODSHelper do
    subject(:helper) { described_class.new }

    it 'collects boolean, tuple and object inputs through the generic helper' do
        inputs = [
            { :name => 'enabled', :type => 'bool', :mandatory => true },
            { :name => 'zones', :type => 'tuple(string)', :mandatory => true },
            { :name => 'settings', :type => 'object', :mandatory => true },
            { :name => 'comment', :type => 'string', :mandatory => false }
        ]
        allow(STDIN).to receive(:readline).and_return(
            "yes\n", "zone-a, zone-b\n", "{\"nested\":{\"enabled\":true}}\n", "\n"
        )

        expect(helper.get_user_values(inputs)).to eq(
            'enabled' => true,
            'zones' => ['zone-a', 'zone-b'],
            'settings' => { 'nested' => { 'enabled' => true } }
        )
    end

    it 'does not echo sensitive defaults' do
        inputs = [
            {
                :name => 'password', :type => 'string', :mandatory => true,
                :sensitive => true, :default => 'fallback-secret'
            }
        ]
        allow(helper).to receive(:read_sensitive_value).and_return('entered-secret')

        expect do
            expect(helper.get_user_values(inputs)).to eq(
                'password' => 'entered-secret'
            )
        end.to output(
            a_string_including('Press enter for default (<hidden>).')
                .and(satisfy {|value| !value.include?('fallback-secret') })
        ).to_stdout
    end

    it 'retries mandatory inputs and omits optional blank values' do
        inputs = [
            { :name => 'required', :type => 'string', :mandatory => true },
            { :name => 'optional', :type => 'number', :mandatory => false }
        ]
        allow(STDIN).to receive(:readline).and_return("\n", "value\n", "\n")

        expect do
            expect(helper.get_user_values(inputs)).to eq('required' => 'value')
        end.to output(a_string_including('A value is required.')).to_stdout
    end

    it 'retains false and collection defaults' do
        inputs = [
            { :name => 'enabled', :type => 'bool', :default => false },
            { :name => 'items', :type => 'list', :default => [] },
            { :name => 'settings', :type => 'map', :default => {} }
        ]
        allow(STDIN).to receive(:readline).and_return("\n", "\n", "\n")

        expect(helper.get_user_values(inputs)).to eq(
            'enabled' => false, 'items' => [], 'settings' => {}
        )
    end
end
