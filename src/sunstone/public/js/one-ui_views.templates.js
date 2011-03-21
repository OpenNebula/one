/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

var dashboard_tmpl =
'<table id="dashboard_table">\
  <tr>\
      <td>\
      <div class="panel">\
        <h3><a href="#hosts">Hosts</a>\
        <div class="new-resource">\
                <a class="create_host_button" href="#">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_hosts"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td key_td_green">Active</td>\
                    <td class="value_td"><span id="active_hosts"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td>\
      <div class="panel">\
        <h3><a href="#clusters">Clusters</a>\
            <div class="new-resource">\
                <a class="create_cluster_button" href="#">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_clusters"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3><a href="#virtualMachines">Virtual Machines</a>\
            <div class="new-resource">\
                <a class="create_vm_button" href="#">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_vms"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td key_td_green">Running</td>\
                    <td class="value_td"><span id="running_vms"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td key_td_red">Failed</td>\
                    <td class="value_td"><span id="failed_vms"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td>\
      <div class="panel">\
        <h3><a href="#virtualNetworks">Virtual Networks</a>\
            <div class="new-resource">\
                <a class="create_vn_button" href="#">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_vnets"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td">Public</td>\
                    <td class="value_td"><span id="public_vnets"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>\
            <a href="#images">Images</a>\
            <div class="new-resource">\
                <a class="create_image_button" href="#">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_images"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td">Public</td>\
                    <td class="value_td"><span id="public_images"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td class="oneadmin">\
      <div class="panel">\
       <h3><a href="#users">Users</a>\
       <div class="new-resource">\
                <a class="create_user_button" href="#">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_users"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>';






var hostlist_tmpl =
'<form id="form_hosts" action="javascript:alert(\'js errors?!\')">\
  <div class="action_blocks">\
	<div class="action_block">\
        <img src="/images/Refresh-icon.png" class="refresh_image" alt="OpenNebula.Host.list" />\
	</div>\
	<div class="action_block">\
		  <button class="create_host_button top_button new_button">+ New Host</button>\
	</div>\
    <div class="action_block">\
          <button class="action_button top_button" value="OpenNebula.Host.enable">Enable</button>\
          <button class="action_button top_button" value="OpenNebula.Host.disable">Disable</button>\
    </div>\
    <div class="action_block">\
		<button class="create_cluster_button top_button new_button">+ New Cluster</button>\
        <button class="confirm_with_select_button top_button new_button"  value="OpenNebula.Cluster.delete">Delete cluster</button>\
		<select class="multi_action_slct" id="cluster_actions_select">\
			<option class="confirm_with_select_button"  value="OpenNebula.Cluster.addhost">Add host to cluster</option>\
			<option class="action_button" value="OpenNebula.Cluster.removehost">Remove host from cluster</option>\
		</select>\
    </div>\
    <div class="action_block" style="border:none;">\
          <button class="action_button top_button" value="OpenNebula.Host.delete">Delete host</button>\
    </div>\
   </div>\
<table id="datatable_hosts" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>Name</th>\
      <th>Cluster</th>\
      <th>Running VMs</th>\
      <th>CPU Use</th>\
      <th>Memory use</th>\
      <th>Status</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyhosts">\
  </tbody>\
</table>\
</form>';

var create_host_tmpl =
'<div class="create_form"><form id="create_host_form" action="">\
  <fieldset>\
  <legend style="display:none;">Host parameters</legend>\
  <label for="name">Name: </label><input type="text" name="name" id="name" />\
  </fieldset>\
  <h3>Drivers</h3>\
  <fieldset>\
    <div class="manager clear" id="vmm_mads">\
	  <label>Virtualization Manager:</label>\
	  <select id="vmm_mad" name="vmm">\
	    <option value="vmm_kvm">KVM</option>\
		<option value="vmm_xen">XEN</option>\
		<option value="vmm_ec2">EC2</option>\
		<option value="vmm_dummy">Dummy</option>\
	  </select>\
    </div>\
    <div class="manager clear" id="im_mads">\
      <label>Information Manager:</label>\
      <select id="im_mad" name="im">\
	    <option value="im_kvm">KVM</option>\
		<option value="im_xen">XEN</option>\
		<option value="im_ec2">EC2</option>\
		<option value="im_dummy">Dummy</option>\
	  </select>\
    </div>\
    <div class="manager clear" id="tm_mads">\
      <label>Transfer Manager:</label>\
       <select id="tm_mad" name="tm">\
	    <option value="tm_nfs">NFS</option>\
		<option value="tm_ssh">SSH</option>\
		<option value="tm_dummy">Dummy</option>\
	  </select>\
    </div>\
    </fieldset>\
    <fieldset>\
    <div class="form_buttons">\
		<div><button class="button" id="create_host_submit" value="OpenNebula.Host.create">Create</button>\
		<button class="button" type="reset" value="reset">Reset</button></div>\
	</div>\
  </fieldset>\
</form></div>';

