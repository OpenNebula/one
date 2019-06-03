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

// VDCsController is a controller for a pool of VDCs
type VDCsController entitiesController

// VDCController is a controller for VDC entities
type VDCController entityController

// VDCPool represents an OpenNebula VDCPool
type VDCPool struct {
	VDCs []VDC `xml:"VDC"`
}

// VDC represents an OpenNebula VDC
type VDC struct {
	ID         uint           `xml:"ID"`
	Name       string         `xml:"NAME"`
	GroupsID   []int          `xml:"GROUPS>ID"`
	Clusters   []VDCCluster   `xml:"CLUSTERS>CLUSTER"`
	Hosts      []VDCHost      `xml:"HOSTS>HOST"`
	Datastores []VDCDatastore `xml:"DATASTORES>DATASTORE"`
	VNets      []VDCVNet      `xml:"VNETS>VNET"`
	Template   vdcTemplate    `xml:"TEMPLATE"`
}

type vdcTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

type VDCCluster struct {
	ZoneID    int `xml:"ZONE_ID"`
	ClusterID int `xml:"CLUSTER_ID"`
}

type VDCHost struct {
	ZoneID int `xml:"ZONE_ID"`
	HostID int `xml:"HOST_ID"`
}

type VDCDatastore struct {
	ZoneID      int `xml:"ZONE_ID"`
	DatastoreID int `xml:"DATASTORE_ID"`
}

type VDCVNet struct {
	ZoneID int `xml:"ZONE_ID"`
	VnetID int `xml:"VNET_ID"`
}

// VDCs returns a VDCs controller.
func (c *Controller) VDCs() *VDCsController {
	return &VDCsController{c}
}

// VDC returns a VDC controller
func (c *Controller) VDC(id uint) *VDCController {
	return &VDCController{c, id}
}

// ByName returns a VDC ID from name
func (c *VDCsController) ByName(name string) (uint, error) {
	var id uint

	vdcPool, err := c.Info()
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(vdcPool.VDCs); i++ {
		if vdcPool.VDCs[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = vdcPool.VDCs[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a vdc pool. A connection to OpenNebula is
// performed.
func (vc *VDCsController) Info() (*VDCPool, error) {
	response, err := vc.c.Client.Call("one.vdcpool.info")
	if err != nil {
		return nil, err
	}

	vdcPool := &VDCPool{}
	err = xml.Unmarshal([]byte(response.Body()), vdcPool)
	if err != nil {
		return nil, err
	}

	return vdcPool, nil
}

// Info retrieves information for the VDC.
func (vc *VDCController) Info() (*VDC, error) {
	response, err := vc.c.Client.Call("one.vdc.info", vc.ID)
	if err != nil {
		return nil, err
	}
	vdc := &VDC{}
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
func (vc *VDCsController) Create(tpl string, clusterID int) (uint, error) {
	response, err := vc.c.Client.Call("one.vdc.allocate", tpl, clusterID)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given VDC from the pool.
func (vc *VDCController) Delete() error {
	_, err := vc.c.Client.Call("one.vdc.delete", vc.ID)
	return err
}

// Update replaces the VDC template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (vc *VDCController) Update(tpl string, appendTemplate int) error {
	_, err := vc.c.Client.Call("one.vdc.update", vc.ID, tpl, appendTemplate)
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
func (vc *VDCController) AddGroup(groupID uint) error {
	_, err := vc.c.Client.Call("one.vdc.addgroup", vc.ID, int(groupID))
	return err
}

// DelGroup deletes a group from the VDC
// * groupID: The group ID.
func (vc *VDCController) DelGroup(groupID uint) error {
	_, err := vc.c.Client.Call("one.vdc.delgroup", vc.ID, int(groupID))
	return err
}

// AddCluster adds a cluster to the VDC
// * zoneID: The Zone ID.
// * clusterID: The Cluster ID.
func (vc *VDCController) AddCluster(zoneID, clusterID uint) error {
	_, err := vc.c.Client.Call("one.vdc.addcluster", vc.ID, int(zoneID), int(clusterID))
	return err
}

// DelCluster deletes a cluster from the VDC
// * zoneID: The Zone ID.
// * clusterID: The Cluster ID.
func (vc *VDCController) DelCluster(zoneID, clusterID uint) error {
	_, err := vc.c.Client.Call("one.vdc.delcluster", vc.ID, int(zoneID), int(clusterID))
	return err
}

// AddHost adds a host to the VDC
// * zoneID: The Zone ID.
// * hostID: The Host ID.
func (vc *VDCController) AddHost(zoneID, hostID uint) error {
	_, err := vc.c.Client.Call("one.vdc.addhost", vc.ID, int(zoneID), int(hostID))
	return err
}

// DelHost deletes a host from the VDC
// * zoneID: The Zone ID.
// * hostID: The Host ID.
func (vc *VDCController) DelHost(zoneID, hostID uint) error {
	_, err := vc.c.Client.Call("one.vdc.delhost", vc.ID, int(zoneID), int(hostID))
	return err
}

// AddDatastore adds a datastore to the VDC
// * zoneID: The Zone ID.
// * dsID: The Datastore ID.
func (vc *VDCController) AddDatastore(zoneID, dsID uint) error {
	_, err := vc.c.Client.Call("one.vdc.adddatastore", vc.ID, int(zoneID), int(dsID))
	return err
}

// DelDatastore deletes a datastore from the VDC
// * zoneID: The Zone ID.
// * dsID: The Datastore ID.
func (vc *VDCController) DelDatastore(zoneID, dsID uint) error {
	_, err := vc.c.Client.Call("one.vdc.deldatastore", vc.ID, int(zoneID), int(dsID))
	return err
}

// AddVnet adds a vnet to the VDC
// * zoneID: The Zone ID.
// * vnetID: The Vnet ID.
func (vc *VDCController) AddVnet(zoneID, vnetID uint) error {
	_, err := vc.c.Client.Call("one.vdc.addvnet", vc.ID, int(zoneID), int(vnetID))
	return err
}

// DelVnet deletes a vnet from the VDC
// * zoneID: The Zone ID.
// * vnetID: The Vnet ID.
func (vc *VDCController) DelVnet(zoneID, vnetID uint) error {
	_, err := vc.c.Client.Call("one.vdc.delvnet", vc.ID, int(zoneID), int(vnetID))
	return err
}
