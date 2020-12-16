module Packet
  class SshKey
    include Entity

    attr_accessor :label
    attr_accessor :key

    serializer_key :id

    has_timestamps
  end
end
