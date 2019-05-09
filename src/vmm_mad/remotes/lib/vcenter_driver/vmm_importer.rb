module VCenterDriver

class VmmImporter < VCenterDriver::VcImporter
  def initialize(one_client, vi_client)
      super(one_client, vi_client)
      @one_class = OpenNebula::VirtualMachine
      @defaults = {}
  end

  def list(key, list)
      @list = {key => list}
  end

  def request_vnc(vc_vm)
      one_vm = vc_vm.one_item
      vnc_port  = one_vm["TEMPLATE/GRAPHICS/PORT"]
      elapsed_seconds = 0

      # Let's update the info to gather VNC port
      until vnc_port || elapsed_seconds > 30
          sleep(1)
          one_vm.info
          vnc_port  = one_vm["TEMPLATE/GRAPHICS/PORT"]
          elapsed_seconds += 1
      end

      if vnc_port
          extraconfig   = []
          extraconfig  += vc_vm.extraconfig_vnc
          spec_hash     = { :extraConfig  => extraconfig }
          spec = RbVmomi::VIM.VirtualMachineConfigSpec(spec_hash)
          vc_vm.item.ReconfigVM_Task(:spec => spec).wait_for_completion
      end
  end

  def build
      xml = OpenNebula::VirtualMachine.build_xml
      vm = OpenNebula::VirtualMachine.new(xml, @one_client)
  end

  def import(selected)
      vm_ref     = selected["DEPLOY_ID"] || selected[:wild]["DEPLOY_ID"]
      vm         = selected[:one_item]   || build
      template   = selected[:template]   || Base64.decode64(selected['IMPORT_TEMPLATE'])
      host_id    = selected[:host]       || @list.keys[0]

      vc_uuid    = @vi_client.vim.serviceContent.about.instanceUuid
      vc_name    = @vi_client.vim.host
      dpool, ipool, npool, hpool = create_pools

      vc_vm = VCenterDriver::VirtualMachine.new_without_id(@vi_client, vm_ref)
      vname = vc_vm['name']

      type = {:object => "VM", :id => vname}
      error, template_disks = vc_vm.import_vcenter_disks(vc_uuid, dpool, ipool, type)
      raise error if !error.empty?

      template << template_disks

      # Create images or get nics information for template
      error, template_nics, ar_ids = vc_vm
                                     .import_vcenter_nics(vc_uuid,
                                                          npool,
                                                          hpool,
                                                          vc_name,
                                                          vm_ref,
                                                          vc_vm)
      opts = {uuid: vc_uuid, npool: npool, error: error }
      Raction.delete_ars(ar_ids, opts) if !error.empty?

      template << template_nics
      template << "VCENTER_ESX_HOST = #{vc_vm["runtime.host.name"].to_s}\n"

      # Get DS_ID for the deployment, the wild VM needs a System DS
      dc_ref = vc_vm.get_dc.item._ref
      ds_ref = template.match(/^VCENTER_DS_REF *= *"(.*)" *$/)[1]

      ds_one = dpool.select do |e|
          e["TEMPLATE/TYPE"]                == "SYSTEM_DS" &&
          e["TEMPLATE/VCENTER_DS_REF"]      == ds_ref &&
          e["TEMPLATE/VCENTER_DC_REF"]      == dc_ref &&
          e["TEMPLATE/VCENTER_INSTANCE_ID"] == vc_uuid
      end.first
      opts[:error] = "ds with ref #{ds_ref} is not imported, aborting"
      Raction.delete_ars(ar_ids, opts) if !ds_one

      rc = vm.allocate(template)
      if OpenNebula.is_error?(rc)
          Raction.delete_ars(ar_ids, opts.merge({error: rc.message}))
      end

      rc = vm.deploy(host_id, false, ds_one.id)
      if OpenNebula.is_error?(rc)
          Raction.delete_ars(ar_ids, opts.merge({error: rc.message}))
      end

      # Set reference to template disks and nics in VM template
      vc_vm.one_item = vm

      request_vnc(vc_vm)

      return vm.id
  end
end # class VmmImporter

end # module VCenterDriver
