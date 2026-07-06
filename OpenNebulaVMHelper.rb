module OpenNebulaVMHelper
  # Apply deep search filters to a list of VMs based on config and query.
  # @param vms [Array] list of VM objects
  # @param search_params [Hash] with keys: :search (string), :advanced (hash key->value)
  # @param config [Hash] vm_search configuration
  # @return [Array] filtered VMs
  def self.deep_search_filter(vms, search_params, config)
    return vms if search_params.nil? || search_params.empty?

    advanced = search_params[:advanced] || {}
    search_text = search_params[:search] || ''

    # Filter by advanced fields first
    advanced.each do |key, value|
      next if value.empty?
      pattern_type = config[key] || 'exact'
      vms = vms.select do |vm|
        template_value = vm.template[key] rescue nil
        if template_value.nil?
          false
        else
          match(template_value.to_s, value, pattern_type)
        end
      end
    end

    # Apply general search text if present (and no advanced filter matches?)
    # Or combine? For simplicity, if advanced is used, ignore general search.
    if search_text && !search_text.empty? && advanced.empty?
      # Default search behavior (assuming general text search on name and ID)
      vms = vms.select do |vm|
        vm.name.include?(search_text) || vm.id.to_s.include?(search_text)
      end
    end

    vms
  end

  private

  def self.match(str, pattern, type)
    case type
    when 'exact'
      str == pattern
    when 'prefix'
      str.start_with?(pattern)
    when 'substring'
      str.include?(pattern)
    else
      str.include?(pattern)
    end
  end
end