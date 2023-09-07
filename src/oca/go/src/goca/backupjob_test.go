/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/backupjob/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

type BJSuite struct {
	bjID       int
}

var _ = Suite(&BJSuite{})

func (s *BJSuite) SetUpTest(c *C) {
	// Create Backup Job
	bjTpl := `
		NAME = "test-backupjob"
		BACKUP_VMS = "1,2,3"`

	id, err := testCtrl.BackupJobs().Create(bjTpl)
	c.Assert(err, IsNil)
	s.bjID = id
}

func (s *BJSuite) TearDownTest(c *C) {
	// Delete Backup Job
	bjC := testCtrl.BackupJob(s.bjID)
	bjC.Delete()
}

func (s *BJSuite) TestGetByNameAndID(c *C) {
	// Get Backup Job by ID
	bj, err := testCtrl.BackupJob(s.bjID).Info()

	c.Assert(err, IsNil)
	c.Assert(bj.ID, Equals, s.bjID)

	// Test value from Backup Job template
	vms, err := bj.Template.Get(keys.BackupVMs)

	c.Assert(err, IsNil)
	c.Assert(vms, Equals, "1,2,3")

	// Get Backup Job by Name
	id, err := testCtrl.BackupJobs().ByName(bj.Name)
	c.Assert(err, IsNil)
	c.Assert(bj.ID, Equals, id)
}

func (s *BJSuite) TestUpdate(c *C) {
	bjC := testCtrl.BackupJob(s.bjID)
	err := bjC.Update(`BACKUP_VMS = "1,2,3,4"`, parameters.Merge)

	c.Assert(err, IsNil)

	bj, err := testCtrl.BackupJob(s.bjID).Info()
	c.Assert(err, IsNil)

	vms, err := bj.Template.Get(keys.BackupVMs)

	c.Assert(err, IsNil)
	c.Assert(vms, Equals, "1,2,3,4")
}

func (s *BJSuite) TestRename(c *C) {
	bjC := testCtrl.BackupJob(s.bjID)
	bjC.Rename("new_name")

	bj, err := testCtrl.BackupJob(s.bjID).Info()
	c.Assert(err, IsNil)
	c.Assert(bj.Name, Equals, "new_name");
}

func (s *BJSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	bjC := testCtrl.BackupJob(s.bjID)
	err := bjC.Chown(1, 1)

	c.Assert(err, IsNil)
}

func (s *BJSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	bjC := testCtrl.BackupJob(s.bjID)

	err := bjC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	bj, err := bjC.Info()

	c.Assert(err, IsNil)
	c.Assert(*bj.Permissions, Equals, new_permissions);
}

func (s *BJSuite) TestLock(c *C) {
	// Lock
	bjC := testCtrl.BackupJob(s.bjID)
	err := bjC.Lock(shared.LockUse)

	c.Assert(err, IsNil)

	bj, err := bjC.Info()

	c.Assert(err, IsNil)
	c.Assert(bj.LockInfos.Locked, Equals, 1);

	// Unlock
	err = bjC.Unlock()
	c.Assert(err, IsNil)

	bj, err = bjC.Info()

	c.Assert(err, IsNil)
	c.Assert(bj.LockInfos, IsNil)
}

func (s *BJSuite) TestBackup(c *C) {
	// Test only if the call exists, no real change
	bjC := testCtrl.BackupJob(s.bjID)
	err := bjC.Backup()

	c.Assert(err, IsNil)
}

func (s *BJSuite) TestCancel(c *C) {
	// Test only if the call exists, no real change
	bjC := testCtrl.BackupJob(s.bjID)
	err := bjC.Cancel()

	c.Assert(err, IsNil)
}

func (s *BJSuite) TestRetry(c *C) {
	// Test only if the call exists, no real change
	bjC := testCtrl.BackupJob(s.bjID)
	err := bjC.Retry()

	c.Assert(err, IsNil)
}

func (s *BJSuite) TestPriority(c *C) {
	bjC := testCtrl.BackupJob(s.bjID)
	err := bjC.Priority(20)

	c.Assert(err, IsNil)

	bj, err := bjC.Info()

	c.Assert(err, IsNil)
	c.Assert(bj.Priority, Equals, 20)
}

func (s *BJSuite) TestScheduledAction(c *C) {
	// Create Scheduled Action
	sa_tmpl :=  `SCHED_ACTION = [
		REPEAT = "3",
		DAYS = "1",
		TIME = "1695478500" ]`

	bjC := testCtrl.BackupJob(s.bjID)
	saID, err := bjC.SchedAdd(sa_tmpl)

	c.Assert(err, IsNil)

	// Read Scheduled Action
	bj, err := bjC.Info()
	c.Assert(err, IsNil)

	sched_actions := bj.Template.GetSchedActions()
	c.Assert(len(sched_actions), Equals, 1)

	days, err := sched_actions[0].Get(keys.Days)

	c.Assert(err, IsNil)
	c.Assert(days, Equals, "1")

	// Update Scheduled Action
	sa_update := `SCHED_ACTION = [ DAYS = "5" ]`

	_, err = bjC.SchedUpdate(saID, sa_update)
	c.Assert(err, IsNil)

	// Read updated value
	bj, err = bjC.Info()
	c.Assert(err, IsNil)

	sched_actions = bj.Template.GetSchedActions()
	c.Assert(len(sched_actions), Equals, 1)

	days, err = sched_actions[0].Get(keys.Days)

	c.Assert(err, IsNil)
	c.Assert(days, Equals, "5")

	// Delete Scheduled Action
	err = bjC.SchedDelete(saID)
	c.Assert(err, IsNil)

	// Test it doesn't exists
	bj, err = bjC.Info()
	c.Assert(err, IsNil)

	sched_actions = bj.Template.GetSchedActions()
	c.Assert(len(sched_actions), Equals, 0)
}
