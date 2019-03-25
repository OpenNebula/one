module Packet
  class Facility
    include Entity

    attr_accessor :name
    attr_accessor :code
    attr_accessor :features

    serializer_key :code
  end
end
