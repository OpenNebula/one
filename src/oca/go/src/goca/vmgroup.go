/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
	var id int

	vmGroupPool, err := c.Info(args...)
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

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := vc.c.Client.Call("one.vmgrouppool.info", fArgs...)
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
	response, err := vc.c.Client.Call("one.vmgroup.info", vc.ID, decrypt)
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
	response, err := vc.c.Client.Call("one.vmgroup.allocate", tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Clone clones an existing vmGroup.
// * newName: Name for the new vmGroup.
func (vc *VMGroupController) Clone(newName string) error {
	_, err := vc.c.Client.Call("one.vmgroup.clone", vc.ID, newName)
	return err
}

// Delete deletes the given vmGroup from the pool.
func (vc *VMGroupController) Delete() error {
	_, err := vc.c.Client.Call("one.vmgroup.delete", vc.ID)
	return err
}

// Update replaces the vmGroup template content.
// * tpl: The new vmGroup template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (vc *VMGroupController) Update(tpl string, uType int) error {
	_, err := vc.c.Client.Call("one.vmgroup.update", vc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a vmGroup.
func (vc *VMGroupController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{vc.ID}, perm.ToArgs()...)
	_, err := vc.c.Client.Call("one.vmgroup.chmod", args...)
	return err
}

// Chown changes the ownership of a vmGroup.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (vc *VMGroupController) Chown(userID, groupID int) error {
	_, err := vc.c.Client.Call("one.vmgroup.chown", vc.ID, userID, groupID)
	return err
}

// Rename renames a vmGroup.
// * newName: The new name.
func (vc *VMGroupController) Rename(newName string) error {
	_, err := vc.c.Client.Call("one.vmgroup.rename", vc.ID, newName)
	return err
}

// Lock locks the vmGroup following lock level. See levels in locks.go.
func (vc *VMGroupController) Lock(level shared.LockLevel) error {
	_, err := vc.c.Client.Call("one.vmgroup.lock", vc.ID, level)
	return err
}

// Unlock unlocks the vmGroup.
func (vc *VMGroupController) Unlock() error {
	_, err := vc.c.Client.Call("one.vmgroup.unlock", vc.ID)
	return err
}
