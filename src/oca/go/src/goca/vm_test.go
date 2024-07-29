// +build !disabled

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
	"testing"
	"strconv"
	"regexp"

	ds "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/datastore"
	dskeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/datastore/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
	. "gopkg.in/check.v1"
)

// Hook up gocheck into the "go test" runner.
func Test(t *testing.T) { TestingT(t) }

type VMSuite struct {
	templateID int
	vmID       int
	hostID     int
	vnID       int
	sgID       int
	dsID       int
}

var _ = Suite(&VMSuite{})

func (s *VMSuite) SetUpSuite(c *C) {
	// Create template
	vmName := GenName("VMSuite-template")
	tpl := vm.NewTemplate()
	tpl.Add(keys.Name, vmName)
	tpl.CPU(1).Memory(64)

	templateID, err := testCtrl.Templates().Create(tpl.String())
	c.Assert(err, IsNil)

	s.templateID = templateID

	s.hostID, _ = testCtrl.Hosts().Create("dummy-test", "dummy", "dummy", 0)

	tmpl := ds.NewTemplate()
	tmpl.Add(dskeys.TMMAD, "dummy")
	tmpl.Add(dskeys.DSMAD, "dummy")

	testCtrl.Datastore(1).Update(tmpl.String(), 1)

	testCtrl.Datastore(0).Update(tmpl.String(), 1)

	dsTmpl := "NAME = go_backup_ds\n" +
			  "DS_MAD = dummy\n" +
			  "TM_MAD = dummy\n" +
			  "TYPE = BACKUP_DS\n";

	s.dsID, _ = testCtrl.Datastores().Create(dsTmpl, 0)

	vnTpl := "NAME = vn_go_test_sg\n" +
			 "BRIDGE = vbr0\n" +
			 "VN_MAD = dummy\n" +
			 "NETWORK_ADDRESS = 192.168.0.0\n"+
			 "AR = [ TYPE = IP4, IP = 192.168.0.1, SIZE = 254 ]\n"
	s.vnID, _ = testCtrl.VirtualNetworks().Create(vnTpl, -1)

	sgTpl := "NAME = sg_go_nic_attach\n" +
			 "DESCRIPTION  = \"test security group\"\n" +
			 "ATT1 = \"VAL1\"\n"
	s.sgID, _ = testCtrl.SecurityGroups().Create(sgTpl)
}

func (s *VMSuite) SetUpTest(c *C) {
	vmID, err := testCtrl.Template(s.templateID).Instantiate("", true, "", false)
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

	err = testCtrl.Template(s.templateID).Delete()
	c.Assert(err, IsNil)

	err = testCtrl.Host(s.hostID).Delete()
	c.Assert(err, IsNil)

	err = testCtrl.VirtualNetwork(s.vnID).Delete()
	c.Assert(err, IsNil)

	err = testCtrl.SecurityGroup(s.sgID).Delete()
	c.Assert(err, IsNil)

	err = testCtrl.Datastore(s.dsID).Delete()
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

func (s *VMSuite) TestVMDeploy(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)
}

func (s *VMSuite) TestVMHoldRelease(c *C) {
	vmC := testCtrl.VM(s.vmID)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "HOLD", "")), Equals, true)

	err := vmC.Release()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "PENDING", "")), Equals, true)
}

func (s *VMSuite) TestVMUpdate(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Update("A=B", 1)
	c.Assert(err, IsNil)

	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)

	val, _ := vm.UserTemplate.GetStr("A")
	c.Assert(val, Equals, "B")
}

// TODO: Hosts
// func (s *VMSuite) TestVMMigrate(c *C) {
// }
// func (s *VMSuite) TestVMLiveMigrate(c *C) {
// }

func (s *VMSuite) TestVMTerminate(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Terminate()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "DONE", "")), Equals, true)
}

func (s *VMSuite) TestVMTerminateHard(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.TerminateHard()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "DONE", "")), Equals, true)
}

func (s *VMSuite) TestVMStop(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Stop()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "STOPPED", "")), Equals, true)
}

func (s *VMSuite) TestVMSuspend(c *C) {
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	err = vmC.Suspend()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "SUSPENDED", "")), Equals, true)
}

func (s *VMSuite) TestVMResume(c *C) {
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

func (s *VMSuite) TestVMResize(c *C) {
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

func (s *VMSuite) TestVMNicSgAttachDetach(c *C) {
	// Deploy VM
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Attach NIC
	err = vmC.AttachNIC("NIC = [ NETWORK_ID = " + strconv.Itoa(s.vnID) + " ]")
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Attach SG
	err = vmC.AttachSG(0, s.sgID)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Detach SG
	err = vmC.DetachSG(0, s.sgID)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Detach NIC
	err = vmC.DetachNIC(0)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)
}

func (s *VMSuite) TestVMPciAttachDetach(c *C) {
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

func (s *VMSuite) TestVMBackup(c *C) {
	// Deploy VM
	vmC := testCtrl.VM(s.vmID)
	err := vmC.Deploy(s.hostID, false, -1)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Backup
	err = vmC.Backup(s.dsID, false)
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Cancel Backup
	vmC.Backup(s.dsID, false)
	err = vmC.BackupCancel()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "ACTIVE", "RUNNING")), Equals, true)

	// Restore VM disks from backup Image
	err = vmC.Poweroff()
	c.Assert(err, IsNil)
	c.Assert(WaitResource(VMExpectState(c, s.vmID, "POWEROFF", "")), Equals, true)

	vm, err := vmC.Info(false)
	c.Assert(err, IsNil)

	err = vmC.Restore(vm.Backups.IDs[0], -1, -1)
	c.Assert(err, IsNil)
}
