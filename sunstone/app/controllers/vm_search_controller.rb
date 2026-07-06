class VmSearchController < ApplicationController
  def search
    query = params[:query]
    attr = params[:attr]
    config = YAML.load_file(Rails.root.join('config', 'sunstone-server.conf'))
    searchable_attrs = config['vm_searchable_attributes'] || []

    unless attr.blank?
      # Validate requested attr is in config
      allowed = searchable_attrs.find { |a| a['key'] == attr }
      if allowed
        # Use the pattern from config for matching
        pattern = Regexp.new(allowed['pattern'])
        vms = VM.all.select do |vm|
          val = vm.template_value(attr)    # hypothetical method
          val && pattern.match?(val.to_s) && val.to_s.include?(query) rescue false
        end
      else
        vms = VM.all
      end
    else
      # Default search across all table columns
      vms = VM.where("name LIKE ?", "%#{query}%")
    end

    render json: vms.map { |vm| { id: vm.id, name: vm.name, state: vm.state } }
  end
end
