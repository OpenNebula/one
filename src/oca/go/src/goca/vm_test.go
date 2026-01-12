//go:build !disabled
// +build !disabled

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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
	"fmt"
	"regexp"
	"strconv"
	"testing"

	ds "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/datastore"
	dskeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/datastore/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/errors"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

// Hook up gocheck into the "go test" runner.
func Test(t *testing.T) { TestingT(t) }

type VMSuite struct {
	vmID       int
	hostID     int
	vnID       int
	sgID       int
	dsID       int
	imageID    int
}

var _ = Suite(&VMSuite{})

func (s *VMSuite) SetUpSuite(c *C) {
	var err error

	s.hostID, err = testCtrl.Hosts().Create(GenName("dummy-test"), "dummy", "dummy", 0)
	c.Assert(err, IsNil)

	tmpl := ds.NewTemplate()
	tmpl.Add(dskeys.TMMAD, "dummy")
	tmpl.Add(dskeys.DSMAD, "dummy")

	testCtrl.Datastore(1).Update(tmpl.String(), parameters.Merge)

	testCtrl.Datastore(0).Update(tmpl.String(), parameters.Merge)

	dsTmpl := fmt.Sprintf(`
		NAME = %s
		DS_MAD = dummy
		TM_MAD = dummy
		TYPE = BACKUP_DS`, GenName("go_backup_ds"))

	s.dsID, err = testCtrl.Datastores().Create(dsTmpl, 0)
	c.Assert(err, IsNil)

	vnTpl := fmt.Sprintf(`
		NAME = %s
		BRIDGE = vbr0
		VN_MAD = dummy
		NETWORK_ADDRESS = 192.168.0.0
		AR = [ TYPE = IP4, IP = 192.168.0.1, SIZE = 254 ]`, GenName("vn_go_test_sg"))
	s.vnID, err = testCtrl.VirtualNetworks().Create(vnTpl, -1)
	c.Assert(err, IsNil)

	sgTpl := fmt.Sprintf(`
		NAME = %s
		DESCRIPTION = "test security group"
		ATT1 = "VAL1"`, GenName("sg_go_nic_attach"))
	s.sgID, err = testCtrl.SecurityGroups().Create(sgTpl)
	c.Assert(err, IsNil)

	imageTpl := fmt.Sprintf(`
		NAME = %s
		SIZE = 1
		TYPE = DATABLOCK`, GenName("VMSuite-image"))
	s.imageID, _ = testCtrl.Images().Create(imageTpl, 1)
	c.Assert(err, IsNil)
}

func (s *VMSuite) SetUpTest(c *C) {
	// Create VM
	vmName := GenName("VMSuite-vm")
	tpl := vm.NewTemplate()
	tpl.Add(keys.Name, vmName)
	tpl.CPU(1).Memory(64)

	vmID, err := testCtrl.VMs().Create(tpl.String(), true)
	c.Assert(err, IsNil)
	s.vmID = vmID
}

func (s *VMSuite) TearDownTest(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.TerminateHard()
	if err != nil {
		err = vmC.RecoverDelete()
	}
	c.Assert(err, IsNil)
}

func (s *VMSuite) TearDownSuite(c *C) {
	backupDS, err := testCtrl.Datastore(s.dsID).Info(false)
	c.Assert(err, IsNil)

	for i := 0; i < len(backupDS.Images.ID); i++ {
		err := testCtrl.Image(backupDS.Images.ID[i]).Delete()
		c.Assert(err, IsNil)
	}

	//wait for images to be deleted
	err = retryWithExponentialBackoff(func() error {
		backupDS, err := testCtrl.Datastore(s.dsID).Info(false)
		c.Assert(err, IsNil)
		if len(backupDS.Images.ID) > 0 {
			return fmt.Errorf("still exist images")
		}
		return nil
	}, 1000, 5, 0, 3000)
	c.Assert(err, IsNil)

	err = testCtrl.VirtualNetwork(s.vnID).Delete()
	c.Assert(err, IsNil)

	err = testCtrl.SecurityGroup(s.sgID).Delete()
	c.Assert(err, IsNil)

	err = testCtrl.Datastore(s.dsID).Delete()
	c.Assert(err, IsNil)

	err = testCtrl.Image(s.imageID).Delete()
	c.Assert(err, IsNil)

	err = testCtrl.Host(s.hostID).Delete()
	c.Assert(err, IsNil)
}