//~ var clusterlist_tmpl =
//~ '<form id="form_clusters" action="javascript:alert(\'js error!\');">\
  //~ <div class="action_blocks">\
		//~ <div class="action_block">\
		   //~ <img src="/images/Refresh-icon.png" class="refresh_image" alt="OpenNebula.Cluster.list" />\
		//~ </div>\
		//~ <div class="action_block">\
			//~ <button class="create_cluster_button top_button">+ New</button>\
		//~ </div>\
        //~ <div class="action_block">\
          //~ <button class="action_button top_button" value="OpenNebula.Cluster.delete">Delete</button>\
        //~ </div>\
  //~ </div>\
//~ <table id="datatable_clusters" class="display">\
  //~ <thead>\
    //~ <tr>\
      //~ <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      //~ <th>ID</th>\
      //~ <th>Name</th>\
    //~ </tr>\
  //~ </thead>\
  //~ <tbody id="tbodyclusters">\
  //~ </tbody>\
//~ </table>\
//~ </form>';

var create_cluster_tmpl =
'<form id="create_cluster_form" action="">\
  <fieldset style="border:none;">\
	<div>\
		<label for="name">Cluster name:</label>\
		<input type="text" name="name" id="name" /><br />\
	</div>\
  </fieldset>\
  <fieldset>\
	<div class="form_buttons">\
		<button class="button" id="create_cluster_submit" value="cluster/create">Create</button>\
		<button class="button" type="reset" value="reset">Reset</button>\
	</div>\
  </fieldset>\
</form>';

var vmachinelist_tmpl =
'<form id="virtualMachine_list" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
	<div class="action_block">\
		<img src="/images/Refresh-icon.png" class="refresh_image" alt="OpenNebula.VM.list" />\
	</div>\
	<div class="action_block">\
		  <button class="create_vm_button top_button new_button" value="">+ New</button>\
		</div>\
        <div class="action_block">\
          <button class="confirm_button top_button" value="OpenNebula.VM.shutdown">Shutdown</button>\
        </div>\
        <div class="action_block">\
          <select id="vm_opt_actions" class="multi_action_slct" name="vm_opt_actions">\
            <option class="confirm_with_select_button" value="OpenNebula.VM.deploy">Deploy</option>\
			<option class="confirm_with_select_button" value="OpenNebula.VM.migrate">Migrate</option>\
            <option class="confirm_with_select_button" value="OpenNebula.VM.livemigrate">Live Migrate</option>\
            <option class="confirm_button" value="OpenNebula.VM.hold">Hold</option>\
            <option class="confirm_button" value="OpenNebula.VM.release">Release</option>\
            <option class="confirm_button" value="OpenNebula.VM.suspend">Suspend</option>\
            <option class="confirm_button" value="OpenNebula.VM.resume">Resume</option>\
            <option class="confirm_button" value="OpenNebula.VM.stop">Stop</option>\
            <option class="confirm_button" value="OpenNebula.VM.restart">Restart</option>\
            <option class="confirm_button" value="OpenNebula.VM.cancel">Cancel</option>\
          </select>\
        </div>\
        <div class="action_block" style="border:none;">\
          <button class="confirm_button  top_button" value="OpenNebula.VM.delete">Delete</button>\
        </div>\
  </div>\
<table id="datatable_vmachines" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>User</th>\
      <th>Name</th>\
      <th>Status</th>\
      <th>CPU</th>\
      <th>Memory</th>\
      <th>Hostname</th>\
      <th>Start Time</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvmachines">\
  </tbody>\
</table>\
</form>';

