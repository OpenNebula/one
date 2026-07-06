# frozen_string_literal: true

# Extension to the OpenNebulaJSON module to support deep VM search
module OpenNebulaJSON
  # ... existing code ...

  # Override or add method to search VMs with deep attributes
  def self.search_vms(pool, search_string, options = {})
    # Get advanced search configuration from sunstone-server.conf
    # This is a placeholder; actual implementation reads from config
    advanced_config = $conf[:vm_search_attributes] || {}

    # If search_string contains a colon, treat as advanced search
    if search_string.include?(':')
      # Parse key:value pattern
      key, value = search_string.split(':', 2)
      # Look up regex from config; if not found, default to exact match
      regex_str = advanced_config[key] || "^#{Regexp.escape(value)}$"
      regex = Regexp.new(regex_str, Regexp::IGNORECASE)
      # Filter pool by checking the attribute value
      pool.select do |vm|
        attr_value = vm[key] # This is simplified; actual would use deep fetch
        attr_value && attr_value.to_s.match?(regex)
      end
    else
      # Fall back to default column search
      pool.select do |vm|
        # existing logic ...
        vm.name.downcase.include?(search_string.downcase)
      end
    end
  end
end
