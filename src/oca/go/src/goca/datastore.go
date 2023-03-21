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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/datastore"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// DatastoresController is a controller for Datastore entities
type DatastoresController entitiesController

// DatastoreController is a controller for Datastore entity
type DatastoreController entityController

// Datastores returns a Datastores controller
func (c *Controller) Datastores() *DatastoresController {
	return &DatastoresController{c}
}

// Datastore returns a Datastore controller
func (c *Controller) Datastore(id int) *DatastoreController {
	return &DatastoreController{c, id}
}

// ByName returns a Datastore ID from name
func (c *Controller) ByName(name string) (int, error) {
	return c.ByNameContext(context.Background(), name)
}

// ByNameContext returns a Datastore ID from name
func (c *Controller) ByNameContext(ctx context.Context, name string) (int, error) {
	var id int

	datastorePool, err := (&DatastoresController{c}).InfoContext(ctx)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(datastorePool.Datastores); i++ {
		if datastorePool.Datastores[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = datastorePool.Datastores[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a datastore pool. A connection to OpenNebula is
// performed.
func (dc *DatastoresController) Info() (*datastore.Pool, error) {
	return dc.InfoContext(context.Background())
}

// InfoContext returns a datastore pool. A connection to OpenNebula is
// performed.
func (dc *DatastoresController) InfoContext(ctx context.Context) (*datastore.Pool, error) {
	response, err := dc.c.Client.CallContext(ctx, "one.datastorepool.info")
	if err != nil {
		return nil, err
	}

	datastorePool := &datastore.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), datastorePool)
	if err != nil {
		return nil, err
	}

	return datastorePool, nil
}

// Info retrieves information for the datastore.
func (dc *DatastoreController) Info(decrypt bool) (*datastore.Datastore, error) {
	return dc.InfoContext(context.Background(), decrypt)
}

// InfoContext retrieves information for the datastore.
func (dc *DatastoreController) InfoContext(ctx context.Context, decrypt bool) (*datastore.Datastore, error) {
	response, err := dc.c.Client.CallContext(ctx, "one.datastore.info", dc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	datastore := &datastore.Datastore{}
	err = xml.Unmarshal([]byte(response.Body()), datastore)
	if err != nil {
		return nil, err
	}

	return datastore, nil
}

// Create allocates a new datastore. It returns the new datastore ID.
// * tpl: template of the datastore
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func (dc *DatastoresController) Create(tpl string, clusterID int) (int, error) {
	return dc.CreateContext(context.Background(), tpl, clusterID)
}

// CreateContext allocates a new datastore. It returns the new datastore ID.
// * ctx: context for cancelation
// * tpl: template of the datastore
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func (dc *DatastoresController) CreateContext(ctx context.Context, tpl string, clusterID int) (int, error) {
	response, err := dc.c.Client.CallContext(ctx, "one.datastore.allocate", tpl, clusterID)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given datastore from the pool.
func (dc *DatastoreController) Delete() error {
	return dc.DeleteContext(context.Background())
}

// DeleteContext deletes the given datastore from the pool.
func (dc *DatastoreController) DeleteContext(ctx context.Context) error {
	_, err := dc.c.Client.CallContext(ctx, "one.datastore.delete", dc.ID)
	return err
}

// Update replaces the datastore contents.
//   - tpl: The new datastore contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (dc *DatastoreController) Update(tpl string, uType parameters.UpdateType) error {
	return dc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext replaces the datastore contents.
//   - ctx: context for cancelation
//   - tpl: The new datastore contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (dc *DatastoreController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := dc.c.Client.CallContext(ctx, "one.datastore.update", dc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a datastore.
func (dc *DatastoreController) Chmod(perm *shared.Permissions) error {
	return dc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permission bits of a datastore.
func (dc *DatastoreController) ChmodContext(ctx context.Context, perm *shared.Permissions) error {
	args := append([]interface{}{dc.ID}, perm.ToArgs()...)
	_, err := dc.c.Client.CallContext(ctx, "one.datastore.chmod", args...)
	return err
}

// Chown changes the ownership of a datastore.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (dc *DatastoreController) Chown(userID, groupID int) error {
	return dc.ChownContext(context.Background(), userID, groupID)
}

// ChownContext changes the ownership of a datastore.
// * ctx: context for cancelation
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (dc *DatastoreController) ChownContext(ctx context.Context, userID, groupID int) error {
	_, err := dc.c.Client.CallContext(ctx, "one.datastore.chown", dc.ID, userID, groupID)
	return err
}

// Rename renames a datastore.
// * newName: The new name.
func (dc *DatastoreController) Rename(newName string) error {
	return dc.RenameContext(context.Background(), newName)
}

// RenameContext renames a datastore.
// * ctx: context for cancelation
// * newName: The new name.
func (dc *DatastoreController) RenameContext(ctx context.Context, newName string) error {
	_, err := dc.c.Client.CallContext(ctx, "one.datastore.rename", dc.ID, newName)
	return err
}

// Enable enables or disables a datastore.
// * enable: True for enabling
func (dc *DatastoreController) Enable(enable bool) error {
	return dc.EnableContext(context.Background(), enable)
}

// Enable enables or disables a datastore.
// * ctx: context for cancelation
// * enable: True for enabling
func (dc *DatastoreController) EnableContext(ctx context.Context, enable bool) error {
	_, err := dc.c.Client.CallContext(ctx, "one.datastore.enable", dc.ID, enable)
	return err
}
