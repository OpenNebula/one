class RbVmomi::VIM::ServiceInstance
  # Retrieve a Datacenter.
  # If no path is given the first datacenter will be returned.
  # @param path (see Folder#traverse)
  # @return [Datacenter]
  def find_datacenter path=nil
    if path
      content.rootFolder.traverse path, RbVmomi::VIM::Datacenter
    else
      content.rootFolder.childEntity.grep(RbVmomi::VIM::Datacenter).first
    end
  end

  # Wait for several tasks to complete.
  # @param interested [Array] Property paths to watch for updates.
  # @param tasks [Array] Tasks to wait on.
  # @yield [Hash] Called when a property is updated on a task.
  #               The parameter is a hash from tasks to hashes from
  #               property path to value.
  # @return [void]
  def wait_for_multiple_tasks interested, tasks
    version = ''
    interested = (interested + ['info.state']).uniq
    task_props = Hash.new { |h,k| h[k] = {} }

    filter = _connection.propertyCollector.CreateFilter :spec => {
      :propSet => [{ :type => 'Task', :all => false, :pathSet => interested }],
      :objectSet => tasks.map { |x| { :obj => x } },
    }, :partialUpdates => false

    begin
      until task_props.size == tasks.size and task_props.all? { |k,h| %w(success error).member? h['info.state'] }
        result = _connection.propertyCollector.WaitForUpdates(:version => version)
        version = result.version
        os = result.filterSet[0].objectSet

        os.each do |o|
          changes = Hash[o.changeSet.map { |x| [x.name, x.val] }]

          interested.each do |k|
            task = tasks.find { |x| x._ref == o.obj._ref }
            task_props[task][k] = changes[k] if changes.member? k
          end
        end

        yield task_props if block_given?
      end
    ensure
      _connection.propertyCollector.CancelWaitForUpdates
      filter.DestroyPropertyFilter
    end

    task_props
  end
end
