module OpenNebula
  class VMPool < Pool
    def search_by_template_attribute(attribute, value, regex_pattern)
      # Build an XPath filter: .//TEMPLATE/*[local-name()='attribute']/text() matches regex
      # This is a simplified example; actual implementation may use OpenNebula's internal filtering
      filter = ".//#{attribute}"
      if regex_pattern
        filter += "[matches(text(), '#{regex_pattern}')]"
      else
        filter += "[contains(text(), '#{value}')]"
      end
      # Apply filter to the pool's XML representation
      # For demonstration, we iterate and match
      matching_vms = []
      pool_element = @client.get_resource_pool_xml(self)
      pool_element.xpath("//VM").each do |vm_node|
        value_node = vm_node.at_xpath(filter)
        if value_node && value_node.text =~ Regexp.new(regex_pattern || value)
          matching_vms << vm_node
        end
      end
      matching_vms
    end
  end
end
