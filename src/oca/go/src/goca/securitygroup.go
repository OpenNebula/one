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

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/securitygroup"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// SecurityGroupsController is a controller for a pool of Security
type SecurityGroupsController entitiesController

// SecurityGroupController is a controller for Security entities
type SecurityGroupController entityController

// SecurityGroups returns a SecurityGroups controller.
func (c *Controller) SecurityGroups() *SecurityGroupsController {
	return &SecurityGroupsController{c}
}

// SecurityGroup returns a SecurityGroup controller
func (c *Controller) SecurityGroup(id int) *SecurityGroupController {
	return &SecurityGroupController{c, id}
}

// ByName returns a SecurityGroup by Name
func (c *SecurityGroupsController) ByName(name string, args ...int) (int, error) {
	var id int

	secgroupPool, err := c.Info(args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(secgroupPool.SecurityGroups); i++ {
		if secgroupPool.SecurityGroups[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = secgroupPool.SecurityGroups[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a security group pool. A connection to OpenNebula is
// performed.
func (sc *SecurityGroupsController) Info(args ...int) (*securitygroup.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := sc.c.Client.Call("one.secgrouppool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	secgroupPool := &securitygroup.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), secgroupPool)
	if err != nil {
		return nil, err
	}

	return secgroupPool, nil
}

// Info retrieves information for the security group.
func (sc *SecurityGroupController) Info(decrypt bool) (*securitygroup.SecurityGroup, error) {
	response, err := sc.c.Client.Call("one.secgroup.info", sc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	sg := &securitygroup.SecurityGroup{}
	err = xml.Unmarshal([]byte(response.Body()), sg)
	if err != nil {
		return nil, err
	}

	return sg, nil
}

// Create allocates a new security group. It returns the new security group ID.
// * tpl: template of the security group
func (sc *SecurityGroupsController) Create(tpl string) (int, error) {
	response, err := sc.c.Client.Call("one.secgroup.allocate", tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Clone clones an existing security group. It returns the clone ID
func (sc *SecurityGroupController) Clone(cloneName string) (int, error) {
	response, err := sc.c.Client.Call("one.secgroup.clone", sc.ID, cloneName)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given security group from the pool.
func (sc *SecurityGroupController) Delete() error {
	_, err := sc.c.Client.Call("one.secgroup.delete", sc.ID)
	return err
}

// Update adds security group content.
// * tpl: The new security group contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (sc *SecurityGroupController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := sc.c.Client.Call("one.secgroup.update", sc.ID, tpl, uType)
	return err
}

// Commit apply security group changes to associated VMs.
// * recovery: If set the commit operation will only operate on outdated and error VMs. If not set operate on all VMs
func (sc *SecurityGroupController) Commit(recovery bool) error {
	_, err := sc.c.Client.Call("one.secgroup.commit", sc.ID, recovery)
	return err
}

// Chmod changes the permission bits of a security group
func (sc *SecurityGroupController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{sc.ID}, perm.ToArgs()...)
	_, err := sc.c.Client.Call("one.secgroup.chmod", args...)
	return err
}

// Chown changes the ownership of a security group.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (sc *SecurityGroupController) Chown(userID, groupID int) error {
	_, err := sc.c.Client.Call("one.secgroup.chown", sc.ID, userID, groupID)
	return err
}

// Rename renames a security group.
// * newName: The new name.
func (sc *SecurityGroupController) Rename(newName string) error {
	_, err := sc.c.Client.Call("one.secgroup.rename", sc.ID, newName)
	return err
}
