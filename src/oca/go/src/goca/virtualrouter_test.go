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
	. "gopkg.in/check.v1"

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	vn "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork"
	vnkeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork/keys"
	vrouter "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualrouter"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualrouter/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	vmkeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
)

type VRSuite struct {
	ID       int
}

var _ = Suite(&VRSuite{})

func (s *VRSuite) SetUpSuite(c *C) {
	var vr_name string = "new_vr"

	vr_template := vrouter.NewTemplate()
	vr_template.Add(keys.Name, vr_name)
	vr_template.AddPair("ATT1", "VAL1")
	vr_template.AddPair("ATT2", "VAL2")

	//Create VirtualRouter
	vr_id, err := testCtrl.VirtualRouters().Create(vr_template.String())
	c.Assert(err, IsNil)

	s.ID = vr_id
}

func (s *VRSuite) TearDownSuite(c *C) {
	// Delete Virtul Network
	testCtrl.VirtualRouter(s.ID).Delete()
}

func (s *VRSuite) TestGetByNameAndID(c *C) {
	// Get Virtual Network by ID
	vrC := testCtrl.VirtualRouter(s.ID)
	vr, err := vrC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vr.ID, Equals, s.ID)

	// Get Virtual Network by Name
	id, err := testCtrl.VirtualRouterByName(vr.Name)
	c.Assert(err, IsNil)
	c.Assert(vr.ID, Equals, id)
}

func (s *VRSuite) TestUpdate(c *C) {
	// Update
	vrC := testCtrl.VirtualRouter(s.ID)
	err := vrC.Update("ATT3=VAL3", parameters.Merge)
	c.Assert(err, IsNil)

	vr, err := vrC.Info(false)
	c.Assert(err, IsNil)

	actual_1, err := vr.Template.GetStr("ATT1")
	c.Assert(err, IsNil)
	c.Assert(actual_1, Equals, "VAL1")

	actual_3, err := vr.Template.GetStr("ATT3")
	c.Assert(err, IsNil)
	c.Assert(actual_3, Equals, "VAL3")
}

func (s *VRSuite) TestRename(c *C) {
	vrC := testCtrl.VirtualRouter(s.ID)
	vrC.Rename("new_name")

	vr, err := vrC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vr.Name, Equals, "new_name");
}

func (s *VRSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	vrC := testCtrl.VirtualRouter(s.ID)

	err := vrC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	vr, err := vrC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(*vr.Permissions, Equals, new_permissions);
}

func (s *VRSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	vrC := testCtrl.VirtualRouter(s.ID)
	err := vrC.Chown(1, 1)

	c.Assert(err, IsNil)

	vr, err := vrC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vr.UID, Equals, 1);
	c.Assert(vr.GID, Equals, 1);
}

func (s *VRSuite) TestLock(c *C) {
	// Lock
	vrC := testCtrl.VirtualRouter(s.ID)
	err := vrC.Lock(shared.LockUse)
	c.Assert(err, IsNil)

	vr, err := vrC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vr.LockInfos.Locked, Equals, 1);

	// Unlock
	err = vrC.Unlock()
	c.Assert(err, IsNil)

	vr, err = vrC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vr.LockInfos, IsNil)
}

func (s *VRSuite) TestInstantiate(c *C) {
	vrTmpl := vm.NewTemplate()
	vrTmpl.Add(vmkeys.Name, "vrtemplate")
	vrTmpl.Add(vmkeys.VRouter, "YES")
	vrTmpl.CPU(0.1).Memory(64)

	tmpl_id, err := testCtrl.Templates().Create(vrTmpl.String())
	c.Assert(err, IsNil)

	//Instantiate VirtualRouter
	vrC := testCtrl.VirtualRouter(s.ID)
	vrC.Instantiate(1, int(tmpl_id), "vr_test_go", false, "")

	id, err := testCtrl.VMs().ByName("vr_test_go")
	c.Assert(err, IsNil)

	err = testCtrl.VM(id).TerminateHard()
	c.Assert(err, IsNil)

	err = testCtrl.Template(tmpl_id).Delete()
	c.Assert(err, IsNil)
}

func (s *VRSuite) TestNIC(c *C) {
	vn_tmpl := vn.NewTemplate()
	vn_tmpl.Add(vnkeys.Name, "go-net")
	vn_tmpl.Add(vnkeys.Bridge, "vbr0")
	vn_tmpl.Add(vnkeys.VNMad, "dummy")

	vnet_id, _ := testCtrl.VirtualNetworks().Create(vn_tmpl.String(), 0)
	vnetC := testCtrl.VirtualNetwork(vnet_id)
	WaitState(c, vnetC, "READY")

	nic_tmpl := shared.NewNIC()
	nic_tmpl.Add(shared.Network, "go-net")

	//Attach nic to VirtualRouter
	vrC := testCtrl.VirtualRouter(s.ID)
	err := vrC.AttachNic(nic_tmpl.String())
	c.Assert(err, IsNil)

	vr, err := vrC.Info(false)
	c.Assert(err, IsNil)

	nics := vr.Template.GetVectors(string(shared.NICVec))
	c.Assert(len(nics), Equals, 1)

	actualNetName, _ := nics[0].GetStr("NETWORK")
	c.Assert(actualNetName, Equals, "go-net")

	err = vnetC.Delete()
	c.Assert(err, IsNil)

	//Detach nic from VirtualRouter
	err = vrC.DetachNic(0)
	c.Assert(err, IsNil)
}