var create_vm_tmpl =
'<div id="vm_create_tabs">\
	<ul>\
		<li><a href="#easy">Wizard KVM</a></li>\
		<li><a href="#easy">Wizard XEN</a></li>\
		<li><a href="#manual">VMWare</a></li>\
		<li><a href="#manual">Advanced mode</a></li>\
	</ul>\
	<div id="easy">\
		<form>\
			<div id="template_type" style="margin-bottom:1em;">\
				<!--\
				<div class="clear"></div>\
				<label for="template_type">Select VM type:</label>\
				<input type="radio" id="kvm" name="template_type" value="kvm">KVM</input>\
				<input type="radio" id="xen" name="template_type" value="xen">XEN</input>\
				<div class="clear"></div>\
				-->\
				<p style="font-size:0.8em;text-align:right;"><i>Fields marked with <span style="display:inline-block;" class="ui-icon ui-icon-alert" /> are mandatory</i><br />\
				<a href="#" id="fold_unfold_vm_params"><u>Fold / Unfold all sections</u></a></p>\
			</div>\
\
			  <!-- capacity section name, memory, cpu vcpu -->\
			  <div class="vm_section" id="capacity">\
			    <div class="show_hide" id="add_capacity_cb">\
				  <h3>Capacity options</h3>\
			    </div>\
			  <fieldset><legend>Capacity</legend>\
				<div class="vm_param kvm_opt xen_opt">\
				  <label for="NAME">Name:</label>\
				  <input type="text" id="NAME" name="name"/>\
				  <div class="tip">	Name that the VM will get for description purposes. If NAME is not supplied a name generated by one will be in the form of one-&lt;VID&gt;.</div>\
				</div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="MEMORY">Memory:</label>\
				  <input type="text" id="MEMORY" name="memory" size="4" />\
				  <div class="tip">Amount of RAM required for the VM, in Megabytes.</div>\
			    </div>\
     		    <div class="vm_param kvm_opt xen_opt">\
				<label for="CPU">CPU:</label>\
				  <input type="text" id="CPU" name="cpu" size="2"/>\
				  <div class="tip">Percentage of CPU divided by 100 required for the Virtual Machine. Half a processor is written 0.5.</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="VCPU">VCPU:</label>\
				  <input type="text" id="VCPU" name="vcpu" size="3" />\
				  <div class="tip">Number of virtual cpus. This value is optional, the default hypervisor behavior is used, usually one virtual CPU.</div>\
			    </div>\
			  </fieldset>\
			  </div>\
			  <!-- OS and Boot options\
				arch, kernel, initrd, root, kernel_cmd, bootloader, boot\
			  -->\
			<div class="vm_section" id="os_boot_opts">\
			    <div class="show_hide" id="add_os_boot_opts_cb">\
			    <h3>Boot/OS options <a id="add_os_boot_opts" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h3>\
			    </div>\
			  <fieldset><legend>OS and Boot options</legend>\
				<div class="vm_param kvm">\
				  <label for="ARCH">Architecture:</label>\
				  <select id="ARCH" name="arch">\
					<option value="i686">i686</option>\
					<option value="x86_64">x86_64</option>\
				  </select>\
				  <div class="tip">CPU architecture to virtualization</div>\
				</div>\
				<!--xen necesita kernel o bootloader.\
				Opciones de kernel son obligatorias si se activa kernel-->\
				<div class="" id="kernel_bootloader">\
				  <label>Boot method:</label>\
				  <select id="boot_method" name="boot_method">\
				    <option id="no_boot" name="no_boot" value=""></option>\
					<option value="kernel">Kernel</option>\
					<option value="bootloader">Bootloader</option>\
				  </select>\
				  <div class="tip">Select boot method</div>\
				</div>\
			    <div class="vm_param kvm_opt xen kernel">\
				  <label for="KERNEL">Kernel:</label>\
				  <input type="text" id="KERNEL" name="kernel" />\
				  <div class="tip">Path to the OS kernel to boot the image</div>\
				</div>\
     		    <div class="vm_param kvm xen kernel">\
				  <label for="INITRD">Initrd:</label>\
				  <input type="text" id="INITRD" name="initrd"/>\
				  <div class="tip">Path to the initrd image</div>\
			    </div>\
			    <div class="vm_param kvm xen kernel">\
				  <label for="ROOT">Root:</label>\
				  <input type="text" id="ROOT" name="root"/>\
				  <div class="tip">Device to be mounted as root</div>\
			    </div>\
				<div class="vm_param kvm xen kernel">\
				  <label for="KERNEL_CMD">Kernel commands:</label>\
				  <input type="text" id="KERNEL_CMD" name="kernel_cmd" />\
				  <div class="tip">Arguments for the booting kernel</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen bootloader">\
				  <label for="BOOTLOADER">Bootloader:</label>\
				  <input type="text" id="BOOTLOADER" name="bootloader" />\
				  <div class="tip">Path to the bootloader executable</div>\
			    </div>\
			    <div class="vm_param kvm">\
				  <label for="BOOT">Boot:</label>\
				  <select id="BOOT" name="boot">\
					<option value="hd">hd</option>\
					<option value="hd">fd</option>\
					<option value="hd">cdrom</option>\
					<option value="hd">network</option>\
				  </select>\
				  <div class="tip">Boot device type</div>\
			    </div>\
			    </fieldset>\
			  </div>\
\
\
			  <!--disks section using image or declaring\
			  image, image ID, bus, target, driver\
			  type, source, size, format, clone, save,\
			  readonly  SEVERAL DISKS-->\
			  <div class="vm_section" id="disks">\
				  <div class="show_hide" id="add_disks_cb">\
				  <h3>Add disks/images <a id="add_disks" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h3>\
			     </div>\
			   <fieldset><legend>Disks</legend>\
			     <div class="" id="image_vs_disk">\
				  <label>Add disk/image</label>\
				  <input type="radio" id="add_disk" name="image_vs_disk" value="disk">Disk</input>\
				  <!--<label for="add_disk">Add a disk</label>-->\
				  <input type="radio" id="add_image" name="image_vs_disk" value="image">Image</input>\
				  <!--<label for="add_image">Add an image</label>-->\
			     </div>\
			    <div class="clear"></div>\
			    <div class="vm_param kvm xen add_image">\
				  <label for="IMAGE">Image:</label>\
				  <select type="text" id="IMAGE" name="image">\
				  </select>\
				  <div class="tip">Name of the image to use</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="BUS">Bus:</label>\
				  <select id="BUS" name="bus">\
					<option value="ide">IDE</option>\
					<option value="scsi">SCSI</option>\
				  </select>\
				  <div class="tip">Type of disk device to emulate: ide, scsi</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="TARGET">Target:</label>\
				  <input type="text" id="TARGET" name="target" />\
				  <div class="tip">	Device to map image disk. If set, it will overwrite the default device mapping</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="DRIVER">Driver:</label>\
				  <input type="text" id="DRIVER" name="driver" />\
				  <div class="tip">Specific image mapping driver. KVM: raw, qcow2. Xen:tap:aio:, file:. VMware unsupported</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt add_disk">\
				  <label for="TYPE">Type:</label>\
				  <select id="TYPE" name="type">\
					<option value="disk">Disk</option>\
					<option value="floppy">Floppy</option>\
					<option value="cdrom">CD-ROM</option>\
					<option value="swap">Swap</option>\
					<option value="fs">FS</option>\
					<option value="block">Block</option>\
				  </select>\
				  <div class="tip">Disk type</div>\
			    </div>\
			    <div class="vm_param kvm xen add_disk">\
				  <label for="SOURCE">Source:</label>\
				  <input type="text" id="SOURCE" name="source" />\
				  <div class="tip">Disk file location path or URL</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt add_disk ">\
			    <!--Mandatory for swap, fs and block images-->\
				  <label for="SIZE">Size:</label>\
				  <input type="text" id="SIZE" name="size" />\
				  <div class="tip">Disk file location path or URL. Mandatory for swap, fs and block images</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt add_disk ">\
			    <!--mandatory for fs images-->\
				  <label for="FORMAT">Format:</label>\
				  <input type="text" id="FORMAT" name="format" />\
				  <div class="tip">Filesystem type for the fs images</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt add_disk">\
				  <label for="CLONE">Clone:</label>\
				  <select id="CLONE" name="clone">\
					<option value="yes">Yes</option>\
					<option value="no">No</option>\
				  </select>\
				  <div class="tip">Clone this image</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt add_disk">\
				  <label for="SAVE">Save:</label>\
				   <select id="SAVE" name="save">\
				    <option value="no">No</option>\
					<option value="yes">Yes</option>\
				  </select>\
				  <div class="tip">Save this image after shutting down the VM</div>\
			    </div>\
				<div class="vm_param kvm_opt xen_opt add_disk">\
				  <label for="READONLY">Read only:</label>\
				  <select id="READONLY" name="readonly">\
				    <option value="no">No</option>\
					<option value="yes">Yes</option>\
				  </select>\
				  <div class="tip">Mount image as read-only</div>\
			    </div>\
			    <div class="">\
					<button class="add_remove_button add_button" id="add_disk_button" value="add_disk">Add</button>\
					<button class="add_remove_button" id="remove_disk_button" value="remove_disk">Remove selected</button>\
					<div class="clear"></div>\
					<label style="" for="disks_box">Current disks:</label>\
					<select id="disks_box" name="disks_box" style="width:150px;height:100px;" multiple>\
					</select>\
					<div class="clear"></div>\
					</div>\
			  </fieldset>\
			  </div>\
\
			  <!-- network section  network, network id,, ip, mac,\
			  bridge, target,  script, model -->\
			  <div class="vm_section" id="networks">\
			    <div class="show_hide" id="add_networks_cb">\
			      <h3>Setup Networks <a id="add_networks" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h3>\
			    </div>\
			  <fieldset><legend>Network</legend>\
			    <div class="" id="network_vs_niccfg">\
				  <label>Add network</label>\
				  <input type="radio" id="add_network" name="network_vs_niccfg" value="network">Predefined</input>\
				  <!--<label style="width:200px;" for="add_network">Pre-defined network</label>-->\
				  <input type="radio" id="add_niccfg" name="network_vs_niccfg" value="niccfg">Manual</input>\
				  <!--<label for="add_niccfg">Manual network</label>-->\
				  <!--<div class="tip"></div>-->\
			    </div>\
			    <div class="clear"></div>\
				<div class="vm_param kvm_opt xen_opt network">\
				  <label for="NETWORK">Network:</label>\
				  <select type="text" id="NETWORK" name="network">\
				  </select>\
				  <div class="tip">Name of the network to attach this device</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt niccfg">\
				  <label for="IP">IP:</label>\
				  <input type="text" id="IP" name="ip" />\
				  <div class="tip">Request an specific IP from the Network</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt niccfg">\
				  <label for="MAC">MAC:</label>\
				  <input type="text" id="MAC" name="mac" />\
				  <div class="tip">HW address associated with the network interface</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt niccfg">\
				  <label for="BRIDGE">Bridge</label>\
				  <input type="text" id="BRIDGE" name="bridge" />\
				  <div class="tip">	Name of the bridge the network device is going to be attached to</div>\
			    </div>\
			    <div class="vm_param kvm_opt niccfg">\
				  <label for="TARGET">Target:</label>\
				  <input type="text" id="TARGET" name="nic_target" />\
				  <div class="tip">Name for the tun device created for the VM</div>\
			    </div>\
			    <div class="vm_param kvm_opt niccfg">\
				  <label for="SCRIPT">Script:</label>\
				  <input type="text" id="SCRIPT" name="script" />\
				  <div class="tip">Name of a shell script to be executed after creating the tun device for the VM</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt niccfg">\
				  <label for="MODEL">Model:</label>\
				  <input type="text" id="MODEL" name="model" />\
				  <div class="tip">Hardware that will emulate this network interface. With Xen this is the type attribute of the vif.</div>\
			    </div>\
			    <div class="">\
			        <button class="add_remove_button add_button" id="add_nic_button" value="add_nic">Add</button>\
				    <button class="add_remove_button" id="remove_nic_button" value="remove_nic">Remove selected</button>\
				    <div class="clear"></div>\
					<label for="nics_box">Current NICs:</label>\
					<select id="nics_box" name="nics_box" style="width:150px;height:100px;" multiple>\
					</select>\
					 </div>\
			  </fieldset>\
			  </div>\
\
\
			  <!--Input several type, bus-->\
			  <div class="vm_section" id="inputs">\
			  	<div class="show_hide" id="add_inputs_cb">\
			  	  <h3>Add inputs <a id="add_inputs" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h3>\
			    </div>\
			  <fieldset><legend>Inputs</legend>\
			  	<div class="vm_param kvm_opt">\
				  <label for="TYPE">Type:</label>\
				  <select id="TYPE" name="input_type">\
					<option value="mouse">Mouse</option>\
					<option value="tablet">Tablet</option>\
				  </select>\
				  <div class="tip"></div>\
			    </div>\
			    <div class="vm_param kvm_opt">\
				   <label for="BUS">Bus:</label>\
				  <select id="BUS" name="input_bus">\
					<option value="usb">USB</option>\
					<option value="ps2">PS2</option>\
					<option value="xen">XEN</option>\
				  </select>\
				  <div class="tip"></div>\
			    </div>\
			    <div class="">\
					<button class="add_remove_button add_button" id="add_input_button" value="add_input" class="kvm_opt">Add</button>\
					<button class="add_remove_button" id="remove_input_button" value="remove_input" class="kvm_opt">Remove selected</button>\
					<div class="clear"></div>\
					<label for="inputs_box">Current inputs:</label>\
					<select id="inputs_box" name="inputs_box" style="width:150px;height:100px;" multiple>\
					</select>\
					</div>\
			  </fieldset>\
			  </div>\
\
\
			  <!--graphics type, listen, port, passwd, keymap -->\
			  <div class="vm_section" id="graphics">\
			  	<div class="show_hide" id="add_graphics_cb">\
			  	  <h3>Add Graphics <a id="add_graphics" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h3>\
			    </div>\
			  <fieldset><legend>Graphics</legend>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="TYPE">Graphics type:</label>\
				  <select id="TYPE" name="">\
                    <option value="">Please select</option>\
					<option id="vnc" value="vnc">VNC</option>\
					<option value="sdl">SDL</option>\
				  </select>\
				  <div class="tip"></div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="LISTEN">Listen IP:</label>\
				  <input type="text" id="LISTEN" name="graphics_ip" />\
				  <div class="tip">IP to listen on</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="PORT">Port:</label>\
				  <input type="text" id="PORT" name="port" />\
				  <div class="tip">Port for the VNC server</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="PASSWD">Password:</label>\
				  <input type="text" id="PASSWD" name="graphics_pw" />\
				  <div class="tip">Password for the VNC server</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="KEYMAP">Keymap</label>\
				  <input type="text" id="KEYMAP" name="keymap" />\
				  <div class="tip">Keyboard configuration locale to use in the VNC display</div>\
			    </div>\
			  </fieldset>\
			  </div>\
\
\
			  <!--context textarea? -->\
			  <div class="vm_section" id="context">\
			  	<div class="show_hide" id="add_context_cb">\
			  	  <h3>Add context variables <a id="add_context" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h3>\
			    </div>\
			  <fieldset><legend>Context</legend>\
              <div class="vm_param kvm_opt xen_opt">\
				  <label for="var_name">Name:</label>\
				  <input type="text" id="var_name" name="var_name" />\
				  <div class="tip">Name for the context variable</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="var_value">Value:</label>\
				  <input type="text" id="var_value" name="var_value" />\
				  <div class="tip">Value of the context variable</div>\
              </div>\
                <div class="">\
					<button class="add_remove_button add_button" id="add_context_button" value="add_context">Add</button>\
					<button class="add_remove_button" id="remove_context_button" value="remove_input">Remove selected</button>\
					<div class="clear"></div>\
					<label for="context_box">Current variables:</label>\
					<select id="context_box" name="context_box" style="width:150px;height:100px;" multiple>\
					</select>\
                </div>\
			  </fieldset>\
			  </div>\
\
\
			  <!--placement requirements rank -->\
			  <div class="vm_section" id="placement">\
			   <div class="show_hide" id="add_placement_cb">\
			      <h3>Add placement options <a id="add_placement" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h3>\
			   </div>\
			  <fieldset><legend>Placement</legend>\
	     	    <div class="vm_param kvm_opt xen_opt">\
				  <label for="REQUIREMENTS">Requirements:</label>\
				  <input type="text" id="REQUIREMENTS" name="requirements" />\
				  <div class="tip">Boolean expression that rules out provisioning hosts from list of machines suitable to run this VM</div>\
			    </div>\
			    <div class="vm_param kvm_opt xen_opt">\
				  <label for="RANK">Rank:</label>\
				  <input type="text" id="RANK" name="rank" />\
				  <div class="tip">	This field sets which attribute will be used to sort the suitable hosts for this VM. Basically, it defines which hosts are more suitable than others</div>\
			    </div>\
			  </fieldset>\
			  </div>\
\
\
			  <!--raw type=> set to current, data -->\
			  <div class="vm_section" id="raw">\
			  	<div class="show_hide" id="add_raw_cb">\
			  	<h3>Add Hypervisor raw options <a id="add_raw" class="icon_left" href="#"><span class="ui-icon ui-icon-plus" /></a></h3>\
			    </div>\
			  <fieldset><legend>Raw</legend>\
			  <!--set TYPE to current xen/kvm -->\
			  	<div class="vm_param kvm_opt xen_opt">\
				  <label for="DATA">Data:</label>\
				  <input type="hidden" id="TYPE" name="type" />\
				  <input type="text" id="DATA" name="data" />\
				  <div class="tip">	Raw data to be passed directly to the hypervisor</div>\
			    </div>\
			  </fieldset>\
			  </div>\
\
\
			  <!-- submit -->\
			 <fieldset>\
			  <div class="form_buttons">\
				<button class="button" id="create_vm_form_easy" value="OpenNebula.VM.create">\
				Create\
				</button>\
				<button class="button" id="reset" type="reset" value="reset">Reset</button>\
			  </div>\
			</fieldset>\
		</form>\
	</div><!--easy mode -->\
	<div id="manual">\
		<form>\
		<h3 style="margin-bottom:10px;">Write the Virtual Machine template here</h3>\
		  <fieldset style="border-top:none;">\
			<textarea id="textarea_vm_template" style="width:100%; height:15em;"></textarea>\
			<div class="clear"></div>\
		  </fieldset>\
		  <fieldset>\
			<div class="form_buttons">\
			  <button class="button" id="create_vm_form_manual" value="OpenNebula.VM.create">\
			  Create\
			  </button>\
			<button class="button" type="reset" value="reset">Reset</button>\
			</div>\
		  </fieldset>\
		</form>\
	</div>\
</div>';


