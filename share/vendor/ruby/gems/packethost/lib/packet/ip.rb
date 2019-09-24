module Packet
  class Ip
    include Entity

    attr_accessor :quantity, :type, :facility, :project_id, :address
    attr_accessor :network, :cidr, :address_family, :netmask, :gateway
    attr_accessor :public, :management, :manageable, :enabled, :global_ip
    attr_accessor :addon, :bill, :assignments
    has_one :facility
    has_one :project
    #has_many :assignments

    def assignments
      @assignments ||= []
    end
  end
end
