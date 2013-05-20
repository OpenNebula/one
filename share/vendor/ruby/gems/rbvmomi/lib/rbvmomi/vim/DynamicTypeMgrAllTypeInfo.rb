class RbVmomi::VIM::DynamicTypeMgrAllTypeInfo
  def toRbvmomiTypeHash
    id2name = {}
    id2name.merge!({
      'string' => 'xsd:string',
      'java.lang.String' => 'xsd:string',
      'BOOLEAN' => 'xsd:boolean',
      'BYTE' => 'xsd:byte',
      'SHORT' => 'xsd:short',
      'INT' => 'xsd:int',
      'LONG' => 'xsd:long',
      'FLOAT' => 'xsd:float',
      'DOUBLE' => 'xsd:double',
      'boolean' => 'xsd:boolean',
      'byte' => 'xsd:byte',
      'short' => 'xsd:short',
      'int' => 'xsd:int',
      'long' => 'xsd:long',
      'float' => 'xsd:float',
      'double' => 'xsd:double',
      'vmodl.DateTime' => 'xsd:dateTime',
      'vmodl.Binary' => 'xsd:base64Binary',
      'vmodl.Any' => 'xsd:anyType',
      'vim.KeyValue' => 'KeyValue',
      'void' => nil,
    })

    %w(DataObject ManagedObject MethodFault MethodName DynamicData
       PropertyPath RuntimeFault TypeName).each do |x|
      id2name['vmodl.' + x] = x
    end

    types = {}
    self.managedTypeInfo.each{|x| types.merge!(x.toRbvmomiTypeHash) }
    self.dataTypeInfo.each{|x| types.merge!(x.toRbvmomiTypeHash) }

    types.each do |k,t|
      id2name[t['type-id']] = k
    end

    types = Hash[types.map do |k,t|
      case t['kind']
      when 'data'
        t['wsdl_base'] = t['base-type-id'] ? id2name[t['base-type-id']] : 'DataObject'
        #t.delete 'base-type-id'
        t['props'].each do |x|
          x['wsdl_type'] = id2name[x['type-id-ref']]
          x.delete 'type-id-ref'
        end
      when 'managed'
        t['wsdl_base'] = t['base-type-id'] ? id2name[t['base-type-id']] : 'ManagedObject'
        #t.delete 'base-type-id'
        t['props'].each do |x|
          x['wsdl_type'] = id2name[x['type-id-ref']]
          x.delete 'type-id-ref'
        end
        t['methods'].each do |mName,x|
          if y = x['result']
            y['wsdl_type'] = id2name[y['type-id-ref']]
            #y.delete 'type-id-ref'
          end
          x['params'].each do |r|
            r['wsdl_type'] = id2name[r['type-id-ref']]
            r.delete 'type-id-ref'
          end
        end
      when 'enum'
      else fail
      end
      [k, t]
    end]

    types
  end
end
