require 'opennebula'

# Extend the VM pool search to support deep attribute filtering
class SunstoneVMRemotes
  def initialize(client)
    @client = client
    @vm_pool = OpenNebula::VirtualMachinePool.new(@client, -1)
    load_config
  end

  def load_config
    config_file = File.join(ENV['SUNSTONE_CONFIG_DIR'] || '/etc/one/sunstone-server.conf', '')
    if File.exist?(config_file)
      @config = YAML.load_file(config_file)
    else
      @config = {}
    end
  end

  def pool_info(*args)
    options = args.extract_options!
    advanced_filter = options[:advanced_filter]
    if advanced_filter && @config.dig(:vm_deep_search, :enabled)
      filtered_vms = @vm_pool.get_vms.select do |vm|
        match_deep_filter?(vm, advanced_filter)
      end
      filtered_vms.map { |vm| vm.to_hash }
    else
      @vm_pool.get_vms.map { |vm| vm.to_hash }
    end
  end

  private

  def match_deep_filter?(vm, filter)
    attr_config = @config.dig(:vm_deep_search, :attributes).find { |a| a[:key] == filter[:key] }
    return false unless attr_config

    regex = Regexp.new(attr_config[:regex])
    value = resolve_template_path(vm, filter[:key])
    value && regex.match?(value) && (filter[:value].nil? || value.include?(filter[:value]))
  end

  def resolve_template_path(vm, path)
    parts = path.split('/')
    current = vm.to_hash
    parts.each do |part|
      break if current.nil?
      if current.is_a?(Hash)
        current = current[part]
      elsif current.is_a?(Array)
        # Only take first element for array paths? For simplicity, treat as hash search on each
        current = current.first ? current.first[part] : nil
      else
        current = nil
      end
    end
    current
  end
end