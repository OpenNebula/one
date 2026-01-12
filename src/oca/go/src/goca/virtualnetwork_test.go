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

	vn "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
)

type VNSuite struct {
	ID       int
}

var _ = Suite(&VNSuite{})

func (s *VNSuite) SetUpSuite(c *C) {
	vnTpl := vn.NewTemplate()
	vnTpl.Add(keys.Name, "vntest")
	vnTpl.Add(keys.Bridge, "vnetbr")
	vnTpl.Add(keys.PhyDev, "eth0")
	vnTpl.Add(keys.SecGroups, "0")
	vnTpl.Add(keys.VlanID, "8000042")
	vnTpl.Add(keys.VNMad, "vxlan")

	id, err := testCtrl.VirtualNetworks().Create(vnTpl.String(), -1)
	c.Assert(err, IsNil)

	s.ID = id
}

func (s *VNSuite) TearDownSuite(c *C) {
	// Delete Virtul Network
	testCtrl.VirtualNetwork(s.ID).Delete()
}

func WaitState(c *C, vnetC *VirtualNetworkController, state string) {
	wait := WaitResource(func() bool {
		vnet, _ := vnetC.Info(false)

		st, _ := vnet.StateString()
		return st == state
	})

	c.Assert(wait, Equals, true)
}

func (s *VNSuite) TestGetByNameAndID(c *C) {
	// Get Virtual Network by ID
	vnC := testCtrl.VirtualNetwork(s.ID)
	vn, err := vnC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vn.ID, Equals, s.ID)

	// Get Virtual Network by Name
	id, err := testCtrl.VirtualNetworks().ByName(vn.Name)
	c.Assert(err, IsNil)
	c.Assert(vn.ID, Equals, id)
}

func (s *VNSuite) TestUpdate(c *C) {
	// Update
	vnC := testCtrl.VirtualNetwork(s.ID)
	err := vnC.Update("A=B", parameters.Merge)
	c.Assert(err, IsNil)

	vn, err := vnC.Info(false)
	c.Assert(err, IsNil)

	val, err := vn.Template.GetStr("A")
	c.Assert(err, IsNil)
	c.Assert(val, Equals, "B")
}

func (s *VNSuite) TestRename(c *C) {
	vnC := testCtrl.VirtualNetwork(s.ID)
	err := vnC.Rename("new_name")
	c.Assert(err, IsNil)

	vn, err := vnC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vn.Name, Equals, "new_name");
}

func (s *VNSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	vnC := testCtrl.VirtualNetwork(s.ID)

	err := vnC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	vn, err := vnC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(*vn.Permissions, Equals, new_permissions);
}

func (s *VNSuite) TestChown(c *C) {
	vnC := testCtrl.VirtualNetwork(s.ID)
	err := vnC.Chown(1, 1)
	c.Assert(err, IsNil)

	vn, err := vnC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vn.UID, Equals, 1);
	c.Assert(vn.GID, Equals, 1);

	err   = vnC.Chown(0, 0)
	c.Assert(err, IsNil)
}

func (s *VNSuite) TestLock(c *C) {
	// Lock
	vnC := testCtrl.VirtualNetwork(s.ID)
	err := vnC.Lock(shared.LockUse)
	c.Assert(err, IsNil)

	vn, err := vnC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vn.Lock.Locked, Equals, 1);

	// Unlock
	err = vnC.Unlock()
	c.Assert(err, IsNil)

	vn, err = vnC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(vn.Lock, IsNil)
}

func (s *VNSuite) TestAR(c *C) {
	// Add
	vnC := testCtrl.VirtualNetwork(s.ID)

	WaitState(c, vnC, "READY")

	err := vnC.AddAR("AR=[TYPE=IP4,IP=10.0.0.1,SIZE=200]")
	c.Assert(err, IsNil)

	// Update
	err = vnC.UpdateAR("AR=[AR_ID=0,SIZE=100]")
	c.Assert(err, IsNil)

	// Reserve
	r1, err := vnC.Reserve("NAME=r1\nSIZE=2")
	c.Assert(err, IsNil)

	// Hold
	err = vnC.Hold("LEASES=[IP=10.0.0.50]")
	c.Assert(err, IsNil)

	// Release
	err = vnC.Release("LEASES=[IP=10.0.0.50]")
	c.Assert(err, IsNil)

	// Free
	vnr1C := testCtrl.VirtualNetwork(r1)
	WaitState(c, vnr1C, "READY")
	err = vnr1C.FreeAR(0)
	c.Assert(err, IsNil)

	// Remove AR
	err = vnC.RmAR(0)
	c.Assert(err, IsNil)

	// Delete reservation Virtual Network
	err = vnr1C.Delete()
	c.Assert(err, IsNil)
}

func (s *VNSuite) TestRecover(c *C) {
	//var err error

	vnTpl := "NAME = vn_invalid_ar\n" +
		"BRIDGE = vbr0\n" +
		"VN_MAD = dummy\n" +
		"NETWORK_ADDRESS = 192.168.0.0\n" +
		"AR = [ TYPE = IP4, IP = 192.168.0.1, SIZE = -1 ]\n"

	id, err := testCtrl.VirtualNetworks().Create(vnTpl, -1)
	c.Assert(err, IsNil)

	// Get Virtual Network
	vnetC := testCtrl.VirtualNetwork(id)

	WaitState(c, vnetC, "ERROR")

	vnetC.RecoverSuccess()

	WaitState(c, vnetC, "READY")

	// Delete Virtual Network
	err = vnetC.Delete()
	c.Assert(err, IsNil)
}
