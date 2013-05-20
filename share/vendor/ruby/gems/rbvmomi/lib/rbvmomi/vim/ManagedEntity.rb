class RbVmomi::VIM::ManagedEntity
  # Retrieve the ancestors of the entity.
  # @return [Array] Ancestors of this entity, starting with the root.
  def path
    self.class.paths([self])[self]
  end
  
  # Retrieve the ancestors of a list of entries.
  # @return [Hash] Object-indexed hash of ancestors of entities, starting with the root.
  def self.paths objs
    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
      :objectSet => objs.map do |obj|
        RbVmomi::VIM.ObjectSpec(
          :obj => obj,
          :selectSet => [
            RbVmomi::VIM.TraversalSpec(
              :name => "tsME",
              :type => 'ManagedEntity',
              :path => 'parent',
              :skip => false,
              :selectSet => [
                RbVmomi::VIM.SelectionSpec(:name => "tsME")
              ]
            )
          ]
        )
      end,
      :propSet => [{
        :pathSet => %w(name parent),
        :type => 'ManagedEntity'
      }]
    )

    propCollector = objs.first._connection.propertyCollector
    result = propCollector.RetrieveProperties(:specSet => [filterSpec])

    Hash[objs.map do |obj|
      tree = {}
      result.each { |x| tree[x.obj] = [x['parent'], x['name']] }
      a = []
      cur = obj
      while cur
        parent, name = *tree[cur]
        a << [cur, name]
        cur = parent
      end
      [obj, a.reverse]
    end]
  end

  # Return a string representation of +path+ suitable for display.
  # @return [String]
  # @see #path
  def pretty_path
    path[1..-1].map { |x| x[1] } * '/'
  end
end
