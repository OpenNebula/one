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

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/group"
)

// GroupsController is a controller for a Groups
type GroupsController entitiesController

// GroupController is a controller for Group entity
type GroupController entityController

// Groups returns a Groups controller.
func (c *Controller) Groups() *GroupsController {
	return &GroupsController{c}
}

// Group returns a Group Controller
func (c *Controller) Group(id int) *GroupController {
	return &GroupController{c, id}
}

// ByName returns a Group ID from name
func (c *GroupsController) ByName(name string) (int, error) {
	return c.ByNameContext(context.Background(), name)
}

// ByNameContext returns a Group ID from name
func (c *GroupsController) ByNameContext(ctx context.Context, name string) (int, error) {
	var id int

	groupPool, err := c.InfoContext(ctx)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(groupPool.Groups); i++ {
		if groupPool.Groups[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = groupPool.Groups[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a group pool. A connection to OpenNebula is
// performed.
func (gc *GroupsController) Info() (*group.Pool, error) {
	return gc.InfoContext(context.Background())
}

// InfoContext returns a group pool. A connection to OpenNebula is
// performed.
func (gc *GroupsController) InfoContext(ctx context.Context) (*group.Pool, error) {
	response, err := gc.c.Client.CallContext(ctx, "one.grouppool.info")
	if err != nil {
		return nil, err
	}

	groupPool := &group.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), groupPool)
	if err != nil {
		return nil, err
	}

	return groupPool, nil
}

// Info retrieves information for the group.
func (gc *GroupController) Info(decrypt bool) (*group.Group, error) {
	return gc.InfoContext(context.Background(), decrypt)
}

// InfoContext retrieves information for the group.
func (gc *GroupController) InfoContext(ctx context.Context, decrypt bool) (*group.Group, error) {
	response, err := gc.c.Client.CallContext(ctx, "one.group.info", gc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	group := &group.Group{}
	err = xml.Unmarshal([]byte(response.Body()), group)
	if err != nil {
		return nil, err
	}
	return group, nil
}

// Create allocates a new group. It returns the new group ID.
func (gc *GroupsController) Create(name string) (int, error) {
	return gc.CreateContext(context.Background(), name)
}

// CreateContext allocates a new group. It returns the new group ID.
func (gc *GroupsController) CreateContext(ctx context.Context, name string) (int, error) {
	response, err := gc.c.Client.CallContext(ctx, "one.group.allocate", name)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given group from the pool.
func (gc *GroupController) Delete() error {
	return gc.DeleteContext(context.Background())
}

// DeleteContext deletes the given group from the pool.
func (gc *GroupController) DeleteContext(ctx context.Context) error {
	_, err := gc.c.Client.CallContext(ctx, "one.group.delete", gc.ID)
	return err
}

// Update adds group content.
// * tpl: The new group contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (gc *GroupController) Update(tpl string, uType parameters.UpdateType) error {
	return gc.UpdateContext(context.Background(), tpl, uType)
}

// Update adds group content.
//   - ctx: context for cancelation
//   - tpl: The new group contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (gc *GroupController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := gc.c.Client.CallContext(ctx, "one.group.update", gc.ID, tpl, uType)
	return err
}

// AddAdmin adds a User to the Group administrators set
// * userID: The user ID.
func (gc *GroupController) AddAdmin(userID int) error {
	return gc.AddAdminContext(context.Background(), userID)
}

// AddAdmin adds a User to the Group administrators set
// * ctx: context for cancelation
// * userID: The user ID.
func (gc *GroupController) AddAdminContext(ctx context.Context, userID int) error {
	_, err := gc.c.Client.CallContext(ctx, "one.group.addadmin", gc.ID, int(userID))
	return err
}

// DelAdmin removes a User from the Group administrators set
// * userID: The user ID.
func (gc *GroupController) DelAdmin(userID int) error {
	return gc.DelAdminContext(context.Background(), userID)
}

// DelAdmin removes a User from the Group administrators set
// * ctx: context for cancelation
// * userID: The user ID.
func (gc *GroupController) DelAdminContext(ctx context.Context, userID int) error {
	_, err := gc.c.Client.CallContext(ctx, "one.group.deladmin", gc.ID, int(userID))
	return err
}

// Quota sets the group quota limits.
// * tpl: The new quota template contents. Syntax can be the usual attribute=value or XML.
func (gc *GroupController) Quota(tpl string) error {
	return gc.QuotaContext(context.Background(), tpl)
}

// Quota sets the group quota limits.
// * ctx: context for cancelation
// * tpl: The new quota template contents. Syntax can be the usual attribute=value or XML.
func (gc *GroupController) QuotaContext(ctx context.Context, tpl string) error {
	_, err := gc.c.Client.CallContext(ctx, "one.group.quota", gc.ID, tpl)
	return err
}
