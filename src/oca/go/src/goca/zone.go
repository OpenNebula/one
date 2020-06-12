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

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/zone"
)

// ZonesController is a controller for a pool of Zones
type ZonesController entitiesController

// ZoneController is a controller for Zone entities
type ZoneController entityController

// Zones returns a Zones controller.
func (c *Controller) Zones() *ZonesController {
	return &ZonesController{c}
}

// Zone returns a Zone controller
func (c *Controller) Zone(id int) *ZoneController {
	return &ZoneController{c, id}
}

// ByName returns a zone id from name
func (c *ZonesController) ByName(name string) (int, error) {
	var id int

	zonePool, err := c.Info()
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(zonePool.Zones); i++ {
		if zonePool.Zones[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = zonePool.Zones[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, err
}

// Info returns a zone pool. A connection to OpenNebula is
// performed.
func (zc *ZonesController) Info() (*zone.Pool, error) {
	response, err := zc.c.Client.Call("one.zonepool.info")
	if err != nil {
		return nil, err
	}

	zonePool := &zone.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), zonePool)
	if err != nil {
		return nil, err
	}

	return zonePool, err
}

// Info retrieves information for the zone.
func (zc *ZoneController) Info(decrypt bool) (*zone.Zone, error) {
	response, err := zc.c.Client.Call("one.zone.info", zc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	zone := &zone.Zone{}
	err = xml.Unmarshal([]byte(response.Body()), zone)
	if err != nil {
		return nil, err
	}
	return zone, nil
}

// Create allocates a new zone. It returns the new zc.ID.
// * tpl:	A string containing the template of the ZONE. Syntax can be the usual
//     attribute=value or XML.
// * clusterID: The id of the cluster. If -1, the default one will be used
func (zc *ZonesController) Create(tpl string, clusterID int) (int, error) {
	response, err := zc.c.Client.Call("one.zone.allocate", tpl, clusterID)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given zone from the pool.
func (zc *ZoneController) Delete() error {
	_, err := zc.c.Client.Call("one.zone.delete", zc.ID)
	return err
}

// Update adds zone content.
// * tpl: The new zone contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (zc *ZoneController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := zc.c.Client.Call("one.zone.update", zc.ID, tpl, uType)
	return err
}

// Rename renames a zone.
// * newName: The new name.
func (zc *ZoneController) Rename(newName string) error {
	_, err := zc.c.Client.Call("one.zone.rename", zc.ID, newName)
	return err
}

// ServerRaftStatus give the raft status of the server behind the current RPC endpoint. To get endpoints make an info call.
func (zc *ZonesController) ServerRaftStatus() (*zone.ServerRaftStatus, error) {
	response, err := zc.c.Client.Call("one.zone.raftstatus")
	if err != nil {
		return nil, err
	}
	s := &zone.ServerRaftStatus{}
	err = xml.Unmarshal([]byte(response.Body()), s)
	if err != nil {
		return nil, err
	}
	return s, nil
}
