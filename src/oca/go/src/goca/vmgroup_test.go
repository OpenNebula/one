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
	//"testing"
	//"strconv"

	//ds "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/datastore"
	//dskeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/datastore/keys"
	//"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vmgroup"
	//"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	. "gopkg.in/check.v1"
)

// Hook up gocheck into the "go test" runner.
//func Test(t *testing.T) { TestingT(t) }

type VMGroupSuite struct {
	vmgID int
}

var _ = Suite(&VMGroupSuite{})

func (s *VMGroupSuite) SetUpSuite(c *C) {
}

func (s *VMGroupSuite) SetUpTest(c *C) {
	vmgTmpl := `NAME = "VM Group Test"
		ROLE = [ NAME = web ]
		ROLE = [ NAME = db, POLICY = "AFFINED"  ]
		ROLE = [ NAME = app  ]
		ROLE = [ NAME = bck  ]

		AFFINED = "web, bck"
		ANTI_AFFINED = "db"
		`
	vmgID, err := testCtrl.VMGroups().Create(vmgTmpl)
	c.Assert(err, IsNil)
	s.vmgID = vmgID
}

func (s *VMGroupSuite) TearDownTest(c *C) {
	// Delete VM Group
	vmgC := testCtrl.VMGroup(s.vmgID)
	vmgC.Delete()
}

func (s *VMGroupSuite) TearDownSuite(c *C) {
}

////////////////////////////////////////////////////////////////////////////////

func (s *VMGroupSuite) TestCreated(c *C) {
	vmgC := testCtrl.VMGroup(s.vmgID)

	vmg, err := vmgC.Info(false)
	c.Assert(err, IsNil)

	c.Assert(vmg.Name, Equals, "VM Group Test")

	// Test roles
	c.Assert(vmg.Roles[0].ID, Equals, 0)
	c.Assert(vmg.Roles[0].Name, Equals, "web")
	c.Assert(vmg.Roles[1].ID, Equals, 1)
	c.Assert(vmg.Roles[1].Name, Equals, "db")
	c.Assert(vmg.Roles[1].Policy, Equals, "AFFINED")
	c.Assert(vmg.Roles[2].ID, Equals, 2)
	c.Assert(vmg.Roles[2].Name, Equals, "app")
	c.Assert(vmg.Roles[3].ID, Equals, 3)
	c.Assert(vmg.Roles[3].Name, Equals, "bck")

	// Get Backup Job by Name
	id, err := testCtrl.VMGroups().ByName(vmg.Name)
	c.Assert(err, IsNil)
	c.Assert(id, Equals, s.vmgID)

}

func (s *VMGroupSuite) TestUpdate(c *C) {
	vmgC := testCtrl.VMGroup(s.vmgID)
	err := vmgC.Update("A=B", 1)
	c.Assert(err, IsNil)

	vmg, err := vmgC.Info(false)
	c.Assert(err, IsNil)

	val, _ := vmg.Template.GetStr("A")
	c.Assert(val, Equals, "B")
}

func (s *VMGroupSuite) TestChmod(c *C) {
	vmgC := testCtrl.VMGroup(s.vmgID)

	vmg, err := vmgC.Info(false)
	c.Assert(err, IsNil)

	c.Assert(vmg.Permissions.String(), Equals, "um-------")

	changedPerm := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}
	vmgC.Chmod(changedPerm)

	vmg, err = vmgC.Info(false)
	c.Assert(err, IsNil)

	c.Assert(*vmg.Permissions, Equals, changedPerm)
}

func (s *VMGroupSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	vmgC := testCtrl.VMGroup(s.vmgID)
	err := vmgC.Chown(1, 1)

	c.Assert(err, IsNil)
}

func (s *VMGroupSuite) TestRename(c *C) {
	vmgC := testCtrl.VMGroup(s.vmgID)
	err := vmgC.Rename("Renamed")
	c.Assert(err, IsNil)

	vmg, err := vmgC.Info(false)
	c.Assert(err, IsNil)

	c.Assert(vmg.Name, Equals, "Renamed")
}

func (s *VMGroupSuite) TestLock(c *C) {
	// Lock
	vmgC := testCtrl.VMGroup(s.vmgID)
	err := vmgC.Lock(shared.LockUse)

	c.Assert(err, IsNil)

	vmg, err := vmgC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(vmg.LockInfos.Locked, Equals, 1);

	// Unlock
	err = vmgC.Unlock()
	c.Assert(err, IsNil)

	vmg, err = vmgC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(vmg.LockInfos, IsNil)
}

func (s *VMGroupSuite) TestRoleAdd(c *C) {
	vmgC := testCtrl.VMGroup(s.vmgID)
	err := vmgC.RoleAdd(`ROLE = [ name = "other" ]`)
	c.Assert(err, IsNil)

	vmg, err := vmgC.Info(false)
	c.Assert(err, IsNil)

	c.Assert(vmg.Roles[4].ID, Equals, 4)
	c.Assert(vmg.Roles[4].Name, Equals, "other")
}

func (s *VMGroupSuite) TestRoleDelete(c *C) {
	vmgC := testCtrl.VMGroup(s.vmgID)
	err := vmgC.RoleDelete(2) // app
	c.Assert(err, IsNil)

	vmg, err := vmgC.Info(false)
	c.Assert(err, IsNil)

	c.Assert(vmg.Roles[2].ID, Equals, 3)
	c.Assert(vmg.Roles[2].Name, Equals, "bck")
}

func (s *VMGroupSuite) TestRoleUpdate(c *C) {
	vmgC := testCtrl.VMGroup(s.vmgID)
	err := vmgC.RoleUpdate(2, `ROLE = [ POLICY = "ANTI_AFFINED" ]`)
	c.Assert(err, IsNil)

	vmg, err := vmgC.Info(false)
	c.Assert(err, IsNil)

	c.Assert(vmg.Roles[2].Name, Equals, "app")
	c.Assert(vmg.Roles[2].Policy, Equals, "ANTI_AFFINED")
}
