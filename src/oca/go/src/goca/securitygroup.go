/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
)

// SecurityGroupsController is a controller for a pool of Security
type SecurityGroupsController entitiesController

// SecurityGroupController is a controller for Security entities
type SecurityGroupController entityController

// SecurityGroupPool represents an OpenNebula SecurityGroupPool
type SecurityGroupPool struct {
	SecurityGroups []SecurityGroup `xml:"SECURITY_GROUP"`
}

// SecurityGroup represents an OpenNebula SecurityGroup
type SecurityGroup struct {
	ID          uint                  `xml:"ID"`
	UID         int                   `xml:"UID"`
	GID         int                   `xml:"GID"`
	UName       string                `xml:"UNAME"`
	GName       string                `xml:"GNAME"`
	Name        string                `xml:"NAME"`
	Permissions *Permissions          `xml:"PERMISSIONS"`
	UpdatedVMs  []int                 `xml:"UPDATED_VMS>ID"`
	OutdatedVMs []int                 `xml:"OUTDATED_VMS>ID"`
	UpdatingVMs []int                 `xml:"UPDATING_VMS>ID"`
	ErrorVMs    []int                 `xml:"ERROR_VMS>ID"`
	Template    securityGroupTemplate `xml:"TEMPLATE"`
}

// VirtualRouterTemplate represent the template part of the OpenNebula VirtualRouter
type securityGroupTemplate struct {
	Description string              `xml:"DESCRIPTION"`
	Rules       []SecurityGroupRule `xml:"RULE"`
	Dynamic     unmatchedTagsSlice  `xml:",any"`
}

type SecurityGroupRule struct {
	Protocol string `xml:"PROTOCOL"`
	RuleType string `xml:"RULE_TYPE"`
}

// SecurityGroups returns a SecurityGroups controller.
func (c *Controller) SecurityGroups() *SecurityGroupsController {
	return &SecurityGroupsController{c}
}

// SecurityGroup returns a SecurityGroup controller
func (c *Controller) SecurityGroup(id uint) *SecurityGroupController {
	return &SecurityGroupController{c, id}
}

// ByName returns a SecurityGroup by Name
func (c *SecurityGroupsController) ByName(name string, args ...int) (uint, error) {
	var id uint

	secgroupPool, err := c.Info(args...)
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(secgroupPool.SecurityGroups); i++ {
		if secgroupPool.SecurityGroups[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = secgroupPool.SecurityGroups[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a security group pool. A connection to OpenNebula is
// performed.
func (sc *SecurityGroupsController) Info(args ...int) (*SecurityGroupPool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
	case 1:
		who = args[0]
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := sc.c.Client.Call("one.secgrouppool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	secgroupPool := &SecurityGroupPool{}
	err = xml.Unmarshal([]byte(response.Body()), secgroupPool)
	if err != nil {
		return nil, err
	}

	return secgroupPool, nil
}

// Info retrieves information for the security group.
func (sc *SecurityGroupController) Info() (*SecurityGroup, error) {
	response, err := sc.c.Client.Call("one.secgroup.info", sc.ID)
	if err != nil {
		return nil, err
	}
	sg := &SecurityGroup{}
	err = xml.Unmarshal([]byte(response.Body()), sg)
	if err != nil {
		return nil, err
	}

	return sg, nil
}

// Create allocates a new security group. It returns the new security group ID.
// * tpl: template of the security group
func (sc *SecurityGroupsController) Create(tpl string) (uint, error) {
	response, err := sc.c.Client.Call("one.secgroup.allocate", tpl)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Clone clones an existing security group. It returns the clone ID
func (sc *SecurityGroupController) Clone(cloneName string) (uint, error) {
	response, err := sc.c.Client.Call("one.secgroup.clone", sc.ID, cloneName)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given security group from the pool.
func (sc *SecurityGroupController) Delete() error {
	_, err := sc.c.Client.Call("one.secgroup.delete", sc.ID)
	return err
}

// Update replaces the cluster cluster contents.
// * tpl: The new cluster contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (sc *SecurityGroupController) Update(tpl string, uType UpdateType) error {
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
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (sc *SecurityGroupController) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := sc.c.Client.Call("one.secgroup.chmod", sc.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
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
