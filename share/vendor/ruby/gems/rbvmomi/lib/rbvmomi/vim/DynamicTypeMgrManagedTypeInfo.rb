class RbVmomi::VIM::DynamicTypeMgrManagedTypeInfo
  def toRbvmomiTypeHash
    {
      self.wsdlName => {
        'kind' => 'managed',
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
        'methods' => Hash[
          self.method.map do |method|
            result = method.returnTypeInfo

            [method.wsdlName,
             {
               'params' => method.paramTypeInfo.map do |param|
                 {
                   'name' => param.name,
                   'type-id-ref' => param.type.gsub("[]", ""),
                   'is-array' => (param.type =~ /\[\]$/) ? true : false,
                   'is-optional' => param.annotation.find{|a| a.name == "optional"} ? true : false,
                   'version-id-ref' => param.version,
                 }
               end,
               'result' => (
               if result.nil? then
                 nil
               else
                 {
                   'name' => result.name,
                   'type-id-ref' => result.type.gsub("[]", ""),
                   'is-array' => (result.type =~ /\[\]$/) ? true : false,
                   'is-optional' => result.annotation.find{|a| a.name == "optional"} ? true : false,
                   'version-id-ref' => result.version,
                 }
               end)
             }
            ]
          end
        ]
      }
    }
  end
end
