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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vdc"
)

// VDCsController is a controller for a pool of VDCs
type VDCsController entitiesController

// VDCController is a controller for VDC entities
type VDCController entityController

// VDCs returns a VDCs controller.
func (c *Controller) VDCs() *VDCsController {
	return &VDCsController{c}
}

// Vdc returns a Vdc controller
func (c *Controller) VDC(id int) *VDCController {
	return &VDCController{c, id}
}

// ByName returns a Vdc ID from name
func (c *VDCsController) ByName(name string) (int, error) {
	var id int

	vdcPool, err := c.Info()
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(vdcPool.VDCs); i++ {
		if vdcPool.VDCs[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = vdcPool.VDCs[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a vdc pool. A connection to OpenNebula is
// performed.
func (vc *VDCsController) Info() (*vdc.Pool, error) {
	response, err := vc.c.Client.Call("one.vdcpool.info")
	if err != nil {
		return nil, err
	}

	vdcPool := &vdc.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), vdcPool)
	if err != nil {
		return nil, err
	}

	return vdcPool, nil
}

// Info retrieves information for the VDC.
func (vc *VDCController) Info(decrypt bool) (*vdc.VDC, error) {
	response, err := vc.c.Client.Call("one.vdc.info", vc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	vdc := &vdc.VDC{}
	err = xml.Unmarshal([]byte(response.Body()), vdc)
	if err != nil {
		return nil, err
	}

	return vdc, nil
}

// Create allocates a new vdc. It returns the new vdc ID.
// * tpl:	A string containing the template of the VDC. Syntax can be the usual
//     attribute=value or XML.
// * clusterID: The cluster ID. If it is -1, this virtual network won’t be added
//     to any cluster
func (vc *VDCsController) Create(tpl string, clusterID int) (int, error) {
	response, err := vc.c.Client.Call("one.vdc.allocate", tpl, clusterID)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given VDC from the pool.
func (vc *VDCController) Delete() error {
	_, err := vc.c.Client.Call("one.vdc.delete", vc.ID)
	return err
}

// Update adds vdc content.
// * tpl: The new vdc contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (vc *VDCController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := vc.c.Client.Call("one.vdc.update", vc.ID, tpl, uType)
	return err
}

// Rename renames a VDC.
// * newName: The new name.
func (vc *VDCController) Rename(newName string) error {
	_, err := vc.c.Client.Call("one.vdc.rename", vc.ID, newName)
	return err
}

// AddGroup adds a group to the VDC
// * groupID: The group ID.
func (vc *VDCController) AddGroup(groupID int) error {
	_, err := vc.c.Client.Call("one.vdc.addgroup", vc.ID, int(groupID))
	return err
}

// DelGroup deletes a group from the VDC
// * groupID: The group ID.
func (vc *VDCController) DelGroup(groupID int) error {
	_, err := vc.c.Client.Call("one.vdc.delgroup", vc.ID, int(groupID))
	return err
}

// AddCluster adds a cluster to the VDC
// * zoneID: The Zone ID.
// * clusterID: The Cluster ID.
func (vc *VDCController) AddCluster(zoneID, clusterID int) error {
	_, err := vc.c.Client.Call("one.vdc.addcluster", vc.ID, int(zoneID), int(clusterID))
	return err
}

// DelCluster deletes a cluster from the VDC
// * zoneID: The Zone ID.
// * clusterID: The Cluster ID.
func (vc *VDCController) DelCluster(zoneID, clusterID int) error {
	_, err := vc.c.Client.Call("one.vdc.delcluster", vc.ID, int(zoneID), int(clusterID))
	return err
}

// AddHost adds a host to the VDC
// * zoneID: The Zone ID.
// * hostID: The Host ID.
func (vc *VDCController) AddHost(zoneID, hostID int) error {
	_, err := vc.c.Client.Call("one.vdc.addhost", vc.ID, int(zoneID), int(hostID))
	return err
}

// DelHost deletes a host from the VDC
// * zoneID: The Zone ID.
// * hostID: The Host ID.
func (vc *VDCController) DelHost(zoneID, hostID int) error {
	_, err := vc.c.Client.Call("one.vdc.delhost", vc.ID, int(zoneID), int(hostID))
	return err
}

// AddDatastore adds a datastore to the VDC
// * zoneID: The Zone ID.
// * dsID: The Datastore ID.
func (vc *VDCController) AddDatastore(zoneID, dsID int) error {
	_, err := vc.c.Client.Call("one.vdc.adddatastore", vc.ID, int(zoneID), int(dsID))
	return err
}

// DelDatastore deletes a datastore from the VDC
// * zoneID: The Zone ID.
// * dsID: The Datastore ID.
func (vc *VDCController) DelDatastore(zoneID, dsID int) error {
	_, err := vc.c.Client.Call("one.vdc.deldatastore", vc.ID, int(zoneID), int(dsID))
	return err
}

// AddVnet adds a vnet to the VDC
// * zoneID: The Zone ID.
// * vnetID: The Vnet ID.
func (vc *VDCController) AddVnet(zoneID, vnetID int) error {
	_, err := vc.c.Client.Call("one.vdc.addvnet", vc.ID, int(zoneID), int(vnetID))
	return err
}

// DelVnet deletes a vnet from the VDC
// * zoneID: The Zone ID.
// * vnetID: The Vnet ID.
func (vc *VDCController) DelVnet(zoneID, vnetID int) error {
	_, err := vc.c.Client.Call("one.vdc.delvnet", vc.ID, int(zoneID), int(vnetID))
	return err
}
