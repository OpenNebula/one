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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

type VNTemplateSuite struct {
	ID 	int
}

var _ = Suite(&VNTemplateSuite{})

func (s *VNTemplateSuite) SetUpTest(c *C) {
	// Create VN Template
	id, err := testCtrl.VNTemplates().Create("NAME=TestVNT\nVN_MAD = bridge")
	c.Assert(err, IsNil)
	s.ID = id
}

func (s *VNTemplateSuite) TearDownTest(c *C) {
	// Delete VN Template
	err := testCtrl.VNTemplate(s.ID).Delete()
	c.Assert(err, IsNil)
}

func (s *VNTemplateSuite) TestGetByNameAndID(c *C) {
	// Get VN Template by ID
	vnt, err := testCtrl.VNTemplate(s.ID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(vnt.ID, Equals, s.ID)

	// Test value
	c.Assert(vnt.Name, Equals, "TestVNT")

	// Get VN Template by name
	id, err := testCtrl.VNTemplates().ByName(vnt.Name)
	c.Assert(err, IsNil)
	c.Assert(vnt.ID, Equals, id)
}

func (s *VNTemplateSuite) TestUpdate(c *C) {
	vntC := testCtrl.VNTemplate(s.ID)
	err := vntC.Update(`DESCRIPTION="Test VNT description"`, parameters.Merge)

	c.Assert(err, IsNil)

	vnt, err := testCtrl.VNTemplate(s.ID).Info(false)
	c.Assert(err, IsNil)

	description, err := vnt.Template.GetStr("DESCRIPTION")
	c.Assert(err, IsNil)
	c.Assert(description, Equals, "Test VNT description")
}

func (s *VNTemplateSuite) TestRename(c *C) {
	vntC := testCtrl.VNTemplate(s.ID)
	err := vntC.Rename("new_name")
	c.Assert(err, IsNil)

	vnt, err := testCtrl.VNTemplate(s.ID).Info(false)
	c.Assert(err, IsNil)
	c.Assert(vnt.Name, Equals, "new_name")
}

func (s *VNTemplateSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	vntC := testCtrl.VNTemplate(s.ID)

	err := vntC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	vnt, err := vntC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(vnt.Permissions, Equals, new_permissions);
}

func (s *VNTemplateSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	err := testCtrl.VNTemplate(s.ID).Chown(1, 1)

	c.Assert(err, IsNil)
}

func (s *VNTemplateSuite) TestLock(c *C) {
	// Lock
	vntC := testCtrl.VNTemplate(s.ID)
	err := vntC.Lock(shared.LockUse)

	c.Assert(err, IsNil)

	vnt, err := vntC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(vnt.LockInfos.Locked, Equals, 1);

	// Unlock
	err = vntC.Unlock()
	c.Assert(err, IsNil)

	vnt, err = vntC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(vnt.LockInfos, IsNil)
}

func (s *VNTemplateSuite) TestClone(c *C) {
	vntC := testCtrl.VNTemplate(s.ID)
	err := vntC.Clone("cloned")
	c.Assert(err, IsNil)

	id, err := testCtrl.VNTemplates().ByName("cloned")
	c.Assert(err, IsNil)

	err = testCtrl.VNTemplate(id).Delete()
	c.Assert(err, IsNil)
}

func (s *VNTemplateSuite) TestInstantiate(c *C) {
	vntC := testCtrl.VNTemplate(s.ID)
	netID, err := vntC.Instantiate("intstantiated", "")
	c.Assert(err, IsNil)

	vnC := testCtrl.VirtualNetwork(netID)

	WaitState(c, vnC, "READY")

	err = vnC.Delete()
	c.Assert(err, IsNil)
}
