require 'open-uri'
require 'nokogiri'
require 'rbvmomi'

# The cached ovf deployer is an optimization on top of regular OVF deployment
# as it is offered by the VIM::OVFManager. Creating a VM becomes a multi-stage
# process: First the OVF is uploaded and instead of directly using it, it is 
# prepared for linked cloning and marked as a template. It can then be cloned
# many times over, without the cost of repeated OVF deploys (network and storage
# IO) and the cost of storing the same base VM several times (storage space).
# Multiple concurrent users can try to follow this process and collisions are
# automatically detected and de-duplicated. One thread will win to create the
# OVF template, while the other will wait for the winning thread to finish the
# task. So even fully independent, distributed and unsynchronized clients using
# this call with be auto-synchronized just by talking to the same vCenter 
# instance and using the name naming scheme for the templates. 
#
# The caching concept above can be extended to multiple levels. Lets assume 
# many VMs will share the same base OS, but are running different builds of the
# application running inside the VM. If it is expected that again many (but not 
# all) VMs will share the same build of the application, a tree structure of 
# templates becomes useful. At the root of the tree is the template with just
# the base OS. It is uploaded from an OVF if needed. Then, this base OS image
# is cloned, a particular build is installed and the resulting VM is again marked
# as a template. Users can then instantiate that particular build with very 
# little extra overhead. This class supports such multi level templates via the
# :is_template parameter of linked_clone().
class CachedOvfDeployer
  # Constructor. Gets the VIM connection and important VIM objects 
  # @param vim [VIM] VIM Connection
  # @param network [VIM::Network] Network to attach templates and VMs to
  # @param computer [VIM::ComputeResource] Host/Cluster to deploy templates/VMs to
  # @param template_folder [VIM::Folder] Folder in which all templates are kept
  # @param vm_folder [VIM::Folder] Folder into which to deploy VMs
  # @param datastore [VIM::Folder] Datastore to store template/VM in
  # @param opts [Hash] Additional parameters
  def initialize vim, network, computer, template_folder, vm_folder, datastore, opts = {}
    @vim = vim
    @network = network
    @computer = computer
    @rp = @computer.resourcePool
    @template_folder = template_folder
    @vmfolder = vm_folder
    @datastore = datastore
    @logger = opts[:logger]
  end
  
  def log x
    if @logger 
      @logger.info x
    else
      puts "#{Time.now}: #{x}"
    end
  end
  
  # Internal helper method that executes the passed in block while disabling 
  # the handling of SIGINT and SIGTERM signals. Restores their handlers after
  # the block is executed. 
  # @param enabled [Boolean] If false, this function is a no-op
  def _run_without_interruptions enabled
    if enabled
      int_handler = Signal.trap("SIGINT", 'IGNORE')
      term_handler = Signal.trap("SIGTERM", 'IGNORE')
    end
    
    yield
    
    if enabled
      Signal.trap("SIGINT", int_handler)
      Signal.trap("SIGTERM", term_handler)
    end
  end
  
  # Uploads an OVF, prepares the resulting VM for linked cloning and then marks
  # it as a template. If another thread happens to race to do the same task, 
  # the losing thread will not do the actual work, but instead wait for the 
  # winning thread to do the work by looking up the template VM and waiting for
  # it to be marked as a template. This way, the cost of uploading and keeping
  # the full size of the VM is only paid once.
  # @param ovf_url [String] URL to the OVF to be deployed. Currently only http 
  #                         and https are supported
  # @param template_name [String] Name of the template to be used. Should be the
  #                               same name for the same URL. A cluster specific
  #                               post-fix will automatically be added.
  # @option opts [int]  :run_without_interruptions Whether or not to disable
  #                                                SIGINT and SIGTERM during
  #                                                the OVF upload.
  # @option opts [Hash] :config VM Config delta to apply after the OVF deploy is
  #                             done. Allows the template to be customized, e.g.
  #                             to set annotations.
  # @return [VIM::VirtualMachine] The template as a VIM::VirtualMachine instance
  def upload_ovf_as_template ovf_url, template_name, opts = {}
    # Optimization: If there happens to be a fully prepared template, then
    # there is no need to do the complicated OVF upload dance
    template = lookup_template template_name
    if template
      return template
    end
    
    # The OVFManager expects us to know the names of the networks mentioned
    # in the OVF file so we can map them to VIM::Network objects. For 
    # simplicity this function assumes we need to read the OVF file 
    # ourselves to know the names, and we map all of them to the same
    # VIM::Network.

    # If we're handling a file:// URI we need to strip the scheme as open-uri
    # can't handle them.
    if URI(ovf_url).scheme == "file" && URI(ovf_url).host.nil?
      ovf_url = URI(ovf_url).path
    end

    ovf = open(ovf_url, 'r'){|io| Nokogiri::XML(io.read)}
    ovf.remove_namespaces!
    networks = ovf.xpath('//NetworkSection/Network').map{|x| x['name']}
    network_mappings = Hash[networks.map{|x| [x, @network]}]

    network_mappings_str = network_mappings.map{|k, v| "#{k} = #{v.name}"}
    log "networks: #{network_mappings_str.join(', ')}"

    pc = @vim.serviceContent.propertyCollector
    
    # OVFs need to be uploaded to a specific host. DRS won't just pick one
    # for us, so we need to pick one wisely. The host needs to be connected,
    # not be in maintenance mode and must have the destination datastore
    # accessible.
    hosts = @computer.host
    hosts_props = pc.collectMultiple(
      hosts, 
      'datastore', 'runtime.connectionState', 
      'runtime.inMaintenanceMode', 'name'
    )
    host = hosts.shuffle.find do |x|
      host_props = hosts_props[x] 
      is_connected = host_props['runtime.connectionState'] == 'connected'
      is_ds_accessible = host_props['datastore'].member?(@datastore)
      is_connected && is_ds_accessible && !host_props['runtime.inMaintenanceMode']
    end
    if !host
      fail "No host in the cluster available to upload OVF to"
    end
    
    log "Uploading OVF to #{hosts_props[host]['name']}..."
    property_mappings = {}

    # To work around the VMFS 8-host limit (existed until ESX 5.0), as 
    # well as just for organization purposes, we create one template per 
    # cluster. This also provides us with additional isolation. 
    vm_name = template_name+"-#{@computer.name}"

    vm = nil
    wait_for_template = false
    # If the user sets opts[:run_without_interruptions], we will block
    # signals from the user (SIGINT, SIGTERM) in order to not be interrupted.
    # This is desirable, as other threads depend on this thread finishing
    # its prepare job and thus interrupting it has impacts beyond this
    # single thread or process.
    _run_without_interruptions(opts[:run_without_interruptions]) do 
      begin 
        vm = @vim.serviceContent.ovfManager.deployOVF(
          uri: ovf_url,
          vmName: vm_name,
          vmFolder: @template_folder,
          host: host,
          resourcePool: @rp,
          datastore: @datastore,
          networkMappings: network_mappings,
          propertyMappings: property_mappings)
      rescue RbVmomi::Fault => fault
        # If two threads execute this script at the same time to upload
        # the same template under the same name, one will win and the other
        # with be rejected by VC. We catch those cases here, and handle 
        # them by waiting for the winning thread to finish preparing the
        # template, see below ...
        is_duplicate = fault.fault.is_a?(RbVmomi::VIM::DuplicateName)
        is_duplicate ||= (fault.fault.is_a?(RbVmomi::VIM::InvalidState) && 
                          !fault.fault.is_a?(RbVmomi::VIM::InvalidHostState))
        if is_duplicate
          wait_for_template = true
        else
          raise fault
        end
      end
  
      # The winning thread succeeded in uploading the OVF. Now we need to
      # prepare it for (linked) cloning and mark it as a template to signal
      # we are done.
      if !wait_for_template
        config = opts[:config] || {}
        config = vm.update_spec_add_delta_disk_layer_on_all_disks(config)
        # XXX: Should we add a version that does retries?
        vm.ReconfigVM_Task(:spec => config).wait_for_completion
        vm.MarkAsTemplate
      end
    end
    
    # The losing thread now needs to wait for the winning thread to finish
    # uploading and preparing the template
    if wait_for_template
      log "Template already exists, waiting for it to be ready"
      vm = _wait_for_template_ready @template_folder, vm_name
      log "Template fully prepared and ready to be cloned"
    end
    
    vm
  end
  
  # Looks up a template by name in the configured template_path. Should be used
  # before uploading the VM via upload_ovf_as_template, although that is 
  # not strictly required, but a lot more efficient.
  # @param template_name [String] Name of the template to be used. A cluster 
  #                               specific post-fix will automatically be added.
  # @return [VIM::VirtualMachine] The template as a VIM::VirtualMachine instance 
  #                               or nil
  def lookup_template template_name
    template_path = "#{template_name}-#{@computer.name}"
    template = @template_folder.traverse(template_path, RbVmomi::VIM::VirtualMachine)
    if template
      config = template.config
      is_template = config && config.template
      if !is_template
        template = nil
      end
    end
    template
  end
  
  # Creates a linked clone of a template prepared with upload_ovf_as_template.
  # The function waits for completion on the clone task. Optionally, in case
  # two level templates are being used, this function can wait for another 
  # thread to finish creating the second level template. See class comments
  # for the concept of multi level templates.
  # @param template_name [String] Name of the template to be used. A cluster 
  #                               specific post-fix will automatically be added.
  # @param vm_name [String] Name of the new VM that is being created via cloning.
  # @param config [Hash] VM Config delta to apply after the VM is cloned.
  #                      Allows the template to be customized, e.g. to adjust
  #                      CPU or Memory sizes or set annotations.
  # @option opts [int] :is_template If true, the clone is assumed to be a template
  #                                 again and collision and de-duping logic kicks
  #                                 in.
  # @return [VIM::VirtualMachine] The VIM::VirtualMachine instance of the clone
  def linked_clone template_vm, vm_name, config, opts = {}
    spec = {
      location: {
        pool: @rp, 
        datastore: @datastore,
        diskMoveType: :moveChildMostDiskBacking,
      }, 
      powerOn: false, 
      template: false,
      config: config,
    }
    if opts[:is_template]
      wait_for_template = false
      template_name = "#{vm_name}-#{@computer.name}"
      begin
        vm = template_vm.CloneVM_Task(
          folder: @template_folder, 
          name: template_name, 
          spec: spec
        ).wait_for_completion
      rescue RbVmomi::Fault => fault
        if fault.fault.is_a?(RbVmomi::VIM::DuplicateName)
          wait_for_template = true
        else
          raise
        end
      end
      
      if wait_for_template
        puts "#{Time.now}: Template already exists, waiting for it to be ready"
        vm = _wait_for_template_ready @template_folder, template_name
        puts "#{Time.now}: Template ready"
      end      
    else
      vm = template_vm.CloneVM_Task(
        folder: @vmfolder, 
        name: vm_name, 
        spec: spec
      ).wait_for_completion
    end
    vm
  end

  # Internal helper method that waits for a template to be fully created. It 
  # polls until it finds the VM in the inventory, and once it is there, waits
  # for it to be fully created and marked as a template. This function will
  # block for forever if the template never gets created or marked as a 
  # template.
  # @param vm_folder [VIM::Folder] Folder in which we expect the template to show up
  # @param vm_name [String] Name of the VM we are waiting for
  # @return [VIM::VirtualMachine] The VM we were waiting for when it is ready
  def _wait_for_template_ready vm_folder, vm_name
    vm = nil
    while !vm
      sleep 3
      # XXX: Optimize this
      vm = vm_folder.children.find{|x| x.name == vm_name}
    end
    log "Template VM found"
    sleep 2
    while true
      runtime, template = vm.collect 'runtime', 'config.template'
      ready = runtime && runtime.host && runtime.powerState == "poweredOff"
      ready = ready && template
      if ready
        break
      end
      sleep 5
    end
    
    vm
  end
end