require 'active_support/inflector'

module Packet
  class GlobalIDLocator
    CLASS_MAP = {
      'Instance' => :device
    }.freeze

    def initialize(client)
      @client = client || Packet::Client.instance
    end

    def locate(gid)
      @client.send method_for_model_name(gid.model_name), gid.model_id
    end

    private

    def method_for_model_name(name)
      if CLASS_MAP.key?(name)
        CLASS_MAP[name]
      else
        name.underscore
      end
    end
  end
end
