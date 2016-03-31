
# An admission controlled resource scheduler for large scale vSphere deployments
#
# While DRS (Dynamic Resource Scheduler) in vSphere handles CPU and Memory 
# allocations within a single vSphere cluster, larger deployments require 
# another layer of scheduling to make the use of multiple clusters transparent.
# So this class doesn't replace DRS, but in fact works on top of it. 
#
# The scheduler in this class performs admission control to make sure clusters
# don't get overloaded. It does so by adding additional metrics to the already
# existing CPU and Memory reservation system that DRS has. After admission 
# control it also performs very basic initial placement. Note that in-cluster
# placement and load-balancing is left to DRS. Also note that no cross-cluster
# load balancing is done. 
#
# This class uses the concept of a Pod: A set of clusters that share a set of
# datastores. From a datastore perspective, we are free to place a VM on any
# host or cluster. So admission control is done at the Pod level first. Pods
# are automatically dicovered based on lists of clusters and datastores.
#
# Admission control covers the following metrics:
# - Host availability: If no hosts are available within a cluster or pod, 
#   admission is denied.
# - Minimum free space: If a datastore falls below this free space percentage,
#   admission to it will be denied. Admission to a pod is granted as long at 
#   least one datastore passes admission control.
# - Maximum number of VMs: If a Pod exceeds a configured number of powered on
#   VMs, admission is denied. This is a crude but effective catch-all metric
#   in case users didn't set proper individual CPU or Memory reservations or 
#   if the scalability limit doesn't originate from CPU or Memory.
#
# Placement after admission control:
# - Cluster selection: A load metric based on a combination of CPU and Memory
#   load is used to always select the "least loaded" cluster. The metric is very
#   crude and only meant to do very rough load balancing. If DRS clusters are 
#   large enough, this is good enough in most cases though. 
# - Datastore selection: Right now NO intelligence is implemented here. 
#
# Usage:
# Instantiate the class, call make_placement_decision and then use the exposed
# computer (cluster), resource pool, vm_folder and datastore. Currently once 
# computed, a new updated placement can't be generated.
class AdmissionControlledResourceScheduler
  attr_reader :rp
  
  def initialize vim, opts = {}
    @vim = vim
    
    @datacenter = opts[:datacenter]
    @datacenter_path = opts[:datacenter_path]
    @vm_folder = opts[:vm_folder]
    @vm_folder_path = opts[:vm_folder_path]
    @rp_path = opts[:rp_path]
    @computers = opts[:computers]
    @computer_names = opts[:computer_names]
    @datastores = opts[:datastores]
    @datastore_paths = opts[:datastore_paths]
    
    @max_vms_per_pod = opts[:max_vms_per_pod]
    @min_ds_free = opts[:min_ds_free]
    @service_docs_url = opts[:service_docs_url]
    
    @pc = @vim.serviceContent.propertyCollector
    @root_folder = @vim.serviceContent.rootFolder
    
    @logger = opts[:logger]
  end
   
  def log x
    if @logger
      @logger.info x
    else
      puts "#{Time.now}: #{x}"
    end
  end

  # Returns the used VM folder. If not set yet, uses the vm_folder_path to 
  # lookup the folder. If it doesn't exist, it is created. Collisions between
  # multiple clients concurrently creating the same folder are handled.
  # @return [VIM::Folder] The VM folder
  def vm_folder 
    retries = 1
    begin
      @vm_folder ||= datacenter.vmFolder.traverse!(@vm_folder_path, VIM::Folder)
      if !@vm_folder 
        fail "VM folder #{@vm_folder_path} not found"
      end
    rescue RbVmomi::Fault => fault
      if !fault.fault.is_a?(RbVmomi::VIM::DuplicateName)
        raise
      else
        retries -= 1
        retry if retries >= 0 
      end 
    end
    @vm_folder    
  end

  # Returns the used Datacenter. If not set yet, uses the datacenter_path to 
  # lookup the datacenter. 
  # @return [VIM::Datacenter] The datacenter
  def datacenter
    if !@datacenter
      @datacenter = @root_folder.traverse(@datacenter_path, VIM::Datacenter) 
      if !@datacenter 
        fail "datacenter #{@datacenter_path} not found"
      end
    end
    @datacenter
  end

  # Returns the candidate datastores. If not set yet, uses the datastore_paths 
  # to lookup the datastores under the datacenter.
  # As a side effect, also looks up properties about all the datastores 
  # @return [Array] List of VIM::Datastore
  def datastores
    if !@datastores
      @datastores = @datastore_paths.map do |path|
        ds = datacenter.datastoreFolder.traverse(path, VIM::Datastore)
        if !ds 
          fail "datastore #{path} not found"
        end
        ds
      end
    end
    if !@datastore_props
      @datastore_props = @pc.collectMultiple(@datastores, 'summary', 'name')
    end
    @datastores
  end

  # Returns the candidate computers (aka clusters). If not set yet, uses the 
  # computer_names to look them up. 
  # @return [Array] List of [VIM::ClusterComputeResource, Hash] tuples, where
  #                 the Hash is a list of stats about the computer
  def computers
    if !@computers
      @computers = @computer_names.map do |name|
        computer = datacenter.find_compute_resource(name)
        [computer, computer.stats]
      end
    end
    @computers
  end

  # Returns the candidate pods. If not set, automatically computes the pods 
  # based on the list of computers (aka clusters) and datastores. 
  # @return [Array] List of pods, where a pod is a list of VIM::ClusterComputeResource
  def pods
    if !@pods
      # A pod is defined as a set of clusters (aka computers) that share the same
      # datastore accessibility. Computing pods is done automatically using simple
      # set theory math.
      computersProps = @pc.collectMultiple(computers.map{|x| x[0]}, 'datastore')
      @pods = computers.map do |computer, stats|
        computersProps[computer]['datastore'] & self.datastores
      end.uniq.map do |ds_list|
        computers.map{|x| x[0]}.select do |computer|
          (computer.datastore & self.datastores) == ds_list
        end
      end
    end
    @pods  
  end
  
  # Returns all VMs residing with a pod. Doesn't account for templates. Does so
  # very efficiently using a single API query.
  # @return [Hash] Hash of VMs as keys and their properties as values.
  def pod_vms pod
    # This function retrieves all VMs residing inside a pod
    filterSpec = VIM.PropertyFilterSpec(
      objectSet: pod.map do |computer, stats|
        {
          obj: computer.resourcePool,
          selectSet: [
            VIM.TraversalSpec(
              name: 'tsFolder',
              type: 'ResourcePool',
              path: 'resourcePool',
              skip: false,
              selectSet: [
                VIM.SelectionSpec(name: 'tsFolder'),
                VIM.SelectionSpec(name: 'tsVM'),
              ]
            ),
            VIM.TraversalSpec(
              name: 'tsVM',
              type: 'ResourcePool',
              path: 'vm',
              skip: false,
              selectSet: [],
            )
          ]
        }
      end,
      propSet: [
        { type: 'ResourcePool', pathSet: ['name'] },
        { type: 'VirtualMachine', pathSet: %w(runtime.powerState) }
      ]
    )
  
    result = @vim.propertyCollector.RetrieveProperties(specSet: [filterSpec])
  
    out = result.map { |x| [x.obj, Hash[x.propSet.map { |y| [y.name, y.val] }]] }
    out.select{|obj, props| obj.is_a?(VIM::VirtualMachine)}
  end
  
  # Returns all candidate datastores for a given pod.
  # @return [Array] List of VIM::Datastore
  def pod_datastores pod
    pod.first.datastore & self.datastores
  end
  
  # Returns the list of pods that pass admission control. If not set yet, performs
  # admission control to compute the list. If no pods passed the admission 
  # control, an exception is thrown.
  # @return [Array] List of pods, where a pod is a list of VIM::ClusterComputeResource
  def filtered_pods
    # This function applies admission control and returns those pods that have
    # passed admission control. An exception is thrown if access was denied to 
    # all pods.
    if !@filtered_pods
      log "Performing admission control:"
      @filtered_pods = self.pods.select do |pod|
        # Gather some statistics about the pod ...
        on_vms = pod_vms(pod).select{|k,v| v['runtime.powerState'] == 'poweredOn'}
        num_pod_vms = on_vms.length
        pod_datastores = self.pod_datastores(pod)
        log "Pod: #{pod.map{|x| x.name}.join(', ')}"
        log "   #{num_pod_vms} VMs"
        pod_datastores.each do |ds|
          ds_sum = @datastore_props[ds]['summary']
          @datastore_props[ds]['free_percent'] = ds_sum.freeSpace.to_f * 100 / ds_sum.capacity
        end
        pod_datastores.each do |ds|
          ds_props = @datastore_props[ds]
          ds_name = ds_props['name']
          free = ds_props['free_percent']
          free_gb = ds_props['summary'].freeSpace.to_f / 1024**3
          free_str = "%.2f GB (%.2f%%)" % [free_gb, free]
          log "   Datastore #{ds_name}: #{free_str} free"
        end
        
        # Admission check: VM limit
        denied = false
        max_vms = @max_vms_per_pod
        if max_vms && max_vms > 0
          if num_pod_vms > max_vms
            err = "VM limit (#{max_vms}) exceeded on this Pod"
            denied = true
          end
        end
    
        # Admission check: Free space on datastores
        min_ds_free = @min_ds_free
        if min_ds_free && min_ds_free > 0
          # We need at least one datastore with enough free space
          low_list = pod_datastores.select do |ds|
            @datastore_props[ds]['free_percent'] <= min_ds_free
          end
          
          if low_list.length == pod_datastores.length
            dsNames = low_list.map{|ds| @datastore_props[ds]['name']}.join(", ")
            err = "Datastores #{dsNames} below minimum free disk space (#{min_ds_free}%)"
            denied = true
          end
        end
        
        # Admission check: Hosts are available
        if !denied
          hosts_available = pod.any? do |computer|
            stats = Hash[self.computers][computer]
            stats[:totalCPU] > 0 && stats[:totalMem] > 0
          end
          if !hosts_available
            err = "No hosts are current available in this pod"
            denied = true
          end
        end
    
        if denied    
          log "   Admission DENIED: #{err}"
        else
          log "   Admission granted"
        end
        
        !denied
      end
    end
    if @filtered_pods.length == 0
      log "Couldn't find any Pod with enough resources."
      if @service_docs_url
        log "Check #{@service_docs_url} to see which other Pods you may be able to use"
      end
      fail "Admission denied"
    end
    @filtered_pods
  end

  # Returns the computer (aka cluster) to be used for placement. If not set yet,
  # computs the least loaded cluster (using a metric that combines CPU and Memory
  # load) that passes admission control.
  # @return [VIM::ClusterComputeResource] Chosen computer (aka cluster)
  def pick_computer placementhint = nil
    if !@computer
      # Out of the pods to which we have been granted access, pick the cluster
      # (aka computer) with the lowest CPU/Mem utilization for load balancing
      available = self.filtered_pods.flatten
      eligible = self.computers.select do |computer,stats|
        available.member?(computer) && stats[:totalCPU] > 0 and stats[:totalMem] > 0
      end
      computer = nil
      if placementhint
        if eligible.length > 0
          computer = eligible.map{|x| x[0]}[placementhint % eligible.length]
        end
      else
        computer, = eligible.min_by do |computer,stats|
          2**(stats[:usedCPU].to_f/stats[:totalCPU]) + (stats[:usedMem].to_f/stats[:totalMem])
        end
      end
    
      if !computer 
        fail "No clusters available, should have been prevented by admission control"
      end
      @computer = computer
    end
    @computer
  end

  # Returns the datastore to be used for placement. If not set yet, picks a
  # datastore without much intelligence, as long as it passes admission control.
  # @return [VIM::Datastore] Chosen datastore
  def datastore placementHint = nil
    if @datastore
      return @datastore
    end
    
    pod_datastores = pick_computer.datastore & datastores
  
    eligible = pod_datastores.select do |ds|
      min_ds_free = @min_ds_free
      if min_ds_free && min_ds_free > 0
        ds_sum = @datastore_props[ds]['summary']
        free_percent = ds_sum.freeSpace.to_f * 100 / ds_sum.capacity    
        free_percent > min_ds_free
      else
        true
      end
    end
  
    if eligible.length == 0
      fail "Couldn't find any eligible datastore. Admission control should have prevented this"
    end
    
    if placementHint && placementHint > 0
      @datastore = eligible[placementHint % eligible.length]
    else
      @datastore = eligible.first
    end  
    @datastore
  end
  
  # Runs the placement algorithm and populates all the various properties as 
  # a side effect. Run this first, before using the other functions of this
  # class.
  def make_placement_decision opts = {}
    self.filtered_pods
    self.pick_computer opts[:placementHint]
    log "Selected compute resource: #{@computer.name}"
  
    @rp = @computer.resourcePool.traverse(@rp_path)
    if !@rp 
      fail "Resource pool #{@rp_path} not found"
    end
    log "Resource pool: #{@rp.pretty_path}"
  
    stats = @computer.stats
    if stats[:totalMem] > 0 && stats[:totalCPU] > 0
      cpu_load = "#{(100*stats[:usedCPU])/stats[:totalCPU]}% cpu"
      mem_load = "#{(100*stats[:usedMem])/stats[:totalMem]}% mem"
      log "Cluster utilization: #{cpu_load}, #{mem_load}"
    end
        
    user_vms = vm_folder.inventory_flat('VirtualMachine' => %w(name storage)).select do |k, v| 
      k.is_a?(RbVmomi::VIM::VirtualMachine)
    end
    numVms = user_vms.length
    unshared = user_vms.map do |vm, info| 
      info['storage'].perDatastoreUsage.map{|x| x.unshared}.inject(0, &:+)
    end.inject(0, &:+)
    log "User stats: #{numVms} VMs using %.2fGB of storage" % [unshared.to_f / 1024**3]
    
    @placement_hint = opts[:placement_hint] || (rand(100) + 1)
    datastore = self.datastore @placement_hint
    log "Datastore: #{datastore.name}"
  end
end