var vnetworklist_tmpl =
'<form id="virtualNetworks_form" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
     <div class="action_block">\
        <img src="/images/Refresh-icon.png" class="refresh_image" alt="OpenNebula.Network.list" />\
     </div>\
     <div class="action_block">\
		  <button class="create_vn_button top_button new_button" value="OpenNebula.Network.create">\
		  + New</button>\
	</div>\
	<div class="action_block">\
          <button class="action_button top_button" value="OpenNebula.Network.publish">Publish</button>\
          <button class="action_button top_button" value="OpenNebula.Network.unpublish">Unpublish</button>\
    </div>\
    <div class="action_block" style="border:none;">\
          <button class="action_button top_button" value="OpenNebula.Network.delete">Delete</button>\
    </div>\
  </div>\
<table id="datatable_vnetworks" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>User</th>\
      <th>Name</th>\
      <th>Type</th>\
      <th>Bridge</th>\
      <th>Public?</th>\
      <th>Total Leases</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyvnetworks">\
  </tbody>\
</table>\
</form>';

var create_vn_tmpl =
'<div id="vn_tabs">\
	<ul>\
		<li><a href="#easy">Wizard</a></li>\
		<li><a href="#manual">Advanced mode</a></li>\
	</ul>\
	<div id="easy">\
		<form id="create_vn_form_easy" action="">\
			<fieldset>\
				<label for="name">Name:</label>\
				<input type="text" name="name" id="name" /><br />\
			</fieldset>\
			<fieldset>\
				<label for="bridge">Bridge:</label>\
				<input type="text" name="bridge" id="bridge" /><br />\
			</fieldset>\
			<fieldset>\
				<label style="height:2em;">Network type:</label>\
				<input type="radio" name="fixed_ranged" id="fixed_check" value="fixed" checked="checked">Fixed network</input><br />\
				<input type="radio" name="fixed_ranged" id="ranged_check" value="ranged">Ranged network</input><br />\
			</fieldset>\
			<div class="clear"></div>\
			<div id="easy_tabs">\
					<div id="fixed">\
					<fieldset>\
						<label for="leaseip">Lease IP:</label>\
						<input type="text" name="leaseip" id="leaseip" /><br />\
						<label for="leasemac">Lease MAC (opt):</label>\
						<input type="text" name="leasemac" id="leasemac" />\
						<div class="clear"></div>\
						<button class="add_remove_button add_button" id="add_lease" value="add/lease">\
						Add\
						</button>\
						<button class="add_remove_button" id="remove_lease" value="remove/lease">\
						Remove selected\
						</button>\
						<label for="leases">Current leases:</label>\
						<select id="leases" name="leases" size="10" style="width:150px" multiple>\
						<!-- insert leases -->\
						</select><br />\
					</fieldset>\
					</div>\
					<div id="ranged">\
					<fieldset>\
						<label for="net_address">Network Address:</label>\
						<input type="text" name="net_address" id="net_address" /><br />\
						<label for="net_size">Network size:</label>\
						<input type="text" name="net_size" id="net_size" />\
					</fieldset>\
					</div>\
				</div>\
			<div class="clear"></div>\
			</fieldset>\
			<fieldset>\
			<div class="form_buttons">\
					<button class="button" id="create_vn_submit_easy" value="vn/create">\
					Create\
					</button>\
					<button class="button" type="reset" value="reset">Reset</button>\
				</div>\
			</fieldset>\
		</form>\
	</div>\
	<div id="manual">\
		<form id="create_vn_form_manual" action="">\
		  <h3 style="margin-bottom:10px;">Write the Virtual Network template here</h3>\
		  <fieldset style="border-top:none;">\
		    <textarea id="template" rows="15" style="width:100%;"></textarea>\
	     	<div class="clear"></div>\
	     </fieldset>\
	     <fieldset>\
	     	<div class="form_buttons">\
	    	<button class="button" id="create_vn_submit_manual" value="vn/create">\
		    Create\
		    </button>\
		    <button class="button" type="reset" value="reset">Reset</button>\
		    </div>\
		  </fieldset>\
		</form>\
	</div>\
</div>';

