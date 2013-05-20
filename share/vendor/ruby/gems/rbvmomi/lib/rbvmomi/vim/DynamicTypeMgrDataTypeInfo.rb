class RbVmomi::VIM::DynamicTypeMgrDataTypeInfo
  def toRbvmomiTypeHash
    {
      self.wsdlName => {
        'kind' => 'data',
        'type-id' => self.name,
        'base-type-id' => self.base.first,
        'props' => self.property.map do |prop|
          {
            'name' => prop.name,
            'type-id-ref' => prop.type.gsub("[]", ""),
            'is-array' => (prop.type =~ /\[\]$/) ? true : false,
            'is-optional' => prop.annotation.find{|a| a.name == "optional"} ? true : false,
            'version-id-ref' => prop.version,
          }
        end,
      }
    }
  end
end