////////////////////////////////////////////////////////////////////////////////

func VMExpectState(c *C, vmID int, state, lcmState string) func() bool {
	return func() bool {
		vm, err := testCtrl.VM(vmID).Info(false)
		if err != nil {
			return false
		}

		s, l, err := vm.StateString()
		if err != nil {
			return false
		}

		if lcmState != "" && l == lcmState {
			return true
		}

		if state != "" && s == state && lcmState == "" {
			return true
		}

		c.Logf("VM: %d. Expecting: %s/%s, Got: %s/%s", vm.ID, state, lcmState, s, l)

		return false
	}
}

////////////////////////////////////////////////////////////////////////////////

func (s *VMSuite) TestHoldRelease(c *C) {
	vmC := testCtrl.VM(s.vmID)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "HOLD", "")), Equals, true)

	err := vmC.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "PENDING", "")), Equals, true)
}

func (s *VMSuite) TestUpdate(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Update("A=B", parameters.Merge)
	c.Assert(err, IsNil)

	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)

	val, _ := vm.UserTemplate.GetStr("A")
	c.Assert(val, Equals, "B")
}

func (s *VMSuite) TestMigrate(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Migrate(1234, false, false, -1, 0)
	c.Assert(err, NotNil)
	c.Assert(err.Error(), Matches, ".*Error getting host.*")
}

func (s *VMSuite) TestTerminate(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Terminate()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "DONE", "")), Equals, true)
}

func (s *VMSuite) TestTerminateHard(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.TerminateHard()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "DONE", "")), Equals, true)
}

func (s *VMSuite) TestStop(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Stop()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "STOPPED", "")), Equals, true)
}

func (s *VMSuite) TestSuspend(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Suspend()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "SUSPENDED", "")), Equals, true)
}

func (s *VMSuite) TestResume(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Suspend()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "SUSPENDED", "")), Equals, true)

	err = vmC.Resume()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)
}

func (s *VMSuite) TestResize(c *C) {
	expectHostState := func(hostID int) func() bool {
		return func() bool {
			hostC := testCtrl.Host(hostID)
			host, err := hostC.Info(false)
			c.Assert(err, IsNil)
			state, err := host.StateString()
			c.Assert(err, IsNil)

			return state == "MONITORED"
		}
	}

	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Poweroff()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	c.Assert(WaitResource(expectHostState(s.hostID)), Equals, true)

	err = vmC.Resize("CPU=2.5\nMEMORY=512", false)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	err = vmC.Resume()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)

	cpu, _ := vm.Template.GetCPU()
	mem, _ := vm.Template.GetMemory()

	c.Assert(cpu, Equals, 2.5)
	c.Assert(mem, Equals, 512)
}

func (s *VMSuite) TestNicSgAttachDetach(c *C) {
	// Deploy VM and poweroff
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Poweroff()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	// Attach NIC
	err = vmC.AttachNIC("NIC = [ NETWORK_ID = " + strconv.Itoa(s.vnID) + " ]")
	c.Assert(err, IsNil)

	// Update NIC
	err = vmC.UpdateNIC(0, `NIC=[INBOUND_AVG_BW=256]`, parameters.Merge)
	c.Assert(err, IsNil)

	// Attach SG
	err = vmC.AttachSG(0, s.sgID)
	c.Assert(err, IsNil)

	// Detach SG
	err = vmC.DetachSG(0, s.sgID)
	c.Assert(err, IsNil)

	// Detach NIC
	err = vmC.DetachNIC(0)
	c.Assert(err, IsNil)
}

