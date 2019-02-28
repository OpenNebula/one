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

// GroupsController is a controller for a Groups
type GroupsController entitiesController

// GroupController is a controller for Group entity
type GroupController entityController

// GroupPool represents an OpenNebula GroupPool
type GroupPool struct {
	Groups            []Group    `xml:"GROUP"`
	Quotas            []quotas   `xml:"QUOTAS"`
	DefaultUserQuotas quotasList `xml:"DEFAULT_USER_QUOTAS"`
}

// Group represents an OpenNebula Group
type Group struct {
	ID       uint          `xml:"ID"`
	Name     string        `xml:"NAME"`
	Users    []int         `xml:"USERS>ID"`
	Admins   []int         `xml:"ADMINS>ID"`
	Template groupTemplate `xml:"TEMPLATE"`

	// Variable part between one.grouppool.info and one.group.info
	quotasList
	DefaultUserQuotas quotasList `xml:"DEFAULT_USER_QUOTAS"`
}

type groupTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// Groups returns a Groups controller.
func (c *Controller) Groups() *GroupsController {
	return &GroupsController{c}
}

// Group returns a Group Controller
func (c *Controller) Group(id uint) *GroupController {
	return &GroupController{c, id}
}

// ByName returns a Group ID from name
func (c *GroupsController) ByName(name string) (uint, error) {
	var id uint

	groupPool, err := c.Info()
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(groupPool.Groups); i++ {
		if groupPool.Groups[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = groupPool.Groups[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a group pool. A connection to OpenNebula is
// performed.
func (gc *GroupsController) Info() (*GroupPool, error) {
	response, err := gc.c.Client.Call("one.grouppool.info")
	if err != nil {
		return nil, err
	}

	groupPool := &GroupPool{}
	err = xml.Unmarshal([]byte(response.Body()), groupPool)
	if err != nil {
		return nil, err
	}

	return groupPool, nil
}

// Info retrieves information for the group.
func (gc *GroupController) Info() (*Group, error) {
	response, err := gc.c.Client.Call("one.group.info", gc.ID)
	if err != nil {
		return nil, err
	}
	group := &Group{}
	err = xml.Unmarshal([]byte(response.Body()), group)
	if err != nil {
		return nil, err
	}
	return group, nil
}

// Create allocates a new group. It returns the new group ID.
func (gc *GroupsController) Create(name string) (uint, error) {
	response, err := gc.c.Client.Call("one.group.allocate", name)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given group from the pool.
func (gc *GroupController) Delete() error {
	_, err := gc.c.Client.Call("one.group.delete", gc.ID)
	return err
}

// Update replaces the group template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (gc *GroupController) Update(tpl string, appendTemplate int) error {
	_, err := gc.c.Client.Call("one.group.update", gc.ID, tpl, appendTemplate)
	return err
}

// AddAdmin adds a User to the Group administrators set
// * userID: The user ID.
func (gc *GroupController) AddAdmin(userID uint) error {
	_, err := gc.c.Client.Call("one.group.addadmin", gc.ID, int(userID))
	return err
}

// DelAdmin removes a User from the Group administrators set
// * userID: The user ID.
func (gc *GroupController) DelAdmin(userID uint) error {
	_, err := gc.c.Client.Call("one.group.deladmin", gc.ID, int(userID))
	return err
}

// Quota sets the group quota limits.
// * tpl: The new quota template contents. Syntax can be the usual attribute=value or XML.
func (gc *GroupController) Quota(tpl string) error {
	_, err := gc.c.Client.Call("one.group.quota", gc.ID, tpl)
	return err
}
