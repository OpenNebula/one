class RbVmomi::VIM::Task
  # Wait for a task to finish.
  # @return +info.result+ on success.
  # @raise +info.error+ on error.
  def wait_for_completion
    wait_until('info.state') { %w(success error).member? info.state }
    case info.state
    when 'success'
      info.result
    when 'error'
      raise info.error
    end
  end
  
  # Wait for all child tasks to finish. If any one child task failed,
  # the exception of the first failing task is thrown.
  # @return [Hash] Map of tasks to their +info.result+ on success.
  # @raise +info.error+ on error.
  def wait_for_childtask_completion
    si = _connection.serviceInstance
    tasks_props = si.wait_for_multiple_tasks(
      ['info.state', 'info.result', 'info.error'],
      self.child_tasks
    )
    Hash[tasks_props.map do |task, props|
      case props['info.state']
      when 'success'
        [task, props['info.result']]
      when 'error'
        raise props['info.error']
      end
    end]
  end

  # Wait for a task to finish, with progress notifications.
  # @return (see #wait_for_completion)
  # @raise (see #wait_for_completion)
  # @yield [info.progress]
  def wait_for_progress
    wait_until('info.state', 'info.progress') do
      yield info.progress if block_given?
      %w(success error).member? info.state
    end
    case info.state
    when 'success'
      info.result
    when 'error'
      raise info.error
    end
  end
  
  # Get child tasks of this task.
  # @return [Array] List of VIM::Task objects
  def child_tasks
    tm = _connection.serviceContent.taskManager
    col = tm.CreateCollectorForTasks(:filter => {
      :rootTaskKey => [self.info.key],
    })
    # XXX: Likely this is not enough and we need to collect pages other
    #      than the latest.
    tasks = col.latestPage.map{|x| x.task}
    col.DestroyCollector()
    tasks
  end
end
