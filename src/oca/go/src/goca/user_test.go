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

type UserSuite struct {
	groupID int
	userID  int
}

var _ = Suite(&UserSuite{})

func (s *UserSuite) SetUpSuite(c *C) {
	// Create Group
	id, err := testCtrl.Groups().Create(GenName("TestGroup"))
	c.Assert(err, IsNil)
	s.groupID = id
}

func (s *UserSuite) TearDownSuite(c *C) {
	// Delete Group
	groupC := testCtrl.Group(s.groupID)
	groupC.Delete()
}

func (s *UserSuite) SetUpTest(c *C) {
	// Create User
	id, err := testCtrl.Users().Create("TestUser", "passwd", "", []int{})
	c.Assert(err, IsNil)
	s.userID = id
}

func (s *UserSuite) TearDownTest(c *C) {
	// Delete User
	user := testCtrl.User(s.userID)
	user.Delete()
}

func (s *UserSuite) TestGetByNameAndID(c *C) {
	// Get User by ID
	user, err := testCtrl.User(s.userID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(user.ID, Equals, s.userID)

	// Test value
	c.Assert(user.GName, Equals, "users")

	// Get User by name
	id, err := testCtrl.Users().ByName(user.Name)
	c.Assert(err, IsNil)
	c.Assert(user.ID, Equals, id)
}

func (s *UserSuite) TestUpdate(c *C) {
	userC := testCtrl.User(s.userID)
	err := userC.Update(`DESCRIPTION="Test group description"`, parameters.Merge)

	c.Assert(err, IsNil)

	user, err := testCtrl.User(s.userID).Info(false)
	c.Assert(err, IsNil)

	description, err := user.Template.GetStr("DESCRIPTION")
	c.Assert(err, IsNil)
	c.Assert(description, Equals, "Test group description")
}

func (s *UserSuite) TestLogin(c *C) {
	userC := testCtrl.User(s.userID)
	err := userC.Login("", 30, 1)
	c.Assert(err, IsNil)
}

func (s *UserSuite) TestAddChangeDelGroup(c *C) {
	// Add Group
	userC := testCtrl.User(s.userID)
	err := userC.AddGroup(s.groupID)
	c.Assert(err, IsNil)

	// Change Group
	err = userC.Chgrp(s.groupID)
	c.Assert(err, IsNil)

	// Remove Group
	err = userC.DelGroup(1)
	c.Assert(err, IsNil)
}

func (s *UserSuite) TestChauth(c *C) {
	userC := testCtrl.User(s.userID)
	err := userC.Chauth("dummy", "dummy_passwd")
	c.Assert(err, IsNil)
}

func (s *UserSuite) TestEnable(c *C) {
	// Disable user
	userC := testCtrl.User(s.userID)
	err := userC.Enable(false)
	c.Assert(err, IsNil)

	// Check user disabled
	user, err := testCtrl.User(s.userID).Info(false)
	c.Assert(err, IsNil)
	c.Assert(user.Enabled, Equals, 0)

	// Enable user
	err = userC.Enable(true)
	c.Assert(err, IsNil)
}

func (s *UserSuite) TestPassword(c *C) {
	userC := testCtrl.User(s.userID)
	err := userC.Passwd("new_password")
	c.Assert(err, IsNil)
}

func (s *UserSuite) TestDefaultQuota(c *C) {
	// Set default quota
	quotaTpl := `VM = [ VMS = "5" ]`
	err := testCtrl.Users().DefaultQuotaUpdate(quotaTpl)
	c.Assert(err, IsNil)

	// Check if the quota is set correctly
	quota, err := testCtrl.Users().DefaultQuotaInfo()
	c.Assert(err, IsNil)

	vms := quota.VM[0].VMs
	c.Assert(vms, Equals, 5)

	// Delete default quota
	err = testCtrl.Users().DefaultQuotaUpdate(`VM = [ VMS = "-2" ]`)
	c.Assert(err, IsNil)
}

func (s *UserSuite) TestQuota(c *C) {
	quotaTpl := `VM = [ VMS = "10" ]`
	userC := testCtrl.User(s.userID)
	err := userC.Quota(quotaTpl)
	c.Assert(err, IsNil)

	// Check quota added
	group, err := testCtrl.User(s.userID).Info(false)
	c.Assert(err, IsNil)

	quota := group.QuotasList.VM[0].VMs
	c.Assert(quota, Equals, 10)
}
