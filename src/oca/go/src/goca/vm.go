/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
	"context"
	"encoding/xml"
	"errors"
	"fmt"

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
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
	return c.ByNameContext(context.Background(), name, args...)
}

// ByNameContext returns VM ID from name
func (c *VMsController) ByNameContext(ctx context.Context, name string, args ...int) (int, error) {
	var id int

	vmPool, err := c.InfoContext(ctx, args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(vmPool.VMs); i++ {
		if vmPool.VMs[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = vmPool.VMs[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, err
}

// Info returns a new VM pool. It accepts the scope of the query.
func (vc *VMsController) Info(args ...int) (*vm.Pool, error) {
	return vc.InfoContext(context.Background(), args...)
}

// InfoContext returns a new VM pool. It accepts the scope of the query.
func (vc *VMsController) InfoContext(ctx context.Context, args ...int) (*vm.Pool, error) {

	fArgs, err := handleVMArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := vc.c.Client.CallContext(ctx, "one.vmpool.info", fArgs...)
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
	return vc.InfoExtendedContext(context.Background(), args...)
}

// InfoExtendedContext connects to OpenNebula and fetches the whole VM_POOL information
func (vc *VMsController) InfoExtendedContext(ctx context.Context, args ...int) (*vm.Pool, error) {

	fArgs, err := handleVMArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := vc.c.Client.CallContext(ctx, "one.vmpool.infoextended", fArgs...)
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
	return vc.InfoFilterContext(context.Background(), f)
}

// InfoFilterContext returns a new VM pool. It accepts the scope of the query.
func (vc *VMsController) InfoFilterContext(ctx context.Context, f *VMFilter) (*vm.Pool, error) {

	if f == nil {
		return nil, fmt.Errorf("InfoFilter: nil parameter passed.")
	}

	response, err := vc.c.Client.CallContext(ctx, "one.vmpool.info", f.toArgs()...)
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
	return vc.InfoExtendedFilterContext(context.Background(), f)
}

// InfoExtendedFilterContext connects to OpenNebula and fetches the whole VM_POOL information
func (vc *VMsController) InfoExtendedFilterContext(ctx context.Context, f *VMFilter) (*vm.Pool, error) {

	if f == nil {
		return nil, fmt.Errorf("InfoFilter: nil parameter passed.")
	}

	response, err := vc.c.Client.CallContext(ctx, "one.vmpool.infoextended", f.toArgs()...)
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

// InfoSet connects to OpenNebula and fetches a VM_POOL containing the VMs in vmIds
func (vc *VMsController) InfoSet(vmIds string, extended bool) (*vm.Pool, error) {
	return vc.InfoSetContext(context.Background(), vmIds, extended)
}

// InfoSetContext connects to OpenNebula and fetches a VM_POOL containing the VMs in vmIds
func (vc *VMsController) InfoSetContext(ctx context.Context, vmIds string, extended bool) (*vm.Pool, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vmpool.infoset", vmIds, extended)
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
	return vc.InfoContext(context.Background(), decrypt)
}

// InfoContext connects to OpenNebula and fetches the information of the VM
func (vc *VMController) InfoContext(ctx context.Context, decrypt bool) (*vm.VM, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vm.info", vc.ID, decrypt)
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
// num: Retrieve monitor records in the last num seconds.
// 0 just the last record, -1 all records
func (vc *VMsController) Monitoring(filter, num int) (*vm.PoolMonitoring, error) {
	return vc.MonitoringContext(context.Background(), filter, num)
}

// MonitoringContext returns all the virtual machine monitoring records
// ctx: context for cancelation
// filter flag:
// -4: Resources belonging to the user's primary group
// -3: Resources belonging to the user
// -2: All resources
// -1: Resources belonging to the user and any of his groups
// >= 0: UID User's Resources
// num: Retrieve monitor records in the last num seconds.
// 0 just the last record, -1 all records
func (vc *VMsController) MonitoringContext(ctx context.Context, filter, num int) (*vm.PoolMonitoring, error) {
	monitorData, err := vc.c.Client.CallContext(ctx, "one.vmpool.monitoring", filter, num)
	if err != nil {
		return nil, err
	}

	vmsMon := &vm.PoolMonitoring{}
	err = xml.Unmarshal([]byte(monitorData.Body()), &vmsMon)
	if err != nil {
		return nil, err
	}

	return vmsMon, nil
}

// Accounting returns the virtual machine history records
// filter flag:
//
//	-4: Resources belonging to the user's primary group
//	-3: Resources belonging to the user
//	-2: All resources
//	-1: Resources belonging to the user and any of his groups
//	>= 0: UID User's Resources
//
// if startTime and/or endTime are -1 it means no limit
func (vc *VMsController) Accounting(filter, startTime, endTime int) error {
	return vc.AccountingContext(context.Background(), filter, startTime, endTime)
}

// AccountingContext returns the virtual machine history records
// ctx: context for cancelation
// filter flag:
//
//	-4: Resources belonging to the user's primary group
//	-3: Resources belonging to the user
//	-2: All resources
//	-1: Resources belonging to the user and any of his groups
//	>= 0: UID User's Resources
//
// if startTime and/or endTime are -1 it means no limit
func (vc *VMsController) AccountingContext(ctx context.Context, filter, startTime, endTime int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmpool.accounting", filter)
	return err
}

// Showback returns the virtual machine showback records
// filter flag
//
//	<= -3: Connected user's resources
//	-2: All resources
//	-1: Connected user's and his group's resources
//	>= 0: UID User's Resources
//
// firstMonth: January is 1. Can be -1, in which case the time interval won't have
//
//	a left boundary.
//
// firstYear: Can be -1, in which case the time interval won't have a left
//
//	boundary.
//
// lastMonth: January is 1. Can be -1, in which case the time interval won't have
//
//	a right boundary.
//
// lastYear: Can be -1, in which case the time interval won't have a right
//
//	boundary.
func (vc *VMsController) Showback(filter, firstMonth, firstYear, lastMonth, lastYear int) error {
	return vc.ShowbackContext(context.Background(), filter, firstMonth, firstYear, lastMonth, lastYear)
}

// ShowbackContext returns the virtual machine showback records
// ctx: context for cancelation
// filter flag
//
//	<= -3: Connected user's resources
//	-2: All resources
//	-1: Connected user's and his group's resources
//	>= 0: UID User's Resources
//
// firstMonth: January is 1. Can be -1, in which case the time interval won't have
//
//	a left boundary.
//
// firstYear: Can be -1, in which case the time interval won't have a left
//
//	boundary.
//
// lastMonth: January is 1. Can be -1, in which case the time interval won't have
//
//	a right boundary.
//
// lastYear: Can be -1, in which case the time interval won't have a right
//
//	boundary.
func (vc *VMsController) ShowbackContext(ctx context.Context, filter, firstMonth, firstYear, lastMonth, lastYear int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmpool.showback", filter, firstMonth, firstYear, lastMonth, lastYear)
	return err
}

// CalculateShowback processes all the history records, and stores the monthly cost for each VM
// firstMonth: January is 1. Can be -1, in which case the time interval won't have
//
//	a left boundary.
//
// firstYear: Can be -1, in which case the time interval won't have a left
//
//	boundary.
//
// lastMonth: January is 1. Can be -1, in which case the time interval won't have
//
//	a right boundary.
//
// lastYear: Can be -1, in which case the time interval won't have a right
//
//	boundary.
func (vc *VMsController) CalculateShowback(firstMonth, firstYear, lastMonth, lastYear int) error {
	return vc.CalculateShowbackContext(context.Background(), firstMonth, firstYear, lastMonth, lastYear)
}

// CalculateShowbackContext processes all the history records, and stores the monthly cost for each VM
// ctx: context for cancelation
// firstMonth: January is 1. Can be -1, in which case the time interval won't have
//
//	a left boundary.
//
// firstYear: Can be -1, in which case the time interval won't have a left
//
//	boundary.
//
// lastMonth: January is 1. Can be -1, in which case the time interval won't have
//
//	a right boundary.
//
// lastYear: Can be -1, in which case the time interval won't have a right
//
//	boundary.
func (vc *VMsController) CalculateShowbackContext(ctx context.Context, firstMonth, firstYear, lastMonth, lastYear int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmpool.calculateshowback", firstMonth, firstYear, lastMonth, lastYear)
	return err
}

// Create allocates a new VM based on the template string provided. It
// returns the image ID
func (vc *VMsController) Create(template string, pending bool) (int, error) {
	return vc.CreateContext(context.Background(), template, pending)
}

// CreateContext allocates a new VM based on the template string provided. It
// returns the image ID
func (vc *VMsController) CreateContext(ctx context.Context, template string, pending bool) (int, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vm.allocate", template, pending)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Action is the generic method to run any action on the VM
func (vc *VMController) Action(action string) error {
	return vc.ActionContext(context.Background(), action)
}

// ActionContext is the generic method to run any action on the VM
func (vc *VMController) ActionContext(ctx context.Context, action string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.action", action, vc.ID)
	return err
}

// Update adds vm content.
//   - tpl: The new vm contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (vc *VMController) Update(tpl string, uType parameters.UpdateType) error {
	return vc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext adds vm content.
//   - ctx: context for cancelation
//   - tpl: The new vm contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (vc *VMController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.update", vc.ID, tpl, uType)
	return err
}

// UpdateConf updates (appends) a set of supported configuration attributes in
// the VM template
func (vc *VMController) UpdateConf(tpl string) error {
	return vc.UpdateConfContext(context.Background(), tpl)
}

// UpdateConf updates (appends) a set of supported configuration attributes in
// the VM template
func (vc *VMController) UpdateConfContext(ctx context.Context, tpl string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.updateconf", vc.ID, tpl)
	return err
}

// Monitoring Returns the virtual machine monitoring records
func (vc *VMController) Monitoring() (*vm.Monitoring, error) {
	return vc.MonitoringContext(context.Background())
}

// MonitoringContext Returns the virtual machine monitoring records
func (vc *VMController) MonitoringContext(ctx context.Context) (*vm.Monitoring, error) {
	monitorData, err := vc.c.Client.CallContext(ctx, "one.vm.monitoring", vc.ID)
	if err != nil {
		return nil, err
	}

	vmMon := &vm.Monitoring{}
	err = xml.Unmarshal([]byte(monitorData.Body()), &vmMon)
	if err != nil {
		return nil, err
	}

	return vmMon, nil
}

// Chown changes the owner/group of a VM. If uid or gid is -1 it will not
// change
func (vc *VMController) Chown(uid, gid int) error {
	return vc.ChownContext(context.Background(), uid, gid)
}

// ChownContext changes the owner/group of a VM. If uid or gid is -1 it will not
// change
func (vc *VMController) ChownContext(ctx context.Context, uid, gid int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.chown", vc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a VM. If any perm is -1 it will not
// change
func (vc *VMController) Chmod(perm shared.Permissions) error {
	return vc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permissions of a VM. If any perm is -1 it will not
// change
func (vc *VMController) ChmodContext(ctx context.Context, perm shared.Permissions) error {
	args := append([]interface{}{vc.ID}, perm.ToArgs()...)
	_, err := vc.c.Client.CallContext(ctx, "one.vm.chmod", args...)
	return err
}

// Rename changes the name of a VM
func (vc *VMController) Rename(newName string) error {
	return vc.RenameContext(context.Background(), newName)
}

// RenameContext changes the name of a VM
func (vc *VMController) RenameContext(ctx context.Context, newName string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.rename", vc.ID, newName)
	return err
}

// Deploy in the selected hostID and/or dsID. Enforce to return error in case of
// overcommitment. Enforce is automatically enabled for non-oneadmin users.
// Set dsID to -1 to let OpenNebula choose the datastore.
func (vc *VMController) Deploy(hostID int, enforce bool, dsID int) error {
	return vc.DeployContext(context.Background(), hostID, enforce, dsID)
}

// Deploy in the selected hostID and/or dsID. Enforce to return error in case of
// overcommitment. Enforce is automatically enabled for non-oneadmin users.
// Set dsID to -1 to let OpenNebula choose the datastore.
func (vc *VMController) DeployContext(ctx context.Context, hostID int, enforce bool, dsID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.deploy", vc.ID, int(hostID), enforce, dsID)
	return err
}

// Resize changes the capacity of the virtual machine
func (vc *VMController) Resize(template string, enforce bool) error {
	return vc.ResizeContext(context.Background(), template, enforce)
}

// ResizeContext changes the capacity of the virtual machine
func (vc *VMController) ResizeContext(ctx context.Context, template string, enforce bool) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.resize", vc.ID, template, enforce)
	return err
}

// Saveas exports a disk to an image and returns the image ID.
// If imageType is empty the default one will be used.
// If snapID is -1 the current image state will be exported
func (vc *VMDiskController) Saveas(imageName, imageType string, snapID int) (int, error) {
	return vc.SaveasContext(context.Background(), imageName, imageType, snapID)
}

// SaveasContext exports a disk to an image and returns the image ID.
// If imageType is empty the default one will be used.
// If snapID is -1 the current image state will be exported
func (vc *VMDiskController) SaveasContext(ctx context.Context, imageName, imageType string, snapID int) (int, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vm.disksaveas", vc.entityID, vc.ID, imageName, imageType, snapID)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// SnapshotCreate will create a snapshot of the disk image
func (vc *VMDiskController) SnapshotCreate(description string) (int, error) {
	return vc.SnapshotCreateContext(context.Background(), description)
}

// SnapshotCreateContext will create a snapshot of the disk image
func (vc *VMDiskController) SnapshotCreateContext(ctx context.Context, description string) (int, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vm.disksnapshotcreate", vc.entityID, vc.ID, description)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), err
}

// SnapshotDelete will delete a snapshot
func (vc *VMDiskController) SnapshotDelete(snapID int) error {
	return vc.SnapshotDeleteContext(context.Background(), snapID)
}

// SnapshotDeleteContext will delete a snapshot
func (vc *VMDiskController) SnapshotDeleteContext(ctx context.Context, snapID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.disksnapshotdelete", vc.entityID, vc.ID, snapID)
	return err
}

// SnapshotRevert will revert disk state to a previously taken snapshot
func (vc *VMDiskController) SnapshotRevert(snapID int) error {
	return vc.SnapshotRevertContext(context.Background(), snapID)
}

// SnapshotRevertContext will revert disk state to a previously taken snapshot
func (vc *VMDiskController) SnapshotRevertContext(ctx context.Context, snapID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.disksnapshotrevert", vc.entityID, vc.ID, snapID)
	return err
}

// SnapshotRename renames a snapshot
func (vc *VMDiskController) SnapshotRename(snapID int, newName string) error {
	return vc.SnapshotRenameContext(context.Background(), snapID, newName)
}

// SnapshotRenameContext renames a snapshot
func (vc *VMDiskController) SnapshotRenameContext(ctx context.Context, snapID int, newName string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.disksnapshotrename", vc.entityID, vc.ID, snapID, newName)
	return err
}

// DiskAttach attach a new disk to the virtual machine. diskTemplate is a string containing
// a single DISK vector attribute. Syntax can be the usual attribute=value or
// XML
func (vc *VMController) DiskAttach(diskTemplate string) error {
	return vc.DiskAttachContext(context.Background(), diskTemplate)
}

// DiskAttachContext attach a new disk to the virtual machine. diskTemplate is a string containing
// a single DISK vector attribute. Syntax can be the usual attribute=value or
// XML
func (vc *VMController) DiskAttachContext(ctx context.Context, diskTemplate string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.attach", vc.ID, diskTemplate)
	return err
}

// Detach a disk from a virtual machine
func (vc *VMDiskController) Detach() error {
	return vc.DetachContext(context.Background())
}

// DetachContext a disk from a virtual machine
func (vc *VMDiskController) DetachContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.detach", vc.entityID, vc.ID)
	return err
}

// Resize a disk of a virtual machine
func (vc *VMDiskController) Resize(size string) error {
	return vc.ResizeContext(context.Background(), size)
}

// ResizeContext a disk of a virtual machine
func (vc *VMDiskController) ResizeContext(ctx context.Context, size string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.diskresize", vc.entityID, vc.ID, size)
	return err
}

// SnapshotCreate creates a new virtual machine snapshot. name can be empty
func (vc *VMController) SnapshotCreate(name string) error {
	return vc.SnapshotCreateContext(context.Background(), name)
}

// SnapshotCreateContext creates a new virtual machine snapshot. name can be empty
func (vc *VMController) SnapshotCreateContext(ctx context.Context, name string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.snapshotcreate", vc.ID, name)
	return err
}

// SnapshotDelete deletes a virtual machine snapshot
func (vc *VMController) SnapshotDelete(snapID int) error {
	return vc.SnapshotDeleteContext(context.Background(), snapID)
}

// SnapshotDeleteContext deletes a virtual machine snapshot
func (vc *VMController) SnapshotDeleteContext(ctx context.Context, snapID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.snapshotdelete", vc.ID, snapID)
	return err
}

// SnapshotRevert reverts a virtual machine to a snapshot
func (vc *VMController) SnapshotRevert(snapID int) error {
	return vc.SnapshotRevertContext(context.Background(), snapID)
}

// SnapshotRevertContext reverts a virtual machine to a snapshot
func (vc *VMController) SnapshotRevertContext(ctx context.Context, snapID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.snapshotrevert", vc.ID, snapID)
	return err
}

// Migrate a VM to a target host and/or to another ds
func (vc *VMController) Migrate(hostID int, live, enforce bool, dsID int, migrationType int) error {
	return vc.MigrateContext(context.Background(), hostID, live, enforce, dsID, migrationType)
}

// MigrateContext a VM to a target host and/or to another ds
func (vc *VMController) MigrateContext(ctx context.Context, hostID int, live, enforce bool, dsID int, migrationType int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.migrate", vc.ID, hostID, live, enforce, dsID, migrationType)
	return err
}

// AttachNIC attaches new network interface to the virtual machine
func (vc *VMController) AttachNIC(tpl string) error {
	return vc.AttachNICContext(context.Background(), tpl)
}

// AttachNICContext attaches new network interface to the virtual machine
func (vc *VMController) AttachNICContext(ctx context.Context, tpl string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.attachnic", vc.ID, tpl)
	return err
}

// DetachNIC detaches a network interface from the virtual machine
func (vc *VMController) DetachNIC(nicID int) error {
	return vc.DetachNICContext(context.Background(), nicID)
}

// DetachNICContext detaches a network interface from the virtual machine
func (vc *VMController) DetachNICContext(ctx context.Context, nicID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.detachnic", vc.ID, nicID)
	return err
}

// VM Actions

// TerminateHard action on the VM
func (vc *VMController) TerminateHard() error {
	return vc.TerminateHardContext(context.Background())
}

// TerminateHardContext action on the VM
func (vc *VMController) TerminateHardContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "terminate-hard")
}

// Terminate action on the VM
func (vc *VMController) Terminate() error {
	return vc.TerminateContext(context.Background())
}

// TerminateContext action on the VM
func (vc *VMController) TerminateContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "terminate")
}

// UndeployHard action on the VM
func (vc *VMController) UndeployHard() error {
	return vc.UndeployHardContext(context.Background())
}

// UndeployHardContext action on the VM
func (vc *VMController) UndeployHardContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "undeploy-hard")
}

// Undeploy action on the VM
func (vc *VMController) Undeploy() error {
	return vc.UndeployContext(context.Background())
}

// UndeployContext action on the VM
func (vc *VMController) UndeployContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "undeploy")
}