var userlist_tmpl =
'<form id="user_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
    <div class="action_block">\
       <img src="/images/Refresh-icon.png" class="refresh_image" alt="OpenNebula.User.list" />\
    </div>\
    <div class="action_block">\
		<button class="create_user_button top_button new_button">+ New</button>\
	</div>\
    <div class="action_block" style="border:none;">\
        <button class="action_button top_button" value="OpenNebula.User.delete">Delete</button>\
    </div>\
  </div>\
<table id="datatable_users" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>Name</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyusers">\
  </tbody>\
</table>\
</form>';

var create_user_tmpl =
'<form id="create_user_form" action="">\
  <fieldset>\
	<div>\
		<label for="username">Username:</label>\
		<input type="text" name="username" id="username" /><br />\
		<label for="pass">Password:</label>\
		<input type="password" name="pass" id="pass" />\
	</div>\
	</fieldset>\
	<fieldset>\
	<div class="form_buttons">\
		<button class="button" id="create_user_submit" value="user/create">Create</button>\
		<button class="button" type="reset" value="reset">Reset</button>\
	</div>\
</fieldset>\
</form>';


var imagelist_tmpl =
'<form id="image_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
    <div class="action_block">\
       <img src="/images/Refresh-icon.png" class="refresh_image" alt="OpenNebula.Image.list" />\
    </div>\
    <div class="action_block">\
		<button class="create_image_button top_button new_button">+ New</button>\
	</div>\
    <div class="action_block">\
        <button class="image_attribute_button top_button" value="OpenNebula.Image.addattr">Add attribute</button>\
        <button class="image_attribute_button top_button" value="OpenNebula.Image.update">Update attribute</button>\
        <button class="image_attribute_button top_button" value="OpenNebula.Image.rmattr">Remove attribute</button>\
    </div>\
    <div class="action_block">\
		<select id="image_actions_select" class="multi_action_slct" name="image_actions_select">\
			<option class="action_button" value="OpenNebula.Image.enable">Enable</option>\
			<option class="action_button" value="OpenNebula.Image.disable">Disable</option>\
			<option class="action_button" value="OpenNebula.Image.publish">Publish</option>\
			<option class="action_button" value="OpenNebula.Image.unpublish">Unpublish</option>\
			<option class="action_button" value="OpenNebula.Image.persistent">Make persistent</option>\
			<option class="action_button" value="OpenNebula.Image.nonpersistent">Make non persistent</option>\
		</select>\
    </div>\
    <div class="action_block" style="border:none;">\
        <button class="action_button top_button" value="OpenNebula.Image.delete">Delete</button>\
    </div>\
  </div>\
