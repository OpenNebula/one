module Packet
  class Configuration
    attr_accessor :url, :auth_token, :consumer_token

    def initialize
      @url = 'https://api.packet.net'.freeze
    end
  end
end