// PoweroffHard action on the VM
func (vc *VMController) PoweroffHard() error {
	return vc.PoweroffHardContext(context.Background())
}

// PoweroffHardContext action on the VM
func (vc *VMController) PoweroffHardContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "poweroff-hard")
}

// Poweroff action on the VM
func (vc *VMController) Poweroff() error {
	return vc.PoweroffContext(context.Background())
}

// PoweroffContext action on the VM
func (vc *VMController) PoweroffContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "poweroff")
}

// RebootHard action on the VM
func (vc *VMController) RebootHard() error {
	return vc.RebootHardContext(context.Background())
}

// RebootHardContext action on the VM
func (vc *VMController) RebootHardContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "reboot-hard")
}

// Reboot action on the VM
func (vc *VMController) Reboot() error {
	return vc.RebootContext(context.Background())
}

// RebootContext action on the VM
func (vc *VMController) RebootContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "reboot")
}

// Hold action on the VM
func (vc *VMController) Hold() error {
	return vc.HoldContext(context.Background())
}

// HoldContext action on the VM
func (vc *VMController) HoldContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "hold")
}

// Release action on the VM
func (vc *VMController) Release() error {
	return vc.ReleaseContext(context.Background())
}

// ReleaseContext action on the VM
func (vc *VMController) ReleaseContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "release")
}

