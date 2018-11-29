require 'spec_helper'

RSpec.describe Packet do
  describe '.configure' do
    it { expect { |probe| Packet.configure(&probe) }.to yield_with_args(Packet::Configuration) }
  end
end
