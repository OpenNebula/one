module Sunstone
  module AdvancedSearch
    # Search VMs by advanced criteria defined in configuration
    # @param vms [Array<OpenNebula::VirtualMachine>] list of VMs from pool
    # @param search_params [Hash] keys: template attribute names, values: search strings
    # @return [Array<OpenNebula::VirtualMachine>] filtered VMs
    def self.filter_vms(vms, search_params)
      search_keys = OpenNebula::Config.fetch('vmtemplate_search_keys', {})
      filtered = vms.select do |vm|
        vm_hash = vm.to_hash
        search_params.all? do |key, user_value|
          pattern_template = search_keys[key]
          next false unless pattern_template # key not allowed => skip VM? Or ignore? We'll exclude if key not allowed.
          # Build regex from pattern, escape user_value? No, pattern includes {value} placeholder.
          regex_str = pattern_template.gsub('{value}', Regexp.escape(user_value.to_s))
          begin
            regex = Regexp.new(regex_str, Regexp::IGNORECASE)
          rescue RegexpError
            next false
          end
          # Navigate to the value in VM hash using key path (e.g., "TEMPLATE.OS.ARCH")
          value = deep_get(vm_hash, key)
          value.is_a?(String) && regex.match?(value)
        end
      end
      filtered
    end

    private

    # Safely navigate nested hash using dot-separated keys
    def self.deep_get(hash, path)
      parts = path.split('.')
      current = hash
      parts.each do |part|
        # Handle array indices like DISK[0]
        if part =~ /^(\w+)\[(\d+)\]$/
          key = $1
          index = $2.to_i
          if current.is_a?(Hash) && current[key].is_a?(Array)
            current = current[key][index]
          else
            return nil
          end
        elsif current.is_a?(Hash) && current.key?(part)
          current = current[part]
        else
          return nil
        end
      end
      current
    end
  end
end