// Stop action on the VM
func (vc *VMController) Stop() error {
	return vc.StopContext(context.Background())
}

// StopContext action on the VM
func (vc *VMController) StopContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "stop")
}

// Suspend action on the VM
func (vc *VMController) Suspend() error {
	return vc.SuspendContext(context.Background())
}

// SuspendContext action on the VM
func (vc *VMController) SuspendContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "suspend")
}

// Resume action on the VM
func (vc *VMController) Resume() error {
	return vc.ResumeContext(context.Background())
}

// ResumeContext action on the VM
func (vc *VMController) ResumeContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "resume")
}

// Resched action on the VM
func (vc *VMController) Resched() error {
	return vc.ReschedContext(context.Background())
}

// ReschedContext action on the VM
func (vc *VMController) ReschedContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "resched")
}

// Unresched action on the VM
func (vc *VMController) Unresched() error {
	return vc.UnreschedContext(context.Background())
}

// UnreschedContext action on the VM
func (vc *VMController) UnreschedContext(ctx context.Context) error {
	return vc.ActionContext(ctx, "unresched")
}

// End actions

// Recover recovers a stuck VM that is waiting for a driver operation
func (vc *VMController) Recover(op int) error {
	return vc.RecoverContext(context.Background(), op)
}

// RecoverContext recovers a stuck VM that is waiting for a driver operation
func (vc *VMController) RecoverContext(ctx context.Context, op int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.recover", vc.ID, op)
	return err
}

