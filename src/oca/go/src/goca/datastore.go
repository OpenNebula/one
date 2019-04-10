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
	"fmt"
)

// DatastoresController is a controller for Datastore entities
type DatastoresController entitiesController

// DatastoreController is a controller for Datastore entity
type DatastoreController entityController

// DatastorePool represents an OpenNebula DatastorePool
type DatastorePool struct {
	Datastores []Datastore `xml:"DATASTORE"`
}

// Datastore represents an OpenNebula Datastore
type Datastore struct {
	ID          uint              `xml:"ID"`
	UID         int               `xml:"UID"`
	GID         int               `xml:"GID"`
	UName       string            `xml:"UNAME"`
	GName       string            `xml:"GNAME"`
	Name        string            `xml:"NAME"`
	Permissions *Permissions      `xml:"PERMISSIONS"`
	DSMad       string            `xml:"DS_MAD"`
	TMMad       string            `xml:"TM_MAD"`
	BasePath    string            `xml:"BASE_PATH"`
	Type        string            `xml:"TYPE"`
	DiskType    string            `xml:"DISK_TYPE"`
	StateRaw    int               `xml:"STATE"`
	ClustersID  []int             `xml:"CLUSTERS>ID"`
	TotalMB     int               `xml:"TOTAL_MB"`
	FreeMB      int               `xml:"FREE_MB"`
	UsedMB      int               `xml:"USED_MB"`
	ImagesID    []int             `xml:"IMAGES>ID"`
	Template    datastoreTemplate `xml:"TEMPLATE"`
}

type datastoreTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// DatastoreState is the state of an OpenNebula datastore
type DatastoreState int

const (
	// DatastoreReady datastore is ready
	DatastoreReady = iota

	// DatastoreDisable datastore is disabled
	DatastoreDisable
)

func (s DatastoreState) isValid() bool {
	if s >= DatastoreReady && s <= DatastoreDisable {
		return true
	}
	return false
}

func (s DatastoreState) String() string {
	return [...]string{
		"READY",
		"DISABLE",
	}[s]
}

// Datastores returns a Datastores controller
func (c *Controller) Datastores() *DatastoresController {
	return &DatastoresController{c}
}

// Datastore returns a Datastore controller
func (c *Controller) Datastore(id uint) *DatastoreController {
	return &DatastoreController{c, id}
}

// ByName returns a Datastore ID from name
func (c *Controller) ByName(name string) (uint, error) {
	var id uint

	datastorePool, err := (&DatastoresController{c}).Info()
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(datastorePool.Datastores); i++ {
		if datastorePool.Datastores[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = datastorePool.Datastores[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a datastore pool. A connection to OpenNebula is
// performed.
func (dc *DatastoresController) Info() (*DatastorePool, error) {
	response, err := dc.c.Client.Call("one.datastorepool.info")
	if err != nil {
		return nil, err
	}

	datastorePool := &DatastorePool{}
	err = xml.Unmarshal([]byte(response.Body()), datastorePool)
	if err != nil {
		return nil, err
	}

	return datastorePool, nil
}

// Info retrieves information for the datastore.
func (dc *DatastoreController) Info() (*Datastore, error) {
	response, err := dc.c.Client.Call("one.datastore.info", dc.ID)
	if err != nil {
		return nil, err
	}
	datastore := &Datastore{}
	err = xml.Unmarshal([]byte(response.Body()), datastore)
	if err != nil {
		return nil, err
	}

	return datastore, nil
}

// Create allocates a new datastore. It returns the new datastore ID.
// * tpl: template of the datastore
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func (dc *DatastoresController) Create(tpl string, clusterID int) (uint, error) {
	response, err := dc.c.Client.Call("one.datastore.allocate", tpl, clusterID)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given datastore from the pool.
func (dc *DatastoreController) Delete() error {
	_, err := dc.c.Client.Call("one.datastore.delete", dc.ID)
	return err
}

// Update replaces the cluster cluster contents.
// * tpl: The new cluster contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (dc *DatastoreController) Update(tpl string, uType UpdateType) error {
	_, err := dc.c.Client.Call("one.datastore.update", dc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a datastore.
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (dc *DatastoreController) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := dc.c.Client.Call("one.datastore.chmod", dc.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Chown changes the ownership of a datastore.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (dc *DatastoreController) Chown(userID, groupID int) error {
	_, err := dc.c.Client.Call("one.datastore.chown", dc.ID, userID, groupID)
	return err
}

// Rename renames a datastore.
// * newName: The new name.
func (dc *DatastoreController) Rename(newName string) error {
	_, err := dc.c.Client.Call("one.datastore.rename", dc.ID, newName)
	return err
}

// Enable enables or disables a datastore.
// * enable: True for enabling
func (dc *DatastoreController) Enable(enable bool) error {
	_, err := dc.c.Client.Call("one.datastore.enable", dc.ID, enable)
	return err
}

// State looks up the state of the image and returns the DatastoreState
func (datastore *Datastore) State() (DatastoreState, error) {
	state := DatastoreState(datastore.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Datastore State: this state value is not currently handled: %d\n", datastore.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (datastore *Datastore) StateString() (string, error) {
	state := DatastoreState(datastore.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Datastore StateString: this state value is not currently handled: %d\n", datastore.StateRaw)
	}
	return state.String(), nil
}
