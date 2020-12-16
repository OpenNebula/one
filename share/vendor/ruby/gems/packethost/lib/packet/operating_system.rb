module Packet
  class OperatingSystem
    include Entity

    attr_accessor :slug
    attr_accessor :name
    attr_accessor :distro
    attr_accessor :version
    attr_accessor :provisionable_on

    serializer_key :slug
  end
end