// RecoverSuccess forces a success
func (vc *VMController) RecoverSuccess() error {
	return vc.RecoverSuccessContext(context.Background())
}

// RecoverSuccessContext forces a success
func (vc *VMController) RecoverSuccessContext(ctx context.Context) error {
	return vc.Recover(1)
}

// RecoverFailure forces a success
func (vc *VMController) RecoverFailure() error {
	return vc.RecoverFailureContext(context.Background())
}

// RecoverFailureContext forces a success
func (vc *VMController) RecoverFailureContext(ctx context.Context) error {
	return vc.Recover(0)
}

// RecoverRetry forces a success
func (vc *VMController) RecoverRetry() error {
	return vc.RecoverRetryContext(context.Background())
}

// RecoverRetryContext forces a success
func (vc *VMController) RecoverRetryContext(ctx context.Context) error {
	return vc.Recover(2)
}

// RecoverDelete forces a delete
func (vc *VMController) RecoverDelete() error {
	return vc.RecoverDeleteContext(context.Background())
}

// RecoverDeleteContext forces a delete
func (vc *VMController) RecoverDeleteContext(ctx context.Context) error {
	return vc.Recover(3)
}

// RecoverDeleteRecreate forces a delete
func (vc *VMController) RecoverDeleteRecreate() error {
	return vc.RecoverDeleteRecreateContext(context.Background())
}

