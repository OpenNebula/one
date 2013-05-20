require 'yaml'

# A class to manage VM leases
# 
# This class uses YAML encoded VM annotations (config.annotation) to manage a
# lease system. It helps add such lease info onto new and existing VMs and to
# find VMs that have expired leases or that are about to have expired leases.
# The calling code can use those to generate emails with about-to-expire 
# notifications, suspend, power off or destroy VMs that have exceeded their
# lease, etc. 
class LeaseTool
  # Lists of VM properties the LeaseTool needs to do its job. Can be used to
  # construct larger property collector calls that retrieve more info than just
  # one subsystem needs.
  # @return [Array] List of property names
  def vms_props_list 
    ['name', 'config.annotation']
  end
  
  # Fetch all VM properties that the LeaseTool needs on all VMs passed in. 
  # @param vms [Array] List of VIM::VirtualMachine instances
  # @return [Hash] Hash of VMs as keys and their properties as values
  def get_vms_props vms
    out = {}
    if vms.length > 0
      pc = vms.first._connection.serviceContent.propertyCollector
      out = pc.collectMultiple(vms, 'name', 'config.annotation')
    end
    out
  end
  
  # Retrieve the current time as used by the lease tool. 
  # @return [Time] Current time as used by the lease tool
  def current_time
    # XXX: Should swith to time provided by VC
    Time.now
  end
  
  # Helper function that sets the lease info in a passed in VM config. If there
  # is no annotation, it is added. If there is an annotation, it is updated to
  # include the lease info. Note that if the annotation isn't YAML, it is 
  # overwritten.  
  # @param vmconfig [Hash] Virtual Machine config spec
  # @param lease_minutes [int] Time to lease expiration from now in minutes
  # @return [Hash] Updated Virtual Machine config spec
  def set_lease_in_vm_config vmconfig, lease_minutes
    annotation = vmconfig[:annotation]
    annotation ||= ""
    note = YAML.load annotation
    if !note.is_a?(Hash)
      note = {}
    end
    lease = current_time + lease_minutes * 60
    note['lease'] = lease
    vmconfig[:annotation] = YAML.dump(note)
    vmconfig
  end
  
  # Issue ReconfigVM_Task on the VM to update the lease. User can pass in current
  # annotation, but if not, it is retrieved on demand. A task is returned, i.e.
  # function doesn't wait for completion.
  # @param vm [VIM::VirtualMachine] Virtual Machine instance
  # @param lease_minutes [int] Time to lease expiration from now in minutes
  # @param annotation [String] 'config.annotation' property of the VM. Optional.
  # @return [VIM::Task] VM reconfiguration task
  def set_lease_on_vm_task vm, lease_minutes, annotation = nil
    if !annotation
      annotation = vm.collect 'config.annotation' 
    end
    vmconfig = {:annotation => annotation}
    vmconfig = set_lease_in_vm_config vmconfig, lease_minutes
    # XXX: It may be a good idea to cite the VM version here to avoid
    #      concurrent writes to the annotation stepping on each others toes
    vm.ReconfigVM_Task(:spec => vmconfig)
  end
  
  # Issue ReconfigVM_Task to set the lease on all VMs that currently do not 
  # have a lease. All VM reconfigurations are done in parallel and the function
  # waits for all of them to complete
  # @param vms [Array] List of VIM::VirtualMachine instances, may or may not have leases
  # @param vmprops [Hash] Hash of VIM::VirtualMachine instances to their properties
  # @option opts [int]  :lease_minutes Time to lease expiration from now in minutes
  # @return [Array] List of previously leaseless VMs that now have a lease
  def set_lease_on_leaseless_vms vms, vmprops, opts = {}
    lease_minutes = opts[:lease_minutes]
    if !lease_minutes
      raise "Expected lease_minutes to be specified"
    end
    vms = find_leaseless_vms vms, vmprops
    if vms.length > 0
      tasks = vms.map do |vm|
        annotation = vmprops[vm]['config.annotation']
        task = set_lease_on_vm_task(vm, lease_minutes, annotation)
        task
      end
      si = vms.first._connection.serviceInstance
      si.wait_for_multiple_tasks [], tasks
    end
    vms
  end
  
  # Filter the list of passed in Virtual Machines and find the ones that currently
  # do not have a lease.
  # @param vms [Array] List of VIM::VirtualMachine instances, may or may not have leases
  # @param vmprops [Hash] Hash of VIM::VirtualMachine instances to their properties
  # @return [Array] List of leaseless VMs 
  def find_leaseless_vms vms, vmprops
    vms.reject do |vm|
      props = vmprops[vm]
      annotation = props['config.annotation']
      if annotation
        note = YAML.load annotation
        note.is_a?(Hash) && note['lease']
      end
    end
  end

  # Filter the list of passed in Virtul Machines and find the one that are 
  # expired. A time offset can be used to identify VMs that will expire at 
  # a certain point in the future. 
  # If a VM doesn't have a lease, it is treated as never expiring.
  # @param vms [Array] List of VIM::VirtualMachine instances, may or may not have leases
  # @param vmprops [Hash] Hash of VIM::VirtualMachine instances to their properties
  # @option opts [int]  :time_delta Time delta (seconds) to be added to current time
  # @return [Array] List of expired VMs 
  def filter_expired_vms vms, vmprops, opts = {}
    time_delta = opts[:time_delta] || 0
    time = current_time + time_delta
    
    out = vms.map do |vm|
      props = vmprops[vm]
      next unless annotation = props['config.annotation']
      note = YAML.load annotation
      next unless note.is_a?(Hash) && lease = note['lease']
      next unless time > lease
      time_to_expiration = ((lease - time) + time_delta)
      [vm, time_to_expiration]
    end.compact
    out = Hash[out]
    out
  end
end