<table id="datatable_images" class="display">\
  <thead>\
    <tr>\
      <th class="check"><input type="checkbox" class="check_all" value="">All</input></th>\
      <th>ID</th>\
      <th>User</th>\
      <th>Name</th>\
      <th>Type</th>\
      <th>Registration time</th>\
      <th>Public</th>\
      <th>Persistent</th>\
      <th>State</th>\
      <th>#VMS</th>\
    </tr>\
  </thead>\
  <tbody id="tbodyimages">\
  </tbody>\
</table>\
</form>';

var create_image_tmpl =
'<div id="img_tabs">\
	<ul><li><a href="#img_easy">Wizard</a></li>\
		<li><a href="#img_manual">Advanced mode</a></li>\
	</ul>\
	<div id="img_easy">\
		<form id="create_image_form_easy" action="">\
			<p style="font-size:0.8em;text-align:right;"><i>Fields marked with <span style="display:inline-block;" class="ui-icon ui-icon-alert" /> are mandatory</i><br />\
			<fieldset>\
					<div class="img_param img_man">\
						<label for="img_name">Name:</label>\
						<input type="text" name="img_name" id="img_name" />\
						<div class="tip">Name that the Image will get. Every image must have a unique name.</div>\
					</div>\
					<div class="img_param">\
						<label for="img_desc">Description:</label>\
						<input type="text" name="img_desc" id="img_desc" />\
						<div class="tip">Human readable description of the image for other users.</div>\
					</div>\
			</fieldset>\
			<fieldset>\
					<div class="img_param">\
						<label for="img_type">Type:</label>\
						<select name="img_type" id="img_type">\
							<option value="OS">OS</option>\
							<option value="CDROM">CD-ROM</option>\
							<option value="DATABLOCK">Datablock</option>\
						</select>\
						<div class="tip">Type of the image, explained in detail in the following section. If omitted, the default value is the one defined in oned.conf (install default is OS).</div>\
					</div>\
					<div class="img_param">\
						<label for="img_public">Public:</label>\
						<input type="checkbox" id="img_public" name="img_public" value="YES" />\
						<div class="tip">Public scope of the image</div>\
					</div>\
					<div class="img_param">\
						<label for="img_persistent">Persistent:</label>\
						<input type="checkbox" id="img_persistent" name="img_persistent" value="YES" />\
						<div class="tip">Persistence of the image</div>\
					</div>\
					<div class="img_param">\
						<label for="img_dev_prefix">Device prefix:</label>\
						<input type="text" name="img_dev_prefix" id="img_dev_prefix" />\
						<div class="tip">Prefix for the emulated device this image will be mounted at. For instance, “hd”, “sd”. If omitted, the default value is the one defined in oned.conf (installation default is “hd”).</div>\
					</div>\
					<div class="img_param">\
						<label for="img_bus">Bus:</label>\
						<select name="img_bus" id="img_bus">\
							<option value="IDE">IDE</option>\
							<option value="SCSI">SCSI</option>\
							<option value="virtio">Virtio (KVM)</option>\
						</select>\
						<div class="tip">Type of disk device to emulate.</div>\
					</div>\
			</fieldset>\
			<fieldset>\
					<div class="" id="src_path_select">\
						<label style="height:3em;">Path vs. source:</label>\
						<input type="radio" name="src_path" id="path_img" value="path" />\
                        <label style="float:none">Provide a path</label><br />\
						<input type="radio" name="src_path" id="source_img" value="source" />\
                        <label style="float:none">Provide a source</label><br />\
						<input type="radio" name="src_path" id="datablock_img" value="datablock" />\
                        <label style="float:none;vertical-align:top">Create an empty datablock</label>\
						<div class="tip">Please choose path if you have a file-based image. Choose source otherwise or create an empty datablock disk.</div><br />\
					</div>\
					<div class="img_param">\
						<label for="img_path">Path:</label>\
						<input type="text" name="img_path" id="img_path" />\
						<div class="tip">Path to the original file that will be copied to the image repository. If not specified for a DATABLOCK type image, an empty image will be created.</div>\
					</div>\
					<div class="img_param">\
						<label for="img_source">Source:</label>\
						<input type="text" name="img_source" id="img_source" />\
						<div class="tip">Source to be used in the DISK attribute. Useful for not file-based images.</div>\
					</div>\
					<div class="img_size">\
						<label for="img_size">Size:</label>\
						<input type="text" name="img_size" id="img_size" />\
						<div class="tip">Size of the datablock in MB.</div>\
					</div>\
					<div class="img_param">\
						<label for="img_fstype">FS type:</label>\
						<input type="text" name="img_fstype" id="img_fstype" />\
						<div class="tip">Type of file system to be built. This can be any value understood by mkfs unix command.</div>\
					</div>\
			</fieldset>\
			<fieldset>\
				<div class="form_buttons">\
					<button class="button" id="create_image_submit" value="user/create">Create</button>\
					<button class="button" type="reset" value="reset">Reset</button>\
				</div>\
			</fieldset>\
		</form>\
	</div>\
	<div id="img_manual">\
		<form id="create_image_form_manual" action="">\
		  <fieldset style="border-top:none;">\
			<h3 style="margin-bottom:10px;">Write the image template here</h3>\
		    <textarea id="template" rows="15" style="width:100%;">\
	     	</textarea>\
	     </fieldset>\
	     <fieldset>\
	     <div class="form_buttons">\
	    	<button class="button" id="create_vn_submit_manual" value="vn/create">\
		    Create\
		    </button>\
		    <button class="button" type="reset" value="reset">Reset</button>\
		   </div>\
		  </fieldset>\
		 </form>\
	</div>\
</div>';
