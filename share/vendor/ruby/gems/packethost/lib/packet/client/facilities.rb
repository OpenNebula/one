module Packet
  class Client
    module Facilities
      def list_facilities(*args)
        get('facilities', *args).body['facilities'].map { |p| Packet::Facility.new(p, self) }
      end
    end
  end
end