func (s *VMSuite) TestPciAttachDetach(c *C) {
	// Deploy VM
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Poweroff()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	// Attach PCI
	err = vmC.AttachPCI("PCI = [ DEVICE = 0863 ]")
	c.Assert(err, IsNil)

	// Check PCI exists
	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)

	pci, err := vm.Template.GetVector("PCI")
	c.Assert(err, IsNil)

	matched, _ := regexp.MatchString("DEVICE=\"0863\"", pci.String())
	c.Assert(matched, Equals, true)

	// Detach PCI
	err = vmC.DetachPCI(0)
	c.Assert(err, IsNil)

	// Check PCI doesn't exist
	vm, err = vmC.Info(false)
	c.Assert(err, IsNil)

	_, err = vm.Template.GetVector("PCI")
	c.Assert(err, NotNil)
}

func (s *VMSuite) TestBackup(c *C) {
	// Deploy VM
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Backup
	err = vmC.Backup(s.dsID, false)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Cancel Backup - no backup in progress, action should fail
	err = vmC.BackupCancel()
	oneErr, _ := err.(*errors.ResponseError);
	c.Assert(int(oneErr.Code), Equals, errors.OneInternalError)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Restore VM disks from backup Image
	err = vmC.Poweroff()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)

	err = vmC.Restore(vm.Backups.IDs[0], -1, -1)
	c.Assert(err, IsNil)

	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)
}

func (s *VMSuite) TestPoolMethods(c *C) {
	vmsC := testCtrl.VMs()

	vms, err := vmsC.Info()
	c.Assert(err, IsNil)
	c.Assert(vms.VMs, Not(HasLen), 0)

	vms, err = vmsC.InfoExtended()
	c.Assert(err, IsNil)
	c.Assert(vms.VMs, Not(HasLen), 0)

	vms, err = vmsC.InfoSet(strconv.Itoa(s.vmID), false)
	c.Assert(err, IsNil)
	c.Assert(vms.VMs, Not(HasLen), 0)

	vms, err = vmsC.InfoFilter(NewVMFilterDefault())
	c.Assert(err, IsNil)
	c.Assert(vms.VMs, Not(HasLen), 0)

	vms, err = vmsC.InfoExtendedFilter(NewVMFilterDefault())
	c.Assert(err, IsNil)
	c.Assert(vms.VMs, Not(HasLen), 0)

	mon, err := vmsC.Monitoring(-2, 100)
	c.Assert(err, IsNil)
	c.Assert(mon.XMLName.Local, Equals, "MONITORING_DATA")

	// Note: Following methods have wrong return type
	err = vmsC.CalculateShowback(-1, -1, -1, -1)
	c.Assert(err, IsNil)

	err = vmsC.Showback(-2, -1, -1, -1, -1)
	c.Assert(err, IsNil)

	err = vmsC.Accounting(-2, -1, -1)
	c.Assert(err, IsNil)
}

func (s *VMSuite) TestUpdateConf(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.UpdateConf(`GRAPHICS=[TYPE="vnc", LISTEN = "127.0.0.1"]`)
	c.Assert(err, IsNil)
}

func (s *VMSuite) TestRename(c *C) {
	vmC := testCtrl.VM(s.vmID)
	vmC.Rename("new_name")

	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vm.Name, Equals, "new_name");
}

func (s *VMSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	vmC := testCtrl.VM(s.vmID)

	err := vmC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	vm, err := vmC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(*vm.Permissions, Equals, new_permissions);
}

func (s *VMSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Chown(1, 1)

	c.Assert(err, IsNil)

	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vm.UID, Equals, 1);
	c.Assert(vm.GID, Equals, 1);
}

