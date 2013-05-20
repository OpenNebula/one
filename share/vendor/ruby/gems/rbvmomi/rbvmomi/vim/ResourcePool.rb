class RbVmomi::VIM::ResourcePool
  # Retrieve a child ResourcePool.
  # @param name [String] Name of the child.
  # @return [VIM::ResourcePool]
  def find name
    _connection.searchIndex.FindChild(:entity => self, :name => name)
  end

  # Retrieve a descendant of this ResourcePool.
  # @param path [String] Path delimited by '/'.
  # @return [VIM::ResourcePool]
  def traverse path
    es = path.split('/').reject(&:empty?)
    es.inject(self) do |f,e|
      f.find(e) || return
    end
  end

  def resourcePoolSubTree fields = []
    self.class.resourcePoolSubTree [self], fields
  end
  
  def self.resourcePoolSubTree objs, fields = []
    fields = (fields + ['name', 'resourcePool']).uniq
    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
      :objectSet => objs.map do |obj|
        RbVmomi::VIM.ObjectSpec(
          :obj => obj,
          :selectSet => [
            RbVmomi::VIM.TraversalSpec(
              :name => "tsRP",
              :type => 'ResourcePool',
              :path => 'resourcePool',
              :skip => false,
              :selectSet => [
                RbVmomi::VIM.SelectionSpec(:name => "tsRP")
              ]
            )
          ]
        )
      end,
      :propSet => [{
        :pathSet => fields,
        :type => 'ResourcePool'
      }]
    )
  
    propCollector = objs.first._connection.propertyCollector
    result = propCollector.RetrieveProperties(:specSet => [filterSpec])
    
    Hash[result.map do |x|
      [x.obj, x.to_hash]
    end]
  end
end
