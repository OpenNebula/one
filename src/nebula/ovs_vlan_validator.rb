module OVScope
  module OVSVlanValidator
    def self.validate(ovs_config)
      tag = ovs_config[:tag]
      trunks = ovs_config[:trunks]

      return unless tag && trunks && trunks.respond_to?(:include?)

      if trunks.include?(tag)
        message = "OVS VLAN configuration conflict: tag #{tag} is also included in trunks (#{trunks.join(',')}). This may cause unexpected behavior."
        if defined?(OpenNebula) && OpenNebula.respond_to?(:log_warn)
          OpenNebula.log_warn(message)
        else
          $stderr.puts("WARNING: #{message}")
        end

        if defined?(OpenNebula) && OpenNebula.respond_to?(:conf) && OpenNebula.conf[:strict_ovs_vlan]
          raise OpenNebula::Error, message
        end
      end
    end
  end
end