func (s *VMSuite) TestLock(c *C) {
	// Lock
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Lock(shared.LockUse)
	c.Assert(err, IsNil)

	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vm.LockInfos.Locked, Equals, 1);

	// Unlock
	err = vmC.Unlock()
	c.Assert(err, IsNil)

	vm, err = vmC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vm.LockInfos, IsNil)
}

func (s *VMSuite) TestDiskOperations(c *C) {
	// Deploy
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Attach disk
	err = vmC.DiskAttach(fmt.Sprintf(`
		DISK = [IMAGE_ID = %d]`, s.imageID))
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	disk := vmC.Disk(0)
	saved_id, err := disk.Saveas(GenName("saved_image"), "", -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = disk.Resize("32")
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Detach disk
	err = disk.Detach()
	c.Assert(err, IsNil)

	// Cleanup
	err = testCtrl.Image(saved_id).Delete()
	c.Assert(err, IsNil)
}

func (s *VMSuite) TestDiskSnapshots(c *C) {
	// Deploy
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Poweroff
	err = vmC.Poweroff()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	// Attach disk
	err = vmC.DiskAttach(fmt.Sprintf(`DISK = [IMAGE_ID = %d]`, s.imageID))
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	// Snapshot create
	disk := vmC.Disk(0)
	snap_id, err := disk.SnapshotCreate(GenName("snap"))
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	// Snapshot revert
	err = disk.SnapshotRevert(snap_id)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	// Snapshot rename
	err = disk.SnapshotRename(snap_id, GenName("snap-renamed"))
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	// Snapshot delete
	err = disk.SnapshotDelete(snap_id)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)
}

func (s *VMSuite) TestSystemSnapshot(c *C) {
	// Deploy
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Snapshot create
	err = vmC.SnapshotCreate(GenName("snap"))
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Snapshot revert
	err = vmC.SnapshotRevert(0)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Snapshot delete
	err = vmC.SnapshotDelete(0)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)
}

func (s *VMSuite) TestMonitoring(c *C) {
	vmC := testCtrl.VM(s.vmID)
	mon, err := vmC.Monitoring()
	c.Assert(err, IsNil)
	c.Assert(len(mon.Records), Equals, 0)
}

func (s *VMSuite) TestSchedAction(c *C) {
	vmC := testCtrl.VM(s.vmID)
	vm1, err := vmC.Info(false)

	// Create Sched Action
	action := vm1.Template.AddSchedAction()
	action.Add(keys.Action, "poweroff")
	action.Add(keys.Time, "+1000")

	err = vmC.AddSchedAction(action)
	c.Assert(err, IsNil)

	// Check the Sched Action is set
	vm1, err = vmC.Info(false)
	c.Assert(err, IsNil)

	schedActions := vm1.Template.GetSchedActions()
	c.Assert(schedActions, HasLen, 1)

	actionStr, err := schedActions[0].Get(keys.Action)
	c.Assert(err, IsNil)
	c.Assert(actionStr, Equals, "poweroff")

	// Update Sched Action
	schedActions[0].Del(string(keys.Action))
	schedActions[0].Add(keys.Action, "terminate")
	err = vmC.UpdateSchedAction(&schedActions[0])
	c.Assert(err, IsNil)

	// Check the Sched Action is set
	vm1, err = vmC.Info(false)
	c.Assert(err, IsNil)

	schedActions = vm1.Template.GetSchedActions()
	c.Assert(schedActions, HasLen, 1)

	actionStr, err = schedActions[0].Get(keys.Action)
	c.Assert(err, IsNil)
	c.Assert(actionStr, Equals, "terminate")

	// Delete Sched Action
	sched_id, err := schedActions[0].GetInt(string(keys.ActionID))
	c.Assert(err, IsNil)
	err = vmC.DeleteSchedAction(sched_id)
	c.Assert(err, IsNil)
}

func (s *VMSuite) TestExec(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Exec("pwd", "")
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.ExecCancel()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.ExecRetry()
	c.Assert(err, IsNil)
}
