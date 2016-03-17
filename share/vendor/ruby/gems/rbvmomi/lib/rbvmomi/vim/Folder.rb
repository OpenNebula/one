class RbVmomi::VIM::Folder
  # Retrieve a child entity
  # @param name [String] Name of the child.
  # @param type [Class] Return nil unless the found entity <tt>is_a? type</tt>.
  # @return [VIM::ManagedEntity]
  def find name, type=Object
    x = _connection.searchIndex.FindChild(:entity => self, :name => name)
    x if x.is_a? type
  end

  # Retrieve a virtual machine or host by DNS name
  # @param name [String] The fully qualified domain name to find.
  # @param type [Class] Return nil unless the found entity <tt>is_a? type</tt>.
  # @param dc [RbVmomi::VIM::Datacenter] Restricts the query to entities in the given Datacenter.
  # @return [VIM::ManagedEntity]
  def findByDnsName name, type=RbVmomi::VIM::VirtualMachine, dc=nil
    propSpecs = {
      :entity => self, :dnsName => name,
      :vmSearch => type == RbVmomi::VIM::VirtualMachine
    }
    propSpecs[:datacenter] = dc if dc
    x = _connection.searchIndex.FindByDnsName(propSpecs)
    x if x.is_a? type
  end

  # Retrieve a virtual machine or host by IP address
  # @param ip [String] The IP address is in dot-decimal notation.
  # @param type [Class] Return nil unless the found entity <tt>is_a? type</tt>.
  # @param dc [RbVmomi::VIM::Datacenter] Restricts the query to entities in the given Datacenter.
  # @return [VIM::ManagedEntity]
  def findByIp ip, type=RbVmomi::VIM::VirtualMachine, dc=nil
    propSpecs = {
      :entity => self, :ip => ip,
      :vmSearch => type == RbVmomi::VIM::VirtualMachine
    }
    propSpecs[:datacenter] = dc if dc
    x = _connection.searchIndex.FindByIp(propSpecs)
    x if x.is_a? type
  end

  # Retrieve a virtual machine or host by BIOS UUID.
  # @param uuid [String] The UUID to find.
  # @param type [Class] Return nil unless the found entity <tt>is_a? type</tt>.
  # @param dc [RbVmomi::VIM::Datacenter] Restricts the query to entities in the given Datacenter.
  # @return [VIM::ManagedEntity]
  def findByUuid uuid, type=RbVmomi::VIM::VirtualMachine, dc=nil
    propSpecs = {
      :entity => self, :uuid => uuid, :instanceUuid => false,
      :vmSearch => type == RbVmomi::VIM::VirtualMachine
    }
    propSpecs[:datacenter] = dc if dc
    x = _connection.searchIndex.FindByUuid(propSpecs)
    x if x.is_a? type
  end

  # Retrieve a managed entity by inventory path.
  # @param path [String] A path of the form "My Folder/My Datacenter/vm/Discovered VM/VM1"
  # @return [VIM::ManagedEntity]
  def findByInventoryPath path
    propSpecs = {
      :entity => self, :inventoryPath => path
    }
    x = _connection.searchIndex.FindByInventoryPath(propSpecs)
  end

  # Alias to <tt>traverse path, type, true</tt>
  # @see #traverse
  def traverse! path, type=Object
    traverse path, type, true
  end

  # Retrieve a descendant of this Folder.
  # @param path [String] Path delimited by '/', or an array of path elements.
  # @param type (see Folder#find)
  # @param create [Boolean] If set, create folders that don't exist.
  # @return (see Folder#find)
  # @todo Move +create+ functionality into another method.
  def traverse path, type=Object, create=false
    if path.is_a? String
      es = path.split('/').reject(&:empty?)
    elsif path.is_a? Enumerable
      es = path
    else
      fail "unexpected path class #{path.class}"
    end
    return self if es.empty?
    final = es.pop

    p = es.inject(self) do |f,e|
      f.find(e, RbVmomi::VIM::Folder) || (create && f.CreateFolder(:name => e)) || return
    end

    if x = p.find(final, type)
      x
    elsif create and type == RbVmomi::VIM::Folder
      p.CreateFolder(:name => final)
    elsif create and type == RbVmomi::VIM::Datacenter
      p.CreateDatacenter(:name => final)
    else
      nil
    end
  end

  # Alias to +childEntity+.
  def children
    childEntity
  end

  # Efficiently retrieve properties from descendants of this folder.
  #
  # @param propSpecs [Hash] Specification of which properties to retrieve from
  #                         which entities. Keys may be symbols, strings, or
  #                         classes identifying ManagedEntity subtypes to be
  #                         included in the results. Values are an array of
  #                         property paths (strings) or the symbol :all.
  #
  # @return [Hash] Hash of ManagedObjects to properties.
  def inventory_flat propSpecs={}
    propSet = [{ :type => 'Folder', :pathSet => ['name', 'parent', 'childEntity'] }]
    propSpecs.each do |k,v|
      case k
      when Class
        fail "key must be a subclass of ManagedEntity" unless k < RbVmomi::VIM::ManagedEntity
        k = k.wsdl_name
      when Symbol, String
        k = k.to_s
      else
        fail "invalid key"
      end

      h = { :type => k }
      if v == :all
        h[:all] = true
      elsif v.is_a? Array
        h[:pathSet] = v + %w(parent)
      else
        fail "value must be an array of property paths or :all"
      end
      propSet << h
    end

    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
      :objectSet => [
        :obj => self,
        :selectSet => [
          RbVmomi::VIM.TraversalSpec(
            :name => 'tsFolder',
            :type => 'Folder',
            :path => 'childEntity',
            :skip => false,
            :selectSet => [
              RbVmomi::VIM.SelectionSpec(:name => 'tsFolder')
            ]
          )
        ]
      ],
      :propSet => propSet
    )

    result = _connection.propertyCollector.RetrieveProperties(:specSet => [filterSpec])
    {}.tap do |h|
      result.each { |r| h[r.obj] = r }
    end
  end

  # Efficiently retrieve properties from descendants of this folder.
  #
  # @param propSpecs [Hash] Specification of which properties to retrieve from
  #                         which entities. Keys may be symbols, strings, or
  #                         classes identifying ManagedEntity subtypes to be
  #                         included in the results. Values are an array of
  #                         property paths (strings) or the symbol :all.
  #
  # @return [Hash] Tree of inventory items. Each node is a hash from
  #                VIM::ObjectContent to children.
  def inventory_tree propSpecs={}
    inv = inventory_flat propSpecs
    children = inv.values.group_by { |v| v['parent'] }
    rec = lambda { |parent| Hash[(children[parent]||[]).map { |x| [x, rec[x.obj]] }] }
    rec[self]
  end

  # Efficiently retrieve properties from descendants of this folder.
  #
  # @param propSpecs [Hash] Specification of which properties to retrieve from
  #                         which entities. Keys may be symbols, strings, or
  #                         classes identifying ManagedEntity subtypes to be
  #                         included in the results. Values are an array of
  #                         property paths (strings) or the symbol :all.
  #
  # @return [Hash] Tree of inventory items. Folders are hashes from child name
  #                to child result. Objects are hashes from property path to
  #                value.
  #
  # @deprecated
  def inventory propSpecs={}
    inv = inventory_flat propSpecs
    tree = { self => {} }
    inv.each do |obj,x|
      next if obj == self
      h = Hash[x.propSet.map { |y| [y.name, y.val] }]
      tree[h['parent']][h['name']] = [obj, h]
      tree[obj] = {} if obj.is_a? RbVmomi::VIM::Folder
    end
    tree
  end
end
