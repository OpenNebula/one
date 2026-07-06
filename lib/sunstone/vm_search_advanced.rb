# frozen_string_literal: true

module Sunstone
  # Handles advanced VM search by template attributes.
  class VMSearchAdvanced
    def self.search(vm_pool, query_params)
      # query_params: { key: template_key, regex: pattern, value: search_term }
      # Returns filtered VM pool
      return vm_pool unless query_params[:key] && query_params[:value]

      key = query_params[:key]
      regex = query_params[:regex] || '.*'
      search_value = query_params[:value]

      begin
        reg = Regexp.new(regex)
      rescue RegexpError => e
        raise "Invalid regex pattern: #{e.message}"
      end

      vm_pool.select do |vm|
        value = extract_template_value(vm, key)
        next false if value.nil?
        value = value.to_s
        match = reg.match(value)
        match && value.include?(search_value)  # case-insensitive? optional
      end
    end

    private

    # Recursively extract value from template hash-like structure
    def self.extract_template_value(vm, key)
      parts = key.split('/')
      current = vm["TEMPLATE"] || vm["template"] || {}
      parts.each do |part|
        if current.is_a?(Hash) || current.respond_to?(:[])
          current = current[part] || current[part.upcase] || current[part.downcase]
        else
          return nil
        end
      end
      current
    end
  end
end