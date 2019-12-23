/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
/*--------------------------------------------------------------------------- */

package goca

import (
	"encoding/xml"
	"errors"
	"fmt"

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
)

// VMsController is a controller for a pool of VMs
type VMsController entitiesController

// VMController is a controller for VM entities
type VMController entityController

// VMDiskController is a controller for VM entities
type VMDiskController subEntityController

// VMs returns a new vm pool controller.
func (c *Controller) VMs() *VMsController {
	return &VMsController{c}
}

// VM returns a new vm controller.
func (c *Controller) VM(id int) *VMController {
	return &VMController{c, id}
}

// Disk returns a new vm disk controller.
func (vc *VMController) Disk(id int) *VMDiskController {
	return &VMDiskController{vc.c, vc.ID, id}
}

// ByName returns VM ID from name
func (c *VMsController) ByName(name string, args ...int) (int, error) {
	var id int

	vmPool, err := c.Info(args...)
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(vmPool.VMs); i++ {
		if vmPool.VMs[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = vmPool.VMs[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, err
}

// Info returns a new VM pool. It accepts the scope of the query.
func (vc *VMsController) Info(args ...int) (*vm.Pool, error) {

	fArgs, err := handleVMArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := vc.c.Client.Call("one.vmpool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	vmPool := &vm.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), vmPool)
	if err != nil {
		return nil, err
	}

	return vmPool, nil
}

// InfoExtended connects to OpenNebula and fetches the whole VM_POOL information
func (vc *VMsController) InfoExtended(args ...int) (*vm.Pool, error) {

	fArgs, err := handleVMArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := vc.c.Client.Call("one.vmpool.infoextended", fArgs...)
	if err != nil {
		return nil, err
	}
	vmPool := &vm.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), vmPool)
	if err != nil {
		return nil, err
	}
	return vmPool, nil
}

// InfoFilter returns a new VM pool. It accepts the scope of the query.
func (vc *VMsController) InfoFilter(f *VMFilter) (*vm.Pool, error) {

	if f == nil {
		return nil, fmt.Errorf("InfoFilter: nil parameter passed.")
	}

	response, err := vc.c.Client.Call("one.vmpool.info", f.toArgs()...)
	if err != nil {
		return nil, err
	}

	vmPool := &vm.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), vmPool)
	if err != nil {
		return nil, err
	}

	return vmPool, nil
}

// InfoExtendedFilter connects to OpenNebula and fetches the whole VM_POOL information
func (vc *VMsController) InfoExtendedFilter(f *VMFilter) (*vm.Pool, error) {

	if f == nil {
		return nil, fmt.Errorf("InfoFilter: nil parameter passed.")
	}

	response, err := vc.c.Client.Call("one.vmpool.infoextended", f.toArgs()...)
	if err != nil {
		return nil, err
	}
	vmPool := &vm.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), vmPool)
	if err != nil {
		return nil, err
	}
	return vmPool, nil
}

// Info connects to OpenNebula and fetches the information of the VM
func (vc *VMController) Info(decrypt bool) (*vm.VM, error) {
	response, err := vc.c.Client.Call("one.vm.info", vc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	vm := &vm.VM{}
	err = xml.Unmarshal([]byte(response.Body()), vm)
	if err != nil {
		return nil, err
	}
	return vm, nil
}

// Monitoring returns all the virtual machine monitoring records
// filter flag:
// -4: Resources belonging to the user's primary group
// -3: Resources belonging to the user
// -2: All resources
// -1: Resources belonging to the user and any of his groups
// >= 0: UID User's Resources
func (vc *VMsController) Monitoring(filter int) (string, error) {
	monitorData, err := vc.c.Client.Call("one.vmpool.monitoring", filter)
	if err != nil {
		return "", err
	}
	return monitorData.Body(), nil
}

// Accounting returns the virtual machine history records
// filter flag:
//   -4: Resources belonging to the user's primary group
//   -3: Resources belonging to the user
//   -2: All resources
//   -1: Resources belonging to the user and any of his groups
//   >= 0: UID User's Resources
// if startTime and/or endTime are -1 it means no limit
func (vc *VMsController) Accounting(filter, startTime, endTime int) error {
	_, err := vc.c.Client.Call("one.vmpool.accounting", filter)
	return err
}

// Showback returns the virtual machine showback records
// filter flag
//   <= -3: Connected user's resources
//   -2: All resources
//   -1: Connected user's and his group's resources
//   >= 0: UID User's Resources
// firstMonth: January is 1. Can be -1, in which case the time interval won't have
//   a left boundary.
// firstYear: Can be -1, in which case the time interval won't have a left
//   boundary.
// lastMonth: January is 1. Can be -1, in which case the time interval won't have
//   a right boundary.
// lastYear: Can be -1, in which case the time interval won't have a right
//   boundary.
func (vc *VMsController) Showback(filter, firstMonth, firstYear, lastMonth, lastYear int) error {
	_, err := vc.c.Client.Call("one.vmpool.showback", filter, firstMonth, firstYear, lastMonth, lastYear)
	return err
}

// CalculateShowback processes all the history records, and stores the monthly cost for each VM
// firstMonth: January is 1. Can be -1, in which case the time interval won't have
//   a left boundary.
// firstYear: Can be -1, in which case the time interval won't have a left
//   boundary.
// lastMonth: January is 1. Can be -1, in which case the time interval won't have
//   a right boundary.
// lastYear: Can be -1, in which case the time interval won't have a right
//   boundary.
func (vc *VMsController) CalculateShowback(firstMonth, firstYear, lastMonth, lastYear int) error {
	_, err := vc.c.Client.Call("one.vmpool.calculateshowback", firstMonth, firstYear, lastMonth, lastYear)
	return err
}

// Create allocates a new VM based on the template string provided. It
// returns the image ID
func (vc *VMsController) Create(template string, pending bool) (int, error) {
	response, err := vc.c.Client.Call("one.vm.allocate", template, pending)
	if err != nil {
		return 0, err
	}

	return response.BodyInt(), nil
}

// Action is the generic method to run any action on the VM
func (vc *VMController) Action(action string) error {
	_, err := vc.c.Client.Call("one.vm.action", action, vc.ID)
	return err
}

// Update adds vm content.
// * tpl: The new vm contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (vc *VMController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := vc.c.Client.Call("one.vm.update", vc.ID, tpl, uType)
	return err
}

