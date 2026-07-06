# frozen_string_literal: true

class VmController < ApplicationController
  # POST /vm/deep_search
  # Search VMs by template attributes
  def deep_search
    filters = params[:filters] || {}
    search_keys = OpenNebula::Configuration[:vm_deep_search][:keys] rescue {}

    # Validate and sanitize filters
    allowed_filters = filters.select { |key, _| search_keys.key?(key) }
    return render(json: { error: 'Invalid filters' }, status: :bad_request) if allowed_filters.empty?

    # Apply regex patterns
    search_conditions = allowed_filters.map do |key, value|
      regex = search_keys[key]
      # Escape regex special characters in user input and anchor
      escaped_value = Regexp.escape(value)
      full_regex = regex.gsub('.*', '.*').gsub('^', '^').gsub('$', '$')
      # Actually, the regex from config is the prefix/suffix pattern, we need to build a regex
      # For simplicity, we assume config stores a pattern like '^' meaning prefix
      # We'll construct a regex: anchored at both ends if pattern has $, else only at start if ^
      if regex.include?('$')
        /\A#{escaped_value}\z/
      elsif regex.include?('^')
        /\A#{escaped_value}/
      else
        /#{escaped_value}/
      end
    end

    # Get all VMs (or paginated) and filter
    pool = OpenNebula::VirtualMachinePool.new(client)
    rc = pool.info
    return render(json: { error: rc.message }, status: :internal_server_error) if OpenNebula.is_error?(rc)

    matching_vms = pool.select do |vm|
      search_conditions.all? do |regex|
        # Get the attribute value from VM template
        attribute = vm['TEMPLATE']
        # Support nested keys like TEMPLATE.DESCRIPTION
        key_parts = allowed_filters.keys[search_conditions.index(regex)]
        key_parts.split('.').each do |part|
          attribute = attribute[part] if attribute.respond_to?(:[])
        end
        attribute.to_s.match?(regex)
      end
    end

    render json: matching_vms.map(&:to_hash)
  end
end
