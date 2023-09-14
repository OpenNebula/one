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

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vmgroup"
)

// VMGroupsController is a controller for vm groups entities
type VMGroupsController entitiesController

// VMGroupController is a controller for vm group entity
type VMGroupController entityController

// VMGroups returns a VMGroups controller
func (c *Controller) VMGroups() *VMGroupsController {
	return &VMGroupsController{c}
}

// VMGroup returns a VMGroup controller
func (c *Controller) VMGroup(id int) *VMGroupController {
	return &VMGroupController{c, id}
}

// ByName returns a VMGroup ID from name
func (c *VMGroupsController) ByName(name string, args ...int) (int, error) {
	return c.ByNameContext(context.Background(), name, args...)
}

// ByNameContext returns a VMGroup ID from name
func (c *VMGroupsController) ByNameContext(ctx context.Context, name string, args ...int) (int, error) {
	var id int

	vmGroupPool, err := c.InfoContext(ctx, args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(vmGroupPool.VMGroups); i++ {
		if vmGroupPool.VMGroups[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = vmGroupPool.VMGroups[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a vm group pool. A connection to OpenNebula is
// performed.
func (vc *VMGroupsController) Info(args ...int) (*vmgroup.Pool, error) {
	return vc.InfoContext(context.Background(), args...)
}

// InfoContext returns a vm group pool. A connection to OpenNebula is
// performed.
func (vc *VMGroupsController) InfoContext(ctx context.Context, args ...int) (*vmgroup.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := vc.c.Client.CallContext(ctx, "one.vmgrouppool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	vmGroupPool := &vmgroup.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), vmGroupPool)
	if err != nil {
		return nil, err
	}

	return vmGroupPool, nil
}

// Info retrieves information for the vm group.
func (vc *VMGroupController) Info(decrypt bool) (*vmgroup.VMGroup, error) {
	return vc.InfoContext(context.Background(), decrypt)
}

// InfoContext retrieves information for the vm group.
func (vc *VMGroupController) InfoContext(ctx context.Context, decrypt bool) (*vmgroup.VMGroup, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vmgroup.info", vc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	vmGroup := &vmgroup.VMGroup{}
	err = xml.Unmarshal([]byte(response.Body()), vmGroup)
	if err != nil {
		return nil, err
	}

	return vmGroup, nil
}

// Create allocates a new vmGroup. It returns the new vmGroup ID.
func (vc *VMGroupsController) Create(tpl string) (int, error) {
	return vc.CreateContext(context.Background(), tpl)
}

// CreateContext allocates a new vmGroup. It returns the new vmGroup ID.
func (vc *VMGroupsController) CreateContext(ctx context.Context, tpl string) (int, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vmgroup.allocate", tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given vmGroup from the pool.
func (vc *VMGroupController) Delete() error {
	return vc.DeleteContext(context.Background())
}

// DeleteContext deletes the given vmGroup from the pool.
func (vc *VMGroupController) DeleteContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.delete", vc.ID)
	return err
}

// Update replaces the vmGroup template content.
// * tpl: The new vmGroup template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (vc *VMGroupController) Update(tpl string, uType int) error {
	return vc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext replaces the vmGroup template content.
// * ctx: context for cancelation
// * tpl: The new vmGroup template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (vc *VMGroupController) UpdateContext(ctx context.Context, tpl string, uType int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.update", vc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a vmGroup.
func (vc *VMGroupController) Chmod(perm shared.Permissions) error {
	return vc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permission bits of a vmGroup.
func (vc *VMGroupController) ChmodContext(ctx context.Context, perm shared.Permissions) error {
	args := append([]interface{}{vc.ID}, perm.ToArgs()...)
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.chmod", args...)
	return err
}

// Chown changes the ownership of a vmGroup.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (vc *VMGroupController) Chown(userID, groupID int) error {
	return vc.ChownContext(context.Background(), userID, groupID)
}

// ChownContext changes the ownership of a vmGroup.
// * ctx: context for cancelation
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (vc *VMGroupController) ChownContext(ctx context.Context, userID, groupID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.chown", vc.ID, userID, groupID)
	return err
}

// Rename renames a vmGroup.
// * newName: The new name.
func (vc *VMGroupController) Rename(newName string) error {
	return vc.RenameContext(context.Background(), newName)
}

// RenameContext renames a vmGroup.
// * ctx: context for cancelation
// * newName: The new name.
func (vc *VMGroupController) RenameContext(ctx context.Context, newName string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.rename", vc.ID, newName)
	return err
}

// Lock locks the vmGroup following lock level. See levels in locks.go.
func (vc *VMGroupController) Lock(level shared.LockLevel) error {
	return vc.LockContext(context.Background(), level)
}

// LockContext locks the vmGroup following lock level. See levels in locks.go.
// * ctx: context for cancelation
func (vc *VMGroupController) LockContext(ctx context.Context, level shared.LockLevel) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.lock", vc.ID, level)
	return err
}

// Unlock unlocks the vmGroup.
func (vc *VMGroupController) Unlock() error {
	return vc.UnlockContext(context.Background())
}

// UnlockContext unlocks the vmGroup.
// * ctx: context for cancelation
func (vc *VMGroupController) UnlockContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.unlock", vc.ID)
	return err
}

// RolaAdd adds role to VM Group
// * roleTemplate: The new role content. Syntax can be the usual attribute=value or XML.
func (vc *VMGroupController) RoleAdd(roleTemplate string) error {
	return vc.RoleAddContext(context.Background(), roleTemplate)
}

// RoleAddContext adds role to VM Group
// * ctx: context for cancelation
// * roleTemplate: The new role content. Syntax can be the usual attribute=value or XML.
func (vc *VMGroupController) RoleAddContext(ctx context.Context, roleTemplate string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.roleadd", vc.ID, roleTemplate)
	return err
}

// RoleDelete deletes role from VM Group
// * roleID: ID of the role to delete
func (vc *VMGroupController) RoleDelete(roleID int) error {
	return vc.RoleDeleteContext(context.Background(), roleID)
}

// RoleDeleteContext deletes role from VM Group
// * roleID: ID of the role to delete
func (vc *VMGroupController) RoleDeleteContext(ctx context.Context, roleID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.roledelete", vc.ID, roleID)
	return err
}

// RoleUpdate updates VM Group role
// * ctx: context for cancelation
// * roleID: ID of the role to update
// * roleTemplate: The new role content. Syntax can be the usual attribute=value or XML.
func (vc *VMGroupController) RoleUpdate(roleID int, roleTemplate string) error {
	return vc.RoleUpdateContext(context.Background(), roleID, roleTemplate)
}

// RoleUpdateContext update VM Group role
// * roleID: ID of the role to update
// * roleTemplate: The new role content. Syntax can be the usual attribute=value or XML.
func (vc *VMGroupController) RoleUpdateContext(ctx context.Context, roleID int, roleTemplate string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vmgroup.roleupdate", vc.ID, roleID, roleTemplate)
	return err
}
