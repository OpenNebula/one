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
	"encoding/xml"
	"errors"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/backupjob"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// BackupJobsController is a controller for Backup Jobs
type BackupJobsController entitiesController

// BackupJobController is a controller for Backup Job entities
type BackupJobController entityController

// BackupJobs returns an BackupJobs controller
func (c *Controller) BackupJobs() *BackupJobsController {
	return &BackupJobsController{c}
}

// BackupJob returns an Backup Job controller
func (c *Controller) BackupJob(id int) *BackupJobController {
	return &BackupJobController{c, id}
}

// ByName returns an Backup Job ID from name
func (c *BackupJobsController) ByName(name string, args ...int) (int, error) {
	var id int

	bjPool, err := c.Info(args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(bjPool.BackupJobs); i++ {
		if bjPool.BackupJobs[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = bjPool.BackupJobs[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a new Backup Job pool. It accepts the scope of the query.
func (bjc *BackupJobsController) Info(args ...int) (*backupjob.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := bjc.c.Client.Call("one.backupjobpool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	bjPool := &backupjob.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), bjPool)
	if err != nil {
		return nil, err
	}

	return bjPool, nil
}

// Info connects to OpenNebula and fetches the information of the Backup Job
func (bjc *BackupJobController) Info() (*backupjob.BackupJob, error) {
	response, err := bjc.c.Client.Call("one.backupjob.info", bjc.ID)
	if err != nil {
		return nil, err
	}
	bj := &backupjob.BackupJob{}
	err = xml.Unmarshal([]byte(response.Body()), bj)
	if err != nil {
		return nil, err
	}
	return bj, nil
}

// Create allocates a new Backup Job based on the template string provided. It
// returns the Backup Job ID.
func (bjc *BackupJobsController) Create(template string) (int, error) {
	response, err := bjc.c.Client.Call("one.backupjob.allocate", template)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Update adds Backup Job content.
// * tpl: The new Backup Job content. Syntax can be the usual attribute=value or XML.
func (bjc *BackupJobController) Update(tpl string) error {
	_, err := bjc.c.Client.Call("one.backupjob.update", bjc.ID, tpl)
	return err
}

// Chown changes the owner/group of the Backup Job. If uid or gid is -1 it will not
// change
func (bjc *BackupJobController) Chown(uid, gid int) error {
	_, err := bjc.c.Client.Call("one.backupjob.chown", bjc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of the Backup Job. If any perm is -1 it will not
// change
func (bjc *BackupJobController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{bjc.ID}, perm.ToArgs()...)

	_, err := bjc.c.Client.Call("one.backupjob.chmod", args...)
	return err
}

// Rename changes the name of the image
func (bjc *BackupJobController) Rename(newName string) error {
	_, err := bjc.c.Client.Call("one.backupjob.rename", bjc.ID, newName)
	return err
}

// Lock locks the Backup Job following lock level. See levels in locks.go.
func (bjc *BackupJobController) Lock(level shared.LockLevel) error {
	_, err := bjc.c.Client.Call("one.backupjob.lock", bjc.ID, level)
	return err
}

// Unlock unlocks the BackupJob.
func (bjc *BackupJobController) Unlock() error {
	_, err := bjc.c.Client.Call("one.backupjob.unlock", bjc.ID)
	return err
}

// Delete will remove the Backup Job from OpenNebula, which will remove it from the
// backend.
func (bjc *BackupJobController) Delete() error {
	_, err := bjc.c.Client.Call("one.backupjob.delete", bjc.ID)
	return err
}

// Backup runs the Backup Job
func (bjc *BackupJobController) Backup() error {
	_, err := bjc.c.Client.Call("one.backupjob.backup", bjc.ID)
	return err
}

// Cancel ongoing Backup Job execution
func (bjc *BackupJobController) Cancel() error {
	_, err := bjc.c.Client.Call("one.backupjob.cancel", bjc.ID)
	return err
}

// Retry backup for failed Virtual Machine
func (bjc *BackupJobController) Retry() error {
	_, err := bjc.c.Client.Call("one.backupjob.retry", bjc.ID)
	return err
}

// Set priority for Backup Job, only admin can set priority over 50
func (bjc *BackupJobController) Priority(prio int) error {
	_, err := bjc.c.Client.Call("one.backupjob.priority", bjc.ID, prio)
	return err
}

// SchedAdd creates a new Scheduled Action for the Backup Job
func (bjc *BackupJobController) SchedAdd(description string) (int, error) {
	response, err := bjc.c.Client.Call("one.backupjob.schedadd", bjc.ID, description)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), err
}

// SchedUpdate updates a Scheduled Action for the Backup Job
func (bjc *BackupJobController) SchedUpdate(saID int, description string) (int, error) {
	response, err := bjc.c.Client.Call("one.backupjob.schedupdate", bjc.ID, saID, description)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), err
}

// SchedDelete deletes a Scheduled Action
func (bjc *BackupJobController) SchedDelete(saID int) error {
	_, err := bjc.c.Client.Call("one.backupjob.scheddelete", bjc.ID, saID)
	return err
}