// RecoverDeleteRecreateContext forces a delete
func (vc *VMController) RecoverDeleteRecreateContext(ctx context.Context) error {
	return vc.Recover(4)
}

// Lock locks the vm following lock level. See levels in locks.go.
func (vc *VMController) Lock(level shared.LockLevel) error {
	return vc.LockContext(context.Background(), level)
}

// LockContext locks the vm following lock level. See levels in locks.go.
func (vc *VMController) LockContext(ctx context.Context, level shared.LockLevel) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.lock", vc.ID, level)
	return err
}

// Unlock unlocks the vm.
func (vc *VMController) Unlock() error {
	return vc.UnlockContext(context.Background())
}

// UnlockContext unlocks the vm.
func (vc *VMController) UnlockContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.unlock", vc.ID)
	return err
}

// AddSchedAction adds a new scheduled action to the VM
func (vc *VMController) AddSchedAction(action *vm.SchedAction) error {
	return vc.AddSchedActionContext(context.Background(), action)
}

// AddSchedActionContext adds a new scheduled action to the VM
func (vc *VMController) AddSchedActionContext(ctx context.Context, action *vm.SchedAction) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.schedadd", vc.ID, action.String())
	return err
}

// UpdateSchedAction updates the scheduled action specified by the action ID attribute
func (vc *VMController) UpdateSchedAction(action *vm.SchedAction) error {
	return vc.UpdateSchedActionContext(context.Background(), action)
}

