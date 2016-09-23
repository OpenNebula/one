class RbVmomi::VIM::Datacenter
  # Traverse the given inventory +path+ to find a ComputeResource.
  def find_compute_resource path
    hostFolder.traverse path, RbVmomi::VIM::ComputeResource
  end

  # Find the Datastore with the given +name+.
  def find_datastore name
    datastore.find { |x| x.name == name }
  end

  # Traverse the given inventory +path+ to find a VirtualMachine.
  def find_vm path
    vmFolder.traverse path, RbVmomi::VIM::VirtualMachine
  end

  # Traverse the given inventory +path+ to find a Folder.
  def find_folder path
    vmFolder.traverse path, RbVmomi::VIM::Folder
  end
end

