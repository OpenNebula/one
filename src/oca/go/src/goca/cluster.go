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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/cluster"
)

// ClustersController is a controller for Clusters
type ClustersController entitiesController

// ClusterController is a controller for Cluster entity
type ClusterController entityController

// Clusters returns a Clusters controller.
func (c *Controller) Clusters() *ClustersController {
	return &ClustersController{c}
}

// Cluster returns a Cluster controller.
func (c *Controller) Cluster(id int) *ClusterController {
	return &ClusterController{c, id}
}

// ByName returns a Cluster ID from name
func (c *ClustersController) ByName(name string) (int, error) {
	var id int

	clusterPool, err := c.Info(false)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(clusterPool.Clusters); i++ {
		if clusterPool.Clusters[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = clusterPool.Clusters[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a cluster pool. A connection to OpenNebula is
// performed.
func (cc *ClustersController) Info(decrypt bool) (*cluster.Pool, error) {
	response, err := cc.c.Client.Call("one.clusterpool.info", decrypt)
	if err != nil {
		return nil, err
	}

	clusterPool := &cluster.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), clusterPool)
	if err != nil {
		return nil, err
	}

	return clusterPool, nil
}

// Info retrieves information for the cluster.
func (cc *ClusterController) Info() (*cluster.Cluster, error) {
	response, err := cc.c.Client.Call("one.cluster.info", cc.ID)
	if err != nil {
		return nil, err
	}
	cluster := &cluster.Cluster{}
	err = xml.Unmarshal([]byte(response.Body()), cluster)
	if err != nil {
		return nil, err
	}
	return cluster, nil
}

// Create allocates a new cluster. It returns the new cluster ID.
func (cc *ClustersController) Create(name string) (int, error) {
	response, err := cc.c.Client.Call("one.cluster.allocate", name)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given cluster from the pool.
func (cc *ClusterController) Delete() error {
	_, err := cc.c.Client.Call("one.cluster.delete", cc.ID)
	return err
}

// Update adds cluster content.
// * tpl: The new cluster contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (cc *ClusterController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := cc.c.Client.Call("one.cluster.update", cc.ID, tpl, uType)
	return err
}

// AddHost adds a host to the given cluster.
// * hostID: The host ID.
func (cc *ClusterController) AddHost(hostID int) error {
	_, err := cc.c.Client.Call("one.cluster.addhost", cc.ID, int(hostID))
	return err
}

// DelHost removes a host from the given cluster.
// * hostID: The host ID.
func (cc *ClusterController) DelHost(hostID int) error {
	_, err := cc.c.Client.Call("one.cluster.delhost", cc.ID, int(hostID))
	return err
}

// AddDatastore adds a datastore to the given cluster.
// * dsID: The datastore ID.
func (cc *ClusterController) AddDatastore(dsID int) error {
	_, err := cc.c.Client.Call("one.cluster.adddatastore", cc.ID, int(dsID))
	return err
}

// DelDatastore removes a datastore from the given cluster.
// * dsID: The datastore ID.
func (cc *ClusterController) DelDatastore(dsID int) error {
	_, err := cc.c.Client.Call("one.cluster.deldatastore", cc.ID, int(dsID))
	return err
}

// AddVnet adds a vnet to the given cluster.
// * vnetID: The vnet ID.
func (cc *ClusterController) AddVnet(vnetID int) error {
	_, err := cc.c.Client.Call("one.cluster.addvnet", cc.ID, int(vnetID))
	return err
}

// DelVnet removes a vnet from the given cluster.
// * vnetID: The vnet ID.
func (cc *ClusterController) DelVnet(vnetID int) error {
	_, err := cc.c.Client.Call("one.cluster.delvnet", cc.ID, int(vnetID))
	return err
}

// Rename renames a cluster.
// * newName: The new name.
func (cc *ClusterController) Rename(newName string) error {
	_, err := cc.c.Client.Call("one.cluster.rename", cc.ID, newName)
	return err
}
