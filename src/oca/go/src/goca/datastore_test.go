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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/datastore/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

type DatastoreSuite struct {
	dsID       int
}

var _ = Suite(&DatastoreSuite{})

func (s *DatastoreSuite) SetUpTest(c *C) {
	// Create Datastore
	dsTpl := `
		NAME   = test_ds
        TYPE   = system_ds
        TM_MAD = dummy`

	id, err := testCtrl.Datastores().Create(dsTpl, -1)
	c.Assert(err, IsNil)
	s.dsID = id
}

func (s *DatastoreSuite) TearDownTest(c *C) {
	// Delete Datastore
	dsC := testCtrl.Datastore(s.dsID)
	dsC.Delete()
}

func (s *DatastoreSuite) TestGetByNameAndID(c *C) {
	// Get Datastore by ID
	ds, err := testCtrl.Datastore(s.dsID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(ds.ID, Equals, s.dsID)

	// Test value from Backup Job template
	mad, err := ds.Template.Get(keys.TMMAD)

	c.Assert(err, IsNil)
	c.Assert(mad, Equals, "dummy")

	// Get Datastore by Name
	id, err := testCtrl.Datastores().ByName(ds.Name)
	c.Assert(err, IsNil)
	c.Assert(ds.ID, Equals, id)
}

func (s *DatastoreSuite) TestUpdate(c *C) {
	dsC := testCtrl.Datastore(s.dsID)
	err := dsC.Update(`RESTRICTED_DIRS="/tmp"`, parameters.Merge)

	c.Assert(err, IsNil)

	ds, err := testCtrl.Datastore(s.dsID).Info(false)
	c.Assert(err, IsNil)

	dirs, err := ds.Template.Get(keys.RestrictedDirs)

	c.Assert(err, IsNil)
	c.Assert(dirs, Equals, "/tmp")
}

func (s *DatastoreSuite) TestRename(c *C) {
	dsC := testCtrl.Datastore(s.dsID)
	dsC.Rename("new_name")

	ds, err := testCtrl.Datastore(s.dsID).Info(false)
	c.Assert(err, IsNil)
	c.Assert(ds.Name, Equals, "new_name");
}

func (s *DatastoreSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	dsC := testCtrl.Datastore(s.dsID)
	err := dsC.Chown(1, 1)

	c.Assert(err, IsNil)
}

func (s *DatastoreSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	dsC := testCtrl.Datastore(s.dsID)

	err := dsC.Chmod(&new_permissions)

	c.Assert(err, IsNil)

	ds, err := dsC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(*ds.Permissions, Equals, new_permissions);
}

func (s *DatastoreSuite) TestDisableEnable(c *C) {
	// Disable
	dsC := testCtrl.Datastore(s.dsID)
	err := dsC.Enable(false)

	c.Assert(err, IsNil)

	ds, err := dsC.Info(false)
	c.Assert(err, IsNil)

	st, _ := ds.StateString()
	c.Assert(st, Equals, "DISABLE");

	// Enable
	err = dsC.Enable(true)
	c.Assert(err, IsNil)

	ds, err = dsC.Info(false)
	c.Assert(err, IsNil)

	st, _ = ds.StateString()
	c.Assert(st, Equals, "READY")
}

