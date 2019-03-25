module Packet
    class IpRange
        include Entity

        attr_accessor :quantity, :type, :facility, :project_id, :address
    end
end
