# frozen_string_literal: true

module VmHelper
  # Extend VM search to include deep search into template attributes.
  def self.deep_search(term, pool, keys_config)
    # keys_config is an array of hashes with :key and :regex
    # Search each VM's template JSON for matches in configured keys.
    return pool unless term && !term.empty?

    matching_ids = []
    pool.each do |vm|
      template = vm.to_hash['VM']['TEMPLATE'] rescue next
      keys_config.each do |config|
        key_path = config[:key]
        regex_str = config[:regex]
        # Split key path by dot to traverse nested attributes
        value = template.dig(*key_path.split('.'))
        next unless value.is_a?(String)
        begin
          regex = Regexp.new(regex_str)
          if value.match?(regex) && value.include?(term)
            matching_ids << vm.id
            break
          end
        rescue RegexpError
          # Invalid regex, skip
        end
      end
    end
    matching_ids.uniq!
    pool.select { |vm| matching_ids.include?(vm.id) }
  end
end
