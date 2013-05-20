class RbVmomi::VIM::ComputeResource
  # Aggregate cluster information.
  #
  # @note Values are returned in a hash.
  #
  # @return [Mhz] totalCPU: Sum of the frequencies of each CPU in the cluster.
  # @return [Mhz] usedCPU:  CPU cycles used across the cluster.
  # @return [MB]  totalMem: Total RAM.
  # @return [MB]  usedMem:  Used RAM.
  def stats
    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
      :objectSet => [{
        :obj => self,
        :selectSet => [
          RbVmomi::VIM.TraversalSpec(
            :name => 'tsHosts',
            :type => 'ComputeResource',
            :path => 'host',
            :skip => false
          )
        ]
      }],
      :propSet => [{
        :pathSet => %w(name overallStatus summary.hardware.cpuMhz
                    summary.hardware.numCpuCores summary.hardware.memorySize
                    summary.quickStats.overallCpuUsage
                    summary.quickStats.overallMemoryUsage),
        :type => 'HostSystem'
      }]
    )

    result = _connection.propertyCollector.RetrieveProperties(:specSet => [filterSpec])

    stats = {
      :totalCPU => 0,
      :totalMem => 0,
      :usedCPU => 0,
      :usedMem => 0,
    }

    result.each do |x|
      next if x['overallStatus'] == 'red'
      stats[:totalCPU] += x['summary.hardware.cpuMhz'] * x['summary.hardware.numCpuCores']
      stats[:totalMem] += x['summary.hardware.memorySize'] / (1024*1024)
      stats[:usedCPU] += x['summary.quickStats.overallCpuUsage'] || 0
      stats[:usedMem] += x['summary.quickStats.overallMemoryUsage'] || 0
    end

    stats
  end
end
