require 'webmock/rspec'

RSpec.configure do |config|
  config.before { WebMock.disable_net_connect!(allow_localhost: true) }

  # Stub request through FakePacket
  config.before(:each) do
    stub_request(:any, /api.packet.net/).to_rack(FakePacket)
  end
end
