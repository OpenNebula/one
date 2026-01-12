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
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

type VdcSuite struct {
	vdcID 	int
	hostID  int
	netID   int
}

var _ = Suite(&VdcSuite{})

func (s *VdcSuite) SetUpSuite(c *C) {
	// Create Host
	id, err := testCtrl.Hosts().Create("TestVdcHost", "dummy", "dummy", 0)
	c.Assert(err, IsNil)
	s.hostID = id

	// Create Network
	id, err = testCtrl.VirtualNetworks().Create("NAME = test_vntemplate\nVN_MAD = bridge", -1)
	c.Assert(err, IsNil)
	s.netID = id
}

func (s *VdcSuite) TearDownSuite(c *C) {
	// Delete Host
	err := testCtrl.Host(s.hostID).Delete()
	c.Assert(err, IsNil)

	// Delete Virtual Network
	vnC := testCtrl.VirtualNetwork(s.netID)

	WaitState(c, vnC, "READY")

	err = testCtrl.VirtualNetwork(s.netID).Delete()
	c.Assert(err, IsNil)
}

func (s *VdcSuite) SetUpTest(c *C) {
	// Create VDC
	id, err := testCtrl.VDCs().Create("NAME=TestVDC", -1)
	c.Assert(err, IsNil)
	s.vdcID = id
}

func (s *VdcSuite) TearDownTest(c *C) {
	// Delete VDC
	testCtrl.VDC(s.vdcID).Delete()
}

func (s *VdcSuite) TestGetByNameAndID(c *C) {
	// Get User by ID
	vdc, err := testCtrl.VDC(s.vdcID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(vdc.ID, Equals, s.vdcID)

	// Test value
	c.Assert(vdc.Name, Equals, "TestVDC")

	// Get User by name
	id, err := testCtrl.VDCs().ByName(vdc.Name)
	c.Assert(err, IsNil)
	c.Assert(vdc.ID, Equals, id)
}

func (s *VdcSuite) TestUpdate(c *C) {
	vdcC := testCtrl.VDC(s.vdcID)
	err := vdcC.Update(`DESCRIPTION="Test VDC description"`, parameters.Merge)

	c.Assert(err, IsNil)

	vdc, err := testCtrl.VDC(s.vdcID).Info(false)
	c.Assert(err, IsNil)

	description, err := vdc.Template.GetStr("DESCRIPTION")
	c.Assert(err, IsNil)
	c.Assert(description, Equals, "Test VDC description")
}

func (s *VdcSuite) TestRename(c *C) {
	vdcC := testCtrl.VDC(s.vdcID)
	err := vdcC.Rename("new_name")
	c.Assert(err, IsNil)

	vdc, err := testCtrl.VDC(s.vdcID).Info(false)
	c.Assert(err, IsNil)
	c.Assert(vdc.Name, Equals, "new_name")
}

func (s *VdcSuite) TestAddDelGroup(c *C) {
	// Add Group
	vdcC := testCtrl.VDC(s.vdcID)
	err := vdcC.AddGroup(0)
	c.Assert(err, IsNil)

	// Remove Group
	err = vdcC.DelGroup(0)
	c.Assert(err, IsNil)
}

func (s *VdcSuite) TestAddDelHost(c *C) {
	// Add Host
	vdcC := testCtrl.VDC(s.vdcID)
	err := vdcC.AddHost(0, s.hostID)
	c.Assert(err, IsNil)

	// Remove Host
	err = vdcC.DelHost(0, s.hostID)
	c.Assert(err, IsNil)
}

func (s *VdcSuite) TestAddDelDatastore(c *C) {
	// Add Datastore
	vdcC := testCtrl.VDC(s.vdcID)
	err := vdcC.AddDatastore(0, 0)
	c.Assert(err, IsNil)

	// Remove Datastore
	err = vdcC.DelDatastore(0, 0)
	c.Assert(err, IsNil)
}

func (s *VdcSuite) TestAddDelCluster(c *C) {
	// Add Cluster
	vdcC := testCtrl.VDC(s.vdcID)
	err := vdcC.AddCluster(0, 0)
	c.Assert(err, IsNil)

	// Remove Cluster
	err = vdcC.DelCluster(0, 0)
	c.Assert(err, IsNil)
}

func (s *VdcSuite) TestAddDelNet(c *C) {
	// Add Net
	vdcC := testCtrl.VDC(s.vdcID)
	err := vdcC.AddVnet(0, s.netID)
	c.Assert(err, IsNil)

	// Remove Net
	err = vdcC.DelVnet(0, s.netID)
	c.Assert(err, IsNil)
}
