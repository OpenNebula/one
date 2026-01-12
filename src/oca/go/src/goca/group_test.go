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

type GroupSuite struct {
	groupID int
	userID  int
}

var _ = Suite(&GroupSuite{})

func (s *GroupSuite) SetUpSuite(c *C) {
	// Create User
	id, err := testCtrl.Users().Create(GenName("TestUser"), "passwd", "", []int{})
	c.Assert(err, IsNil)
	s.userID = id
}

func (s *GroupSuite) TearDownSuite(c *C) {
	// Delete User
	user := testCtrl.User(s.userID)
	user.Delete()
}

func (s *GroupSuite) SetUpTest(c *C) {
	// Create Group
	id, err := testCtrl.Groups().Create("TestGroup")
	c.Assert(err, IsNil)
	s.groupID = id
}

func (s *GroupSuite) TearDownTest(c *C) {
	// Delete Group
	groupC := testCtrl.Group(s.groupID)
	groupC.Delete()
}

func (s *GroupSuite) TestGetByNameAndID(c *C) {
	// Get Group by ID
	group, err := testCtrl.Group(s.groupID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(group.ID, Equals, s.groupID)

	// Test value
	adm := group.Admins.ID
	c.Assert(len(adm), Equals, 0)

	// Get Group by Name
	id, err := testCtrl.Groups().ByName(group.Name)
	c.Assert(err, IsNil)
	c.Assert(group.ID, Equals, id)
}

func (s *GroupSuite) TestUpdate(c *C) {
	groupC := testCtrl.Group(s.groupID)
	err := groupC.Update(`DESCRIPTION="Test group description"`, parameters.Merge)

	c.Assert(err, IsNil)

	group, err := testCtrl.Group(s.groupID).Info(false)
	c.Assert(err, IsNil)

	description, err := group.Template.GetStr("DESCRIPTION")
	c.Assert(err, IsNil)
	c.Assert(description, Equals, "Test group description")
}

func (s *GroupSuite) TestAddDelAdmin(c *C) {
	// Add admin to group
	userC := testCtrl.User(s.userID)
	err := userC.AddGroup(s.groupID)
	c.Assert(err, IsNil)

	groupC := testCtrl.Group(s.groupID)
	err = groupC.AddAdmin(s.userID)
	c.Assert(err, IsNil)

	// Check admin added
	group, err := testCtrl.Group(s.groupID).Info(false)
	c.Assert(err, IsNil)

	adm := group.Admins.ID
	c.Assert(len(adm), Equals, 1)
	c.Assert(adm[0], Equals, s.userID)

	// Del admin from group
	err = groupC.DelAdmin(s.userID)
	c.Assert(err, IsNil)

	err = userC.DelGroup(s.groupID)
	c.Assert(err, IsNil)
}

func (s *GroupSuite) TestDefaultQuota(c *C) {
	// Set default quota
	quotaTpl := `VM = [ VMS = "5" ]`
	err := testCtrl.Groups().DefaultQuotaUpdate(quotaTpl)
	c.Assert(err, IsNil)

	// Check if the quota is set correctly
	quota, err := testCtrl.Groups().DefaultQuotaInfo()
	c.Assert(err, IsNil)

	vms := quota.VM[0].VMs
	c.Assert(vms, Equals, 5)

	// Delete default quota
	err = testCtrl.Groups().DefaultQuotaUpdate(`VM = [ VMS = "-2" ]`)
	c.Assert(err, IsNil)
}

func (s *GroupSuite) TestQuota(c *C) {
	quotaTpl := `VM = [ VMS = "10" ]`
	groupC := testCtrl.Group(s.groupID)
	err := groupC.Quota(quotaTpl)
	c.Assert(err, IsNil)

	// Check quota added
	group, err := testCtrl.Group(s.groupID).Info(false)
	c.Assert(err, IsNil)

	quota := group.QuotasList.VM[0].VMs
	c.Assert(quota, Equals, 10)
}
