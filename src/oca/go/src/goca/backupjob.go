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
	"context"
	"encoding/xml"
	"errors"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/backupjob"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
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
	return c.ByNameContext(context.Background(), name, args...)
}

// ByNameContext returns an Backup Job ID from name
func (c *BackupJobsController) ByNameContext(ctx context.Context, name string, args ...int) (int, error) {
	var id int

	bjPool, err := c.InfoContext(ctx, args...)
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
	return bjc.InfoContext(context.Background(), args...)
}

// InfoContext returns a new Backup Job pool. It accepts the scope of the query.
func (bjc *BackupJobsController) InfoContext(ctx context.Context, args ...int) (*backupjob.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := bjc.c.Client.CallContext(ctx, "one.backupjobpool.info", fArgs...)
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
	return bjc.InfoContext(context.Background())
}

// InfoContext connects to OpenNebula and fetches the information of the Backup Job
func (bjc *BackupJobController) InfoContext(ctx context.Context) (*backupjob.BackupJob, error) {
	response, err := bjc.c.Client.CallContext(ctx, "one.backupjob.info", bjc.ID)
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
	return bjc.CreateContext(context.Background(), template)
}

// CreateContext allocates a new Backup Job based on the template string provided. It
// returns the Backup Job ID.
func (bjc *BackupJobsController) CreateContext(ctx context.Context, template string) (int, error) {
	response, err := bjc.c.Client.CallContext(ctx, "one.backupjob.allocate", template)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Update adds Backup Job content.
// * tpl: The new Backup Job content. Syntax can be the usual attribute=value or XML.
func (bjc *BackupJobController) Update(tpl string, uType parameters.UpdateType) error {
	return bjc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext adds Backup Job content.
// * tpl: The new Backup Job content. Syntax can be the usual attribute=value or XML.
func (bjc *BackupJobController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.update", bjc.ID, tpl, uType)
	return err
}

// Chown changes the owner/group of the Backup Job. If uid or gid is -1 it will not
// change
func (bjc *BackupJobController) Chown(uid, gid int) error {
	return bjc.ChownContext(context.Background(), uid, gid)
}

// ChownContext changes the owner/group of the Backup Job. If uid or gid is -1 it will not
// change
func (bjc *BackupJobController) ChownContext(ctx context.Context, uid, gid int) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.chown", bjc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of the Backup Job. If any perm is -1 it will not
// change
func (bjc *BackupJobController) Chmod(perm shared.Permissions) error {
	return bjc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permissions of the Backup Job. If any perm is -1 it will not
// change
func (bjc *BackupJobController) ChmodContext(ctx context.Context, perm shared.Permissions) error {
	args := append([]interface{}{bjc.ID}, perm.ToArgs()...)

	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.chmod", args...)
	return err
}

// Rename changes the name of the image
func (bjc *BackupJobController) Rename(newName string) error {
	return bjc.RenameContext(context.Background(), newName)
}

// RenameContext changes the name of the image
func (bjc *BackupJobController) RenameContext(ctx context.Context, newName string) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.rename", bjc.ID, newName)
	return err
}

// Lock locks the Backup Job following lock level. See levels in locks.go.
func (bjc *BackupJobController) Lock(level shared.LockLevel) error {
	return bjc.LockContext(context.Background(), level)
}

// LockContext locks the Backup Job following lock level. See levels in locks.go.
func (bjc *BackupJobController) LockContext(ctx context.Context, level shared.LockLevel) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.lock", bjc.ID, level)
	return err
}

// Unlock unlocks the BackupJob.
func (bjc *BackupJobController) Unlock() error {
	return bjc.UnlockContext(context.Background())
}

// UnlockContext unlocks the BackupJob.
func (bjc *BackupJobController) UnlockContext(ctx context.Context) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.unlock", bjc.ID)
	return err
}

// Delete will remove the Backup Job from OpenNebula, which will remove it from the
// backend.
func (bjc *BackupJobController) Delete() error {
	return bjc.DeleteContext(context.Background())
}

// DeleteContext will remove the Backup Job from OpenNebula, which will remove it from the
// backend.
func (bjc *BackupJobController) DeleteContext(ctx context.Context) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.delete", bjc.ID)
	return err
}

// Backup runs the Backup Job
func (bjc *BackupJobController) Backup() error {
	return bjc.BackupContext(context.Background())
}

// BackupContext runs the Backup Job
func (bjc *BackupJobController) BackupContext(ctx context.Context) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.backup", bjc.ID)
	return err
}

// Cancel ongoing Backup Job execution
func (bjc *BackupJobController) Cancel() error {
	return bjc.CancelContext(context.Background())
}

// CancelContext ongoing Backup Job execution
func (bjc *BackupJobController) CancelContext(ctx context.Context) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.cancel", bjc.ID)
	return err
}

// Retry backup for failed Virtual Machine
func (bjc *BackupJobController) Retry() error {
	return bjc.RetryContext(context.Background())
}

// RetryContext backup for failed Virtual Machine
func (bjc *BackupJobController) RetryContext(ctx context.Context) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.retry", bjc.ID)
	return err
}

// Priority set priority for Backup Job, only admin can set priority over 50
func (bjc *BackupJobController) Priority(prio int) error {
	return bjc.PriorityContext(context.Background(), prio)
}

// PriorityContext set priority for Backup Job, only admin can set priority over 50
func (bjc *BackupJobController) PriorityContext(ctx context.Context, prio int) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.priority", bjc.ID, prio)
	return err
}

// SchedAdd creates a new Scheduled Action for the Backup Job
func (bjc *BackupJobController) SchedAdd(description string) (int, error) {
	return bjc.SchedAddContext(context.Background(), description)
}

// SchedAddContext creates a new Scheduled Action for the Backup Job
func (bjc *BackupJobController) SchedAddContext(ctx context.Context, description string) (int, error) {
	response, err := bjc.c.Client.CallContext(ctx, "one.backupjob.schedadd", bjc.ID, description)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), err
}

// SchedUpdate updates a Scheduled Action for the Backup Job
func (bjc *BackupJobController) SchedUpdate(saID int, description string) (int, error) {
	return bjc.SchedUpdateContext(context.Background(), saID, description)
}

// SchedUpdateContext updates a Scheduled Action for the Backup Job
func (bjc *BackupJobController) SchedUpdateContext(ctx context.Context, saID int, description string) (int, error) {
	response, err := bjc.c.Client.CallContext(ctx, "one.backupjob.schedupdate", bjc.ID, saID, description)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), err
}

// SchedDelete deletes a Scheduled Action
func (bjc *BackupJobController) SchedDelete(saID int) error {
	return bjc.SchedDeleteContext(context.Background(), saID)
}

// SchedDeleteContext deletes a Scheduled Action
func (bjc *BackupJobController) SchedDeleteContext(ctx context.Context, saID int) error {
	_, err := bjc.c.Client.CallContext(ctx, "one.backupjob.scheddelete", bjc.ID, saID)
	return err
}
