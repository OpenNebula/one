require 'set'
require 'yaml'

# PerfAggregator is a class that, given connections to a list of vCenter
# Servers, will fetch the entire VM folder and ResourcePool hierarchies,
# including all VIM::VirtualMachine objects and aggregate VM stats along
# the tree hierarchies. The PerfAggregator class allows for users to 
# perform post processing on the data returned by vCenter, e.g. to augment
# it with addtional data that was obtained using a combination of 
# VM annotations (or custom values) and an external DB. Post processing
# can also define additional tree structures that may be completely 
# independent of the VM folder and ResourcePool hirarchies provided by
# vCenter, e.g. one based on VMs used for testing of a set of source code
# branches. 
class PerfAggregator
  attr_accessor :path_types
  
  def initialize logger = nil
    @logger = logger
    @path_types = Set.new 
    @path_types << 'rp'
    @path_types << 'vmfolder'
    
    # XXX: Rename this variable
    @perf_metrics = {
      'virtualDisk.read' => :sum, 
      'virtualDisk.write' => :sum,
      'virtualDisk.numberReadAveraged' => :sum, 
      'virtualDisk.numberWriteAveraged' => :sum,
      'virtualDisk.totalReadLatency.avg' => :avg_ignore_zero,
      'virtualDisk.totalWriteLatency.avg' => :avg_ignore_zero,
      'virtualDisk.totalReadLatency.max' => :max,
      'virtualDisk.totalWriteLatency.max' => :max,
      'num.vm' => :sum,
      'num.poweredonvm' => :sum,
      'summary.quickStats.hostMemoryUsage' => :sum,
      'summary.quickStats.guestMemoryUsage' => :sum,
      'summary.quickStats.overallCpuUsage' => :sum,
      'summary.config.memorySizeMB' => :sum,
      'summary.config.numCpu' => :sum,
      'storage.space.committed' => :sum,
      'storage.space.uncommitted' => :sum,
      'storage.space.unshared' => :sum,
    }
  end
  
  def log text
    if @logger
      @logger.info text 
    else
      puts "#{Time.now}: #{text}"
    end
  end
  
  def set_vm_processing_callback &block
    @vm_processing_callback = block
  end
  
  def add_node_unless_exists inventory, id, props
    if !inventory[id]
      inventory[id] = props.merge({'children' => []})
    end
  end
  
  # Method that extracts the entire VM folder and ResourcePool hierarchy
  # from vCenter with a single API call. It generates a flat list of 
  # VIM objects which will include VIM::Folder, VIM::Datacenter, 
  # VIM::ClusterComputeResource, VIM::ResourcePool and VIM::VirtualMachine.
  #
  # Post processing is done (using helper methods) to populate full paths,
  # lists of parents (ancestry) so that the tree structure can be understood.
  # Information about two seperate sub-trees is gathered: The tree following
  # the VM folders and one tree following the clusters and resource pools.
  # In the vSphere Client there are called the "VM/Template View" and the
  # "Host and Clusters View".
  #
  # @param rootFolder [VIM::Folder] Expected to be the rootFolder of the VC
  # @param vm_prop_names [Array] List of VM properties to fetch
  def all_inventory_flat rootFolder, vm_prop_names = ['name']
    conn = rootFolder._connection
    pc = conn.propertyCollector
  
    filterSpec = RbVmomi::VIM.PropertyFilterSpec(
      :objectSet => [
        :obj => rootFolder,
        :selectSet => [
          RbVmomi::VIM.TraversalSpec(
            :name => 'tsFolder',
            :type => 'Folder',
            :path => 'childEntity',
            :skip => false,
            :selectSet => [
              RbVmomi::VIM.SelectionSpec(:name => 'tsFolder'),
              RbVmomi::VIM.SelectionSpec(:name => 'tsDatacenterVmFolder'),
              RbVmomi::VIM.SelectionSpec(:name => 'tsDatacenterHostFolder'),
              RbVmomi::VIM.SelectionSpec(:name => 'tsClusterRP'),
              RbVmomi::VIM.SelectionSpec(:name => 'tsClusterHost'),
            ]
          ),
          RbVmomi::VIM.TraversalSpec(
            :name => 'tsDatacenterVmFolder',
            :type => 'Datacenter',
            :path => 'vmFolder',
            :skip => false,
            :selectSet => [
              RbVmomi::VIM.SelectionSpec(:name => 'tsFolder')
            ]
          ),
          RbVmomi::VIM.TraversalSpec(
            :name => 'tsDatacenterHostFolder',
            :type => 'Datacenter',
            :path => 'hostFolder',
            :skip => false,
            :selectSet => [
              RbVmomi::VIM.SelectionSpec(:name => 'tsFolder')
            ]
          ),
          RbVmomi::VIM.TraversalSpec(
            :name => 'tsClusterRP',
            :type => 'ClusterComputeResource',
            :path => 'resourcePool',
            :skip => false,
            :selectSet => [
              RbVmomi::VIM.SelectionSpec(:name => 'tsRP'),
            ]
          ),
          RbVmomi::VIM.TraversalSpec(
            :name => 'tsClusterHost',
            :type => 'ClusterComputeResource',
            :path => 'host',
            :skip => false,
            :selectSet => []
          ),
          RbVmomi::VIM.TraversalSpec(
            :name => 'tsRP',
            :type => 'ResourcePool',
            :path => 'resourcePool',
            :skip => false,
            :selectSet => [
              RbVmomi::VIM.SelectionSpec(:name => 'tsRP'),
            ]
          ),
        ]
      ],
      :propSet => [
        { :type => 'Folder', :pathSet => ['name', 'parent'] },
        { :type => 'Datacenter', :pathSet => ['name', 'parent'] },
        { :type => 'ClusterComputeResource', 
          :pathSet => ['name', 'parent', 'summary.effectiveCpu', 'summary.effectiveMemory'] 
        },
        { :type => 'ResourcePool', :pathSet => ['name', 'parent'] },
        { :type => 'HostSystem', :pathSet => ['name', 'parent', 'runtime.connectionState'] },
        { :type => 'VirtualMachine', :pathSet => vm_prop_names },
      ]
    )
  
    result = pc.RetrieveProperties(:specSet => [filterSpec])
    inventory = {}
    vms = {}
    result.each do |r| 
      if r.obj.is_a?(RbVmomi::VIM::VirtualMachine)
        vms[r.obj] = r.to_hash 
      else
        inventory[r.obj] = r.to_hash
      end
    end
    inventory['root'] = {
      'name' => 'root',
      'path' => 'root',
      'parent' => nil,
      'parents' => [],
    }
    inventory[conn.host] = {
      'name' => conn.host,
      'path' => "root/#{conn.host}",
      'parent' => 'root',
      'parents' => ['root'],
    }
    _compute_vmfolders_and_rp_paths conn.host, inventory 
    _compute_parents_and_children inventory
    [vms, inventory]
  end
  
  # Helper method that computes full paths and parent lists out of a 
  # flat list of objects. Operates recursively and doesn't yet split
  # the paths into different tree types.
  # @param obj [Hash] Property hash of current element
  # @param objs [Array] Flat list of tree elements
  def _compute_vmfolder_and_rp_path_and_parents vc, obj, objs
    if obj['path']
      return
    end
    if !obj['parent']
      obj['parent'] = vc
      obj['path'] = "root/#{vc}/#{obj['name']}"
      obj['parents'] = ['root', vc]
      return
    end
    parent = objs[obj['parent']]
    _compute_vmfolder_and_rp_path_and_parents(vc, parent, objs)
    obj['path'] = "%s/%s" % [parent['path'], obj['name']]
    obj['parents'] = [obj['parent']] + parent['parents']
    nil
  end
  
  # Helper method that computes full paths and parent lists out of a 
  # flat list of objects. Full paths are tracked seperately per type
  # of tree, i.e. seperately for the ResourcePool tree and the VM folder
  # tree. 
  # @param objs [Array] Flat list of tree elements
  def _compute_vmfolders_and_rp_paths vc, objs
    objs.each do |obj, props| 
      _compute_vmfolder_and_rp_path_and_parents(vc, props, objs)
      
      props['paths'] = {}
      obj_with_parents = [obj] + props['parents']
      dc = obj_with_parents.find{|x| x.is_a?(RbVmomi::VIM::Datacenter)}
      # Everything above and including a VIM::Datacenter is part of
      # both the rp and vmfolder tree. Anything below depends on the
      # folder of the datacenter it is under: The hostFolder is called
      # "host" while the root vm folder is called "vm".
      if !dc || obj.is_a?(RbVmomi::VIM::Datacenter)
        props['paths']['rp'] = props['path']
        props['paths']['vmfolder'] = props['path']
      else
        dc_index = obj_with_parents.index dc
        folder = obj_with_parents[dc_index - 1]
        if objs[folder]['name'] == 'host'
          props['paths']['rp'] = props['path']
        else
          props['paths']['vmfolder'] = props['path']
        end
      end
      
      props['children'] = []
    end
  end
  
  # Helper method that computes children references and parent paths on
  # all objects, if not computed yet. Assumes that full paths of each
  # object have been calculated already.
  # @param objs [Array] Flat list of tree elements
  def _compute_parents_and_children objs
    objs.each do |obj, props|
      if props['parent_paths']
        next
      end
      props['parent_paths'] = {}
      if !props['parent']
        next
      end
      parent = objs[props['parent']]
      props['paths'].keys.each do |type|
        props['parent_paths'][type] = parent['paths'][type]
      end
      parent['children'] << obj
    end
  end
  
  def _aggregate_metrics vms_stats, perf_metrics
    out = Hash[perf_metrics.keys.map{|x| [x, 0]}]
    avg_counter = Hash[perf_metrics.keys.map{|x| [x, 0]}]
  
    vms_stats.each do |vm_stats|
      perf_metrics.each do |key, type|
        values = vm_stats[key]
        if !values.is_a?(Array)
          values = [values]
        end
        values.compact.each do |val|
          if type == :sum
            out[key] += val
          elsif type == :max
            out[key] = [out[key], val].max
          elsif type == :avg
            out[key] += val.to_f
            avg_counter[key] += 1
          elsif type == :avg_ignore_zero
            if val > 0
              out[key] += val.to_f
              avg_counter[key] += 1
            end
          end
        end
      end
    end
  
    perf_metrics.each do |key, type|
      if type == :avg_ignore_zero || type == :avg
        if avg_counter[key] > 0
          out[key] = out[key] / avg_counter[key]
        end
      end
    end
    
    out
  end
  
  def _collect_info_on_all_vms_single root_folder, opts = {}
    prop_names = opts[:prop_names]
    if !prop_names
      prop_names = [
        'name',
        'config.template',
        'runtime.powerState', 'datastore', 'config.annotation', 
        'parent', 'resourcePool', 'storage.perDatastoreUsage',
        'summary.config.memorySizeMB',
        'summary.config.numCpu',
        'summary.quickStats.hostMemoryUsage',
        'summary.quickStats.guestMemoryUsage',
        'summary.quickStats.overallCpuUsage',
        'runtime.connectionState',
        'config.instanceUuid',
        'customValue',
      ]
    end
    perf_metrics = opts[:perf_metrics]
    if !perf_metrics
      perf_metrics = {
        'virtualDisk.read' => :avg, 
        'virtualDisk.write' => :avg,
        'virtualDisk.numberReadAveraged' => :avg, 
        'virtualDisk.numberWriteAveraged' => :avg,
        'virtualDisk.totalReadLatency' => :avg_ignore_zero,
        'virtualDisk.totalWriteLatency' => :avg_ignore_zero,
      }
    end
    host_perf_metrics = opts[:host_perf_metrics]
    if !host_perf_metrics
      host_perf_metrics = {
        'cpu.usage' => :avg, 
        'mem.usage' => :avg,
      }
    end

    vms_props, inventory = all_inventory_flat root_folder, prop_names
    vms = vms_props.keys
    
    hosts_props = inventory.select{|k, v| k.is_a?(RbVmomi::VIM::HostSystem)}

    conn = root_folder._connection
    sc = conn.serviceContent
    pc = sc.propertyCollector
    pm = sc.perfManager
    vc_uuid = conn.instanceUuid
  
    connected_vms = vms_props.select do |vm, props| 
      is_connected = props['runtime.connectionState'] != "disconnected"
      is_template = props['config.template']
      is_connected && !is_template
    end.keys
    
    begin
      # XXX: Need to find a good way to get the "right" samples
      if connected_vms.length == 0
        {}
      else
        vms_stats = pm.retrieve_stats(
          connected_vms, perf_metrics.keys, 
          :max_samples => 3
        )
      end
    rescue RbVmomi::Fault => ex
      if ex.fault.is_a? RbVmomi::VIM::ManagedObjectNotFound
        connected_vms -= [ex.fault.obj]
        retry
      end
      raise
    end

    connected_hosts = hosts_props.select do |k,v| 
      v['runtime.connectionState'] != "disconnected"
    end
    if connected_hosts.length > 0
      hosts_stats = pm.retrieve_stats(
        connected_hosts.keys, host_perf_metrics.keys, 
        :max_samples => 3
      )
    end
    hosts_props.each do |host, props|
      if !connected_hosts[host]
        next
      end
      
      stats = hosts_stats[host] || {}
      stats = stats[:metrics] || {}
      stats = _aggregate_metrics [stats], host_perf_metrics
      props.merge!(stats)
    end
    
    vms_props.each do |vm, props|
      if !connected_vms.member?(vm)
        next
      end
      props['num.vm'] = 1
      powered_on = (props['runtime.powerState'] == 'poweredOn')
      props['num.poweredonvm'] = powered_on ? 1 : 0
      
      stats = vms_stats[vm] || {}
      stats = stats[:metrics] || {}
      stats = _aggregate_metrics [stats], perf_metrics
      props.merge!(stats)
      props['virtualDisk.totalReadLatency.avg'] = props['virtualDisk.totalReadLatency']
      props['virtualDisk.totalWriteLatency.avg'] = props['virtualDisk.totalWriteLatency']
      props['virtualDisk.totalReadLatency.max'] = props['virtualDisk.totalReadLatency']
      props['virtualDisk.totalWriteLatency.max'] = props['virtualDisk.totalWriteLatency']
      props.delete('virtualDisk.totalReadLatency')
      props.delete('virtualDisk.totalWriteLatency')

      per_ds_usage = props['storage.perDatastoreUsage']
      props['storage.space.committed'] = per_ds_usage.map{|x| x.committed}.inject(0, &:+)
      props['storage.space.uncommitted'] = per_ds_usage.map{|x| x.uncommitted}.inject(0, &:+)
      props['storage.space.unshared'] = per_ds_usage.map{|x| x.unshared}.inject(0, &:+)

      props['parent_paths'] = {}
      if inventory[props['parent']]
        props['parent_paths']['vmfolder'] = inventory[props['parent']]['path']
      end
      if !props['config.template']
        rp_props = inventory[props['resourcePool']]
        props['parent_paths']['rp'] = rp_props['path']
      end
      
      props['annotation_yaml'] = YAML.load(props['config.annotation'] || '')
      if !props['annotation_yaml'].is_a?(Hash)
        props['annotation_yaml'] = {}
      end
      
      props['customValue'] = Hash[props['customValue'].map do |x|
        [x.key, x.value]
      end]
      
      props['vc_uuid'] = vc_uuid
    end
    
    [vms_props, inventory, hosts_props]    
  end
  
  def collect_info_on_all_vms root_folders, opts = {}
    log "Fetching information from all VCs ..." 
    vms_props = {}
    hosts_props = {}
    inventory = {}
    lock = Mutex.new
    root_folders.map do |root_folder|
      Thread.new do 
        begin
          single_vms_props, single_inventory, single_hosts_props = 
            _collect_info_on_all_vms_single(root_folder, opts)
          
          lock.synchronize do 
            vms_props.merge!(single_vms_props)
            if inventory['root']
              single_inventory['root']['children'] += inventory['root']['children']
            end
            inventory.merge!(single_inventory)
            hosts_props.merge!(single_hosts_props)
          end
        rescue Exception => ex
          log "#{ex.class}: #{ex.message}"
          ex.backtrace.each do |line|
            log line
          end
          raise
        end
      end
    end.each{|t| t.join}

    log "Make data marshal friendly ..." 
    inventory = _make_marshal_friendly(inventory)
    vms_props = _make_marshal_friendly(vms_props)
    hosts_props = _make_marshal_friendly(hosts_props)

    log "Perform external post processing ..." 
    if @vm_processing_callback
      @vm_processing_callback.call(self, vms_props, inventory)
    end
    
    log "Perform data aggregation ..." 
    # Processing the annotations may have added new nodes to the 
    # inventory list, hence we need to run _compute_parents_and_children
    # again to calculate the parents and children for the newly
    # added nodes.
    _compute_parents_and_children inventory

    # Now that we have all VMs and a proper inventory tree built, we can
    # aggregate the VM stats along all trees and tree nodes. This 
    # de-normalizes the data heavily, but thats fine
    path_types = opts[:path_types] || @path_types
    inventory = _aggregate_vms path_types, vms_props, inventory
    
    log "Done collecting and aggregating stats"

    @inventory = inventory
    @vms_props = vms_props
    
    {
      'inventory' => inventory, 
      'vms_props' => vms_props, 
      'hosts_props' => hosts_props,
    }
  end
  
  def _make_marshal_friendly hash
    hash = Hash[hash.map do |k, v|
      if v['parent']
        v['parent'] = _mo2str(v['parent'])
      end
      if v['resourcePool']
        v['resourcePool'] = _mo2str(v['resourcePool'])
      end
      if v['children']
        v['children'] = v['children'].map{|x| _mo2str(x)}
      end
      if v['parents']
        v['parents'] = v['parents'].map{|x| _mo2str(x)}
      end
      if v['datastore']
        v['datastore'] = v['datastore'].map{|x| _mo2str(x)}
      end
      v['type'] = k.class.name
      [_mo2str(k), v]
    end]    
    # Marhsal hash to JSON and back. This is just debug code to ensure 
    # that all further processing can be done on a serialized dump of 
    # the data.
    hash = JSON.load(JSON.dump(hash))
  end
  
  def _mo2str mo
    if !mo.is_a?(RbVmomi::VIM::ManagedObject)
      mo
    else
      "vim-#{mo._connection.instanceUuid}-#{mo._ref}"
    end
  end
  
  # Helper method that aggregates the VM stats along all trees and 
  # tree nodes. This de-normalizes the data heavily, but thats fine.
  def _aggregate_vms path_types, vms_props, inventory
    # XXX: Opimtization:
    #      This function is currently quite wasteful. It computes all VMs
    #      at each level and then aggregates the VMs for each node individually
    #      Instead, the aggregation itself should explot the tree structure.
    path_types.each do |path_type|
      index = {}
      reverse_index = {}
      inventory.each do |k, v|
        if v['paths'] && v['paths'][path_type]
          path = v['paths'][path_type]
          index[path] = v
          reverse_index[path] = k
        end
      end
      
      paths_vms = {}
      
      vms_props.each do |vm, props|
        if !props['parent_paths'] || !props['parent_paths'][path_type]
          next
        end
        parent_path = props['parent_paths'][path_type]
        while parent_path
          parent = index[parent_path]
          if !parent
            puts "Parent is nil, so dumping some stuff"
            puts path_type
            puts "parent path: #{parent_path}"
            pp index.keys
            pp props
          end
          paths_vms[parent_path] ||= []
          paths_vms[parent_path] << vm
          parent_path = parent['parent_paths'][path_type]
        end
      end
      
      paths_vms.each do |k, vms|
        inventory[reverse_index[k]]['vms'] ||= {}
        inventory[reverse_index[k]]['vms'][path_type] = vms
        vms_stats = vms_props.select{|k, v| vms.member?(k)}.values
        stats = _aggregate_metrics vms_stats, @perf_metrics
        inventory[reverse_index[k]]['stats'] ||= {}
        inventory[reverse_index[k]]['stats'][path_type] = stats
      end
      
      #pp paths_vms.map{|k, v| [k, reverse_index[k], v.length, index[k]['stats'][path_type].length]}
    end
    
    inventory
  end
  
  def visualize_vm_props
    path_types_rows = construct_tree_rows_from_vm_props
    path_types_rows.each do |path_type, rows|
      puts "Path type #{path_type}:"
      rows.each do |row|
        indent, name, stats = row
        puts "#{'  ' * indent}#{name}: #{stats['num.vm']}"
      end
      puts ""
    end
  end

  def construct_tree_rows_from_vm_props path_types = nil
    path_types ||= @path_types
    def visualize_node path_type, node, inventory, indent = 0
      rows = []
      if !node || !node['stats'] || !node['stats'][path_type]
        stats = {}
        return []
      else
        stats = node['stats'][path_type]
      end
      rows << [indent, node['name'], stats]
      node['children'].each do |child|
        rows += visualize_node path_type, inventory[child], inventory, indent + 1
      end
      rows
    end
    
    Hash[path_types.map do |path_type|
      key, root = @inventory.find{|k, v| v['paths'][path_type] == 'root'}
      rows = visualize_node path_type, root, @inventory
      [path_type, rows]
    end]
  end
end
