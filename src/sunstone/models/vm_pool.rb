# frozen_string_literal: true

class VMPool
  # Existing search method
  def search(filter = {}, deep_search = nil)
    vms = all_vms
    if filter[:search] && !filter[:search].empty?
      search_term = filter[:search]
      vms = vms.select { |vm| vm.name.include?(search_term) || vm.id.to_s.include?(search_term) }
    end
    if deep_search
      deep_search.each do |ds|
        key = ds[:key]
        value = ds[:value]
        next if value.nil? || value.empty?
        config_key = DeepSearchConfig.find_by_key(key)
        next unless config_key
        pattern = config_key[:pattern].gsub('%s', Regexp.escape(value))
        regex = Regexp.new(pattern, Regexp::IGNORECASE)
        vms = vms.select do |vm|
          attr_value = vm.template_body.dig(*key.split('/'))
          attr_value && regex.match?(attr_value.to_s)
        end
      end
    end
    vms
  end
end
