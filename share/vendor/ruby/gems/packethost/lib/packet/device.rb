require 'active_support/core_ext/object/try'

module Packet
  class Device
    include Entity

    attr_accessor :hostname, :iqn, :ip_addresses, :state, :tags, :userdata, :project_id, :root_password
    attr_accessor :userdata
    has_one :operating_system
    has_one :plan
    has_one :facility
    has_one :project
    has_timestamps

    def tags
      (@tags ||= []).map(&:to_sym)
    end

    def ip_addresses
      @ip_addresses ||= []
    end

    [:provisioning, :powering_on, :active, :powering_off, :inactive, :rebooting].each do |s|
      define_method(:"#{s}?") { state == s }
    end

    def state
      @state.try(:to_sym)
    end
  end
end
