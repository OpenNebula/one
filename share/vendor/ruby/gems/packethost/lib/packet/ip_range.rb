module Packet
    class IpRange
        include Entity

        attr_accessor :quantity, :type, :facility, :project_id, :address
        attr_accessor :network, :cidr, :address_family, :netmask, :gateway
        attr_accessor :public, :management, :manageable, :enabled, :global_ip
        attr_accessor :addon, :bill

        #has_one :facility
        #has_one :project
        #has_many :assignments
    end
end
