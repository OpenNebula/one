# OpenNebula - Open vSwitch Driver
#
# Licensed under the Apache License, Version 2.0
#
# This file provides VLAN configuration validation for Open vSwitch.

require 'OpenNebulaNetwork'

module OpenNebulaNetwork
  module OpenvSwitch
    # Validates that the VLAN tag is not also included in the trunks list.
    # Logs a warning if a conflict is detected.
    #
    # @param vlan_conf [Hash] Network configuration with keys :vlan_id and :vlan_trunks
    def self.validate_vlan_conf(vlan_conf)
      tag = vlan_conf[:vlan_id]
      trunks = vlan_conf[:vlan_trunks]

      if tag && trunks && trunks.is_a?(Array) && trunks.include?(tag)
        logger = OpenNebula::Log.instance
        logger.warn("Conflicting VLAN configuration: tag #{tag} is also listed in trunks #{trunks}. This is allowed by OVS but likely unintended.")
      end
    end
  end
end
