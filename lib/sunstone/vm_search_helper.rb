# Sunstone Deep VM Search Helper
# Processes advanced search queries with attribute-specific regex patterns.

require 'rexml/document'

module Sunstone
  module VMSearchHelper
    # Parse the deep_vm_search configuration from sunstone-server.conf
    def self.load_deep_vm_search_config
      config = OpenNebula::CloudAuth::Config.fetch('deep_vm_search')
      return {} unless config
      attributes = config['attributes'] || []
      attrs = {}
      attributes.each do |entry|
        # Entry format: "TEMPLATE.KEY = regex"
        match = entry.match(/^\s*(\S+)\s*=\s*(.*)\s*$/)
        next unless match
        key = match[1].strip
        regex = Regexp.new(match[2].strip)
        attrs[key] = regex
      end
      attrs
    end

    # Apply the advanced search filter to a list of VMs
    # +vms+ Array of VM objects (hash or XML)
    # +attribute+ Full key path like "TEMPLATE.OS.ARCH"
    # +value+ The user input value to match
    # Return filtered array
    def self.filter_vms(vms, attribute, value)
      config_regexps = load_deep_vm_search_config
      regexp = config_regexps[attribute]
      return vms unless regexp

      vms.select do |vm|
        begin
          actual_value = get_vm_attribute(vm, attribute)
          actual_value && actual_value.match?(regexp) &&
            # Also apply the user input as a substring match
            actual_value.include?(value)
        rescue
          false
        end
      end
    end

    # Extract attribute value from VM object
    # +vm+ Can be a Nokogiri XML element or a hash
    # +key+ Dot-separated path (e.g., "TEMPLATE.OS.ARCH")
    def self.get_vm_attribute(vm, key)
      # Normalize to XML if hash
      if vm.is_a?(Hash)
        vm = vm['TEMPLATE'] if key.start_with?('TEMPLATE.')
        key = key.sub(/^TEMPLATE\./, '')
        return dig_hash(vm, key.split('.'))
      else
        # Assume REXML element
        xpath = key.gsub('.', '/')
        element = REXML::XPath.first(vm, xpath)
        element ? element.text : nil
      end
    end

    def self.dig_hash(hash, keys)
      keys.reduce(hash) { |h, k| h.is_a?(Hash) ? h[k] : nil }
    end
  end
end
