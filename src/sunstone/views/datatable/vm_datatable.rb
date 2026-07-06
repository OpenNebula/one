# frozen_string_literal: true

# Datatable for VMs with advanced search support
class VMDataTable < DataTable
  # ... existing code ...

  def initialize(view, options = {})
    super
    # Add advanced search input
    @advanced_search = true
    @advanced_search_config = $conf[:vm_search_attributes] || {}
  end

  # Override search placeholder or add a new field
  def search_html
    html = '<div class="search-box">'
    html += '<input type="text" id="vm-search" placeholder="Search VMs..." />'
    if @advanced_search && !@advanced_search_config.empty?
      html += '<select id="advanced-search-key">'
      html += '<option value="">All columns</option>'
      @advanced_search_config.each do |key, regex|
        display_name = key.gsub('.', ' > ')
        html += "<option value=\"#{escape_html(key)}\">#{escape_html(display_name)}</option>"
      end
      html += '</select>'
      html += '<input type="text" id="advanced-search-value" placeholder="Value..." />'
      html += '<button id="advanced-search-btn">Advanced Search</button>'
    end
    html += '</div>'
    html
  end

  private

  def escape_html(str)
    str.to_s.gsub('&', '&amp;').gsub('<', '&lt;').gsub('>', '&gt;').gsub('"', '&quot;')
  end
end
