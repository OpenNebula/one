# frozen_string_literal: true

# Add to Sunstone configuration module
module Sunstone
  module Config
    # Returns advanced VM search configuration from sunstone-server.conf
    def self.vm_search_advanced
      # Load from configuration file or return default
      @vm_search_advanced ||= begin
        config = YAML.safe_load(File.read('sunstone-server.conf')) rescue {}
        config['vm_search_advanced'] || []
      end
    end
  end
end