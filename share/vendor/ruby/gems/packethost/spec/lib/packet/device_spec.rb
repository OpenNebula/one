require 'spec_helper'

RSpec.describe Packet::Device do
  let(:plan) { Packet::Plan.new(slug: 'test_slug') }

  before do
    allow(plan).to receive(:to_value)
  end

  subject { Packet::Device.new(plan: plan.to_hash) }

  describe '#to_hash output should have values instead of objects for children' do
    it { expect(subject.to_hash['plan']).to be_a(String) }
    it { expect(subject.to_hash['plan']).to eq plan.slug }
  end
end
