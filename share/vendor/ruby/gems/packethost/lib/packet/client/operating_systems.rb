module Packet
  class Client
    module OperatingSystems
      def list_operating_systems(*args)
        get('operating-systems', *args).body['operating_systems'].map { |p| Packet::OperatingSystem.new(p, self) }
      end
    end
  end
end