// UpdateConf updates (appends) a set of supported configuration attributes in
// the VM template
func (vc *VMController) UpdateConf(tpl string) error {
	_, err := vc.c.Client.Call("one.vm.updateconf", vc.ID, tpl)
	return err
}

// Monitoring Returns the virtual machine monitoring records
func (vc *VMController) Monitoring() (string, error) {
	monitorData, err := vc.c.Client.Call("one.vm.monitoring", vc.ID)
	if err != nil {
		return "", err
	}
	return monitorData.Body(), nil
}

// Chown changes the owner/group of a VM. If uid or gid is -1 it will not
// change
func (vc *VMController) Chown(uid, gid int) error {
	_, err := vc.c.Client.Call("one.vm.chown", vc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a VM. If any perm is -1 it will not
// change
func (vc *VMController) Chmod(perm *shared.Permissions) error {
	_, err := vc.c.Client.Call("one.vm.chmod", perm.ToArgs(vc.ID)...)
	return err
}

// Rename changes the name of a VM
func (vc *VMController) Rename(newName string) error {
	_, err := vc.c.Client.Call("one.vm.rename", vc.ID, newName)
	return err
}

// Delete will remove the VM from OpenNebula
func (vc *VMController) Delete() error {
	_, err := vc.c.Client.Call("one.vm.delete", vc.ID)
	return err
}

// Deploy in the selected hostID and/or dsID. Enforce to return error in case of
// overcommitment. Enforce is automatically enabled for non-oneadmin users.
// Set dsID to -1 to let OpenNebula choose the datastore.
func (vc *VMController) Deploy(hostID int, enforce bool, dsID int) error {
	_, err := vc.c.Client.Call("one.vm.deploy", vc.ID, int(hostID), enforce, dsID)
	return err
}

// Resize changes the capacity of the virtual machine
func (vc *VMController) Resize(template string, enforce bool) error {
	_, err := vc.c.Client.Call("one.vm.resize", vc.ID, template, enforce)
	return err
}

// Saveas exports a disk to an image and returns the image ID.
// If imageType is empty the default one will be used.
// If snapID is -1 the current image state will be exported
func (vc *VMDiskController) Saveas(imageName, imageType string, snapID int) (int, error) {
	response, err := vc.c.Client.Call("one.vm.disksaveas", vc.entityID, vc.ID, imageName, imageType, snapID)
	if err != nil {
		return 0, err
	}

	return response.BodyInt(), nil
}

// SnapshotCreate will create a snapshot of the disk image
func (vc *VMDiskController) SnapshotCreate(description string) error {
	_, err := vc.c.Client.Call("one.vm.disksnapshotcreate", vc.entityID, vc.ID, description)
	return err
}

// SnapshotDelete will delete a snapshot
func (vc *VMDiskController) SnapshotDelete(snapID int) error {
	_, err := vc.c.Client.Call("one.vm.disksnapshotdelete", vc.entityID, vc.ID, snapID)
	return err
}

// SnapshotRevert will revert disk state to a previously taken snapshot
func (vc *VMDiskController) SnapshotRevert(snapID int) error {
	_, err := vc.c.Client.Call("one.vm.disksnapshotrevert", vc.entityID, vc.ID, snapID)
	return err
}

// SnapshotRename renames a snapshot
func (vc *VMDiskController) SnapshotRename(snapID int, newName string) error {
	_, err := vc.c.Client.Call("one.vm.disksnapshotrename", vc.entityID, vc.ID, snapID, newName)
	return err
}

// DiskAttach attach a new disk to the virtual machine. diskTemplate is a string containing
// a single DISK vector attribute. Syntax can be the usual attribute=value or
// XML
func (vc *VMController) DiskAttach(diskTemplate string) error {
	_, err := vc.c.Client.Call("one.vm.attach", vc.ID, diskTemplate)
	return err
}

// Detach a disk from a virtual machine
func (vc *VMDiskController) Detach() error {
	_, err := vc.c.Client.Call("one.vm.detach", vc.entityID, vc.ID)
	return err
}

// Resize a disk of a virtual machine
func (vc *VMDiskController) Resize(size string) error {
	_, err := vc.c.Client.Call("one.vm.diskresize", vc.entityID, vc.ID, size)
	return err
}

// SnapshotCreate creates a new virtual machine snapshot. name can be empty
func (vc *VMController) SnapshotCreate(name string) error {
	_, err := vc.c.Client.Call("one.vm.snapshotcreate", vc.ID, name)
	return err
}

// SnapshotDelete deletes a virtual machine snapshot
func (vc *VMController) SnapshotDelete(snapID int) error {
	_, err := vc.c.Client.Call("one.vm.snapshotdelete", vc.ID, snapID)
	return err
}

// SnapshotRevert reverts a virtual machine to a snapshot
func (vc *VMController) SnapshotRevert(snapID int) error {
	_, err := vc.c.Client.Call("one.vm.snapshotrevert", vc.ID, snapID)
	return err
}

// Migrate a VM to a target host and/or to another ds
func (vc *VMController) Migrate(hostID int, live, enforce bool, dsID int, migrationType int) error {
	_, err := vc.c.Client.Call("one.vm.migrate", int(hostID), live, enforce, int(dsID), migrationType)
	return err
}

// AttachNIC attaches new network interface to the virtual machine
func (vc *VMController) AttachNIC(tpl string) error {
	_, err := vc.c.Client.Call("one.vm.attachnic", vc.ID, tpl)
	return err
}

// DetachNIC detaches a network interface from the virtual machine
func (vc *VMController) DetachNIC(nicID int) error {
	_, err := vc.c.Client.Call("one.vm.detachnic", vc.ID, nicID)
	return err
}

// VM Actions

// TerminateHard action on the VM
func (vc *VMController) TerminateHard() error {
	return vc.Action("terminate-hard")
}

// Terminate action on the VM
func (vc *VMController) Terminate() error {
	return vc.Action("terminate")
}

// UndeployHard action on the VM
func (vc *VMController) UndeployHard() error {
	return vc.Action("undeploy-hard")
}

// Undeploy action on the VM
func (vc *VMController) Undeploy() error {
	return vc.Action("undeploy")
}

// PoweroffHard action on the VM
func (vc *VMController) PoweroffHard() error {
	return vc.Action("poweroff-hard")
}

// Poweroff action on the VM
func (vc *VMController) Poweroff() error {
	return vc.Action("poweroff")
}

// RebootHard action on the VM
func (vc *VMController) RebootHard() error {
	return vc.Action("reboot-hard")
}

// Reboot action on the VM
func (vc *VMController) Reboot() error {
	return vc.Action("reboot")
}

// Hold action on the VM
func (vc *VMController) Hold() error {
	return vc.Action("hold")
}

// Release action on the VM
func (vc *VMController) Release() error {
	return vc.Action("release")
}

// Stop action on the VM
func (vc *VMController) Stop() error {
	return vc.Action("stop")
}

// Suspend action on the VM
func (vc *VMController) Suspend() error {
	return vc.Action("suspend")
}

// Resume action on the VM
func (vc *VMController) Resume() error {
	return vc.Action("resume")
}

// Resched action on the VM
func (vc *VMController) Resched() error {
	return vc.Action("resched")
}

// Unresched action on the VM
func (vc *VMController) Unresched() error {
	return vc.Action("unresched")
}

// End actions

// Recover recovers a stuck VM that is waiting for a driver operation
func (vc *VMController) Recover(op int) error {
	_, err := vc.c.Client.Call("one.vm.recover", vc.ID, op)
	return err
}

// RecoverSuccess forces a success
func (vc *VMController) RecoverSuccess() error {
	return vc.Recover(1)
}

// RecoverFailure forces a success
func (vc *VMController) RecoverFailure() error {
	return vc.Recover(0)
}

// RecoverRetry forces a success
func (vc *VMController) RecoverRetry() error {
	return vc.Recover(2)
}

// RecoverDelete forces a delete
func (vc *VMController) RecoverDelete() error {
	return vc.Recover(3)
}

// RecoverDeleteRecreate forces a delete
func (vc *VMController) RecoverDeleteRecreate() error {
	return vc.Recover(4)
}

// Lock locks the vm following lock level. See levels in locks.go.
func (vc *VMController) Lock(level shared.LockLevel) error {
	_, err := vc.c.Client.Call("one.vm.lock", vc.ID, level)
	return err
}

// Unlock unlocks the vm.
func (vc *VMController) Unlock() error {
	_, err := vc.c.Client.Call("one.vm.unlock", vc.ID)
	return err
}