// UpdateSchedActionContext updates the scheduled action specified by the action ID attribute
func (vc *VMController) UpdateSchedActionContext(ctx context.Context, action *vm.SchedAction) error {
	actionId, err := action.GetInt(string(keys.ActionID))
	if err != nil {
		return err
	}

	_, err = vc.c.Client.CallContext(ctx, "one.vm.schedupdate", vc.ID, actionId, action.String())
	return err
}

// DeleteSchedAction deletes the actionId action
func (vc *VMController) DeleteSchedAction(actionId int) error {
	return vc.DeleteSchedActionContext(context.Background(), actionId)
}

// DeleteSchedActionContext deletes the actionId action
func (vc *VMController) DeleteSchedActionContext(ctx context.Context, actionId int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.scheddelete", vc.ID, actionId)
	return err
}

// AttachSG attaches new Security Group to Virtual Machine NIC
func (vc *VMController) AttachSG(nicID int, sgID int) error {
	return vc.AttachSGContext(context.Background(), nicID, sgID)
}

// AttachSGContext attaches new Security Group to Virtual Machine NIC
func (vc *VMController) AttachSGContext(ctx context.Context, nicID int, sgID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.attachsg", vc.ID, nicID, sgID)
	return err
}

// DetachSG detaches a Security Group from Virtual Machine NIC
func (vc *VMController) DetachSG(nicID int, sgID int) error {
	return vc.DetachSGContext(context.Background(), nicID, sgID)
}

// DetachSGContext detaches a Security Group from Virtual Machine NIC
func (vc *VMController) DetachSGContext(ctx context.Context, nicID int, sgID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.detachsg", vc.ID, nicID, sgID)
	return err
}

// Backup Virtual Machine
func (vc *VMController) Backup(dsID int, reset bool) error {
	return vc.BackupContext(context.Background(), dsID, reset)
}

// Backup Virtual Machine
func (vc *VMController) BackupContext(ctx context.Context, dsID int, reset bool) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.backup", vc.ID, dsID, reset)
	return err
}

// Cancel ongoing backup operation
func (vc *VMController) BackupCancel() error {
	return vc.BackupCancelContext(context.Background())
}

// Cancel ongoing backup operation
func (vc *VMController) BackupCancelContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vm.backupcancel", vc.ID)
	return err
}
