require_relative 'shared/spec_helper'

RSpec.describe ODS::Errorable do
    let(:owner) { OdsSpecSupport::MemoryOwner.new }

    it 'stores, exposes and clears structured errors' do
        expect(owner.set_error('bad', :opts => { :retry => true }, :action => 'apply'))
            .to include(:message => 'bad', :opts => { :retry => true }, :action => 'apply')
        expect(owner.plain_body[:error]).to eq(owner.error)
        expect(owner.clear_error).to be_nil
        expect(owner.error).to be_nil
        expect { owner.set_error('bad', :opts => []) }.to raise_error(ArgumentError)
    end
end
