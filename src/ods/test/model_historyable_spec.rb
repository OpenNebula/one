require_relative 'shared/spec_helper'

RSpec.describe ODS::Historyable do
    let(:owner) { OdsSpecSupport::MemoryOwner.new }

    it 'registers declared history events and rejects unknown events' do
        expect(owner.register_event(:changed, :description => 'updated').last)
            .to include(:action => 'changed', :description => 'updated')
        expect(owner.plain_body[:historic]).to eq(owner.historic)
        expect { owner.register_event(:missing, :description => 'x') }
            .to raise_error(ArgumentError, /Unknown history event/)
    end

    it 'always serializes an empty history collection' do
        expect(owner.to_h.dig('DOCUMENT', 'TEMPLATE', 'BODY', :historic)).to eq([])
    end
end
