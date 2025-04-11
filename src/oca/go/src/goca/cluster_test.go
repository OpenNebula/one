/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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
	"math/rand"
	"time"
	"strconv"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/cluster/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/errors"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork"
	. "gopkg.in/check.v1"
)

type ClusterSuite struct {
	clusterName string
	clusterID   int
}

var _ = Suite(&ClusterSuite{})

func (s *ClusterSuite) SetUpSuite(c *C) {
	rand.Seed(time.Now().UnixNano())
}

func (s *ClusterSuite) SetUpTest(c *C) {
	// Create Cluster
	s.clusterName = "cluster_test_go" + strconv.Itoa(rand.Intn(1000))

	id, err := testCtrl.Clusters().Create(s.clusterName)
	c.Assert(err, IsNil)
	s.clusterID = id
}

func (s *ClusterSuite) TearDownTest(c *C) {
	// Delete Cluster
	clusterC := testCtrl.Cluster(s.clusterID)
	err := clusterC.Delete()

	c.Assert(err, IsNil)
}

func (s *ClusterSuite) TestGetByNameAndID(c *C) {
	// Get Cluster by ID
	cluster, err := testCtrl.Cluster(s.clusterID).Info()

	c.Assert(err, IsNil)
	c.Assert(cluster.ID, Equals, s.clusterID)
	c.Assert(cluster.Name, Equals, s.clusterName)

	// Test value from Cluster template
	reservedCPU, err := cluster.Template.Get(keys.ReservedCPU)

	c.Assert(err, IsNil)
	c.Assert(reservedCPU, Equals, "")

	// Get Cluster by Name
	id, err := testCtrl.Clusters().ByName(s.clusterName)
	c.Assert(err, IsNil)
	c.Assert(id, Equals, s.clusterID)
}

func (s *ClusterSuite) TestUpdate(c *C) {
	clusterC := testCtrl.Cluster(s.clusterID)
	err := clusterC.Update(`ATT1 = "VAL1"`, parameters.Merge)

	c.Assert(err, IsNil)

	cluster, err := testCtrl.Cluster(s.clusterID).Info()
	c.Assert(err, IsNil)

	att, err := cluster.Template.Get("ATT1")

	c.Assert(err, IsNil)
	c.Assert(att, Equals, "VAL1")
}

func (s *ClusterSuite) TestRename(c *C) {
	name := "new_name" + strconv.Itoa(rand.Intn(1000))
	clusterC := testCtrl.Cluster(s.clusterID)
	clusterC.Rename(name)

	cluster, err := testCtrl.Cluster(s.clusterID).Info()
	c.Assert(err, IsNil)
	c.Assert(cluster.Name, Equals, name);
}

// Test add Host to Cluster
func (s *ClusterSuite) TestAddDelHost(c *C) {
	// Create Host
	hostID, err := testCtrl.Hosts().Create(
		"dummy-cluster-test" + strconv.Itoa(rand.Intn(1000)),
		"dummy",
		"dummy",
		0)
	c.Assert(err, IsNil)

	// Add Host to Cluster
	clusterC := testCtrl.Cluster(s.clusterID)
	err = clusterC.AddHost(hostID)
	c.Assert(err, IsNil)

	// Get Cluster and check if Host was added to Cluster
	cluster, err := testCtrl.Cluster(s.clusterID).Info()
	c.Assert(err, IsNil)
	c.Assert(len(cluster.Hosts.ID), Equals, 1)
	c.Assert(cluster.Hosts.ID[0], Equals, hostID)

	// Delete Host from Cluster
	err = clusterC.DelHost(hostID)
	c.Assert(err, IsNil)

	// Check if Host was added to Cluster
	cluster, err = testCtrl.Cluster(s.clusterID).Info()
	c.Assert(err, IsNil)
	c.Assert(len(cluster.Hosts.ID), Equals, 0)

	// Delete Host
	err = testCtrl.Host(hostID).Delete()
	c.Assert(err, IsNil)
}

// Test add Datastore to Cluster
func (s *ClusterSuite) TestAddDelDatastore(c *C) {
	// Create Datastore
	dsTmpl := "NAME = go_cluster_ds" + strconv.Itoa(rand.Intn(1000)) + "\n" +
		"DS_MAD = dummy\n" +
		"TM_MAD = dummy\n" +
		"TYPE = BACKUP_DS\n"

	dsID, err := testCtrl.Datastores().Create(dsTmpl, -1)
	c.Assert(err, IsNil)

	// Add Datastore to Cluster
	clusterC := testCtrl.Cluster(s.clusterID)
	err = clusterC.AddDatastore(dsID)
	c.Assert(err, IsNil)

	// Get Cluster and check if Datastore was added to Cluster
	cluster, err := testCtrl.Cluster(s.clusterID).Info()
	c.Assert(err, IsNil)
	c.Assert(len(cluster.Datastores.ID), Equals, 1)
	c.Assert(cluster.Datastores.ID[0], Equals, dsID)

	// Delete Datastore from Cluster
	err = clusterC.DelDatastore(dsID)
	c.Assert(err, IsNil)

	// Check if Datastore was added to Cluster
	cluster, err = testCtrl.Cluster(s.clusterID).Info()
	c.Assert(err, IsNil)
	c.Assert(len(cluster.Datastores.ID), Equals, 0)

	// Delete Datastore
	err = testCtrl.Datastore(dsID).Delete()
	c.Assert(err, IsNil)
}

// Test add Virtual Network to Cluster
func (s *ClusterSuite) TestAddDelVnet(c *C) {
	// Create Virtual Network
	vnTmpl := "NAME = go_cluster_vn" + strconv.Itoa(rand.Intn(1000)) + "\n" +
		"BRIDGE = vbr0\n" +
		"VN_MAD = dummy\n"

	vnID, err := testCtrl.VirtualNetworks().Create(vnTmpl, -1)
	c.Assert(err, IsNil)

	// Add Network to Cluster
	clusterC := testCtrl.Cluster(s.clusterID)
	err = clusterC.AddVnet(vnID)
	c.Assert(err, IsNil)

	// Get Cluster and check if Network was added to Cluster
	cluster, err := testCtrl.Cluster(s.clusterID).Info()
	c.Assert(err, IsNil)
	c.Assert(len(cluster.Vnets.ID), Equals, 1)
	c.Assert(cluster.Vnets.ID[0], Equals, vnID)

	// Delete Network from Cluster
	err = clusterC.DelVnet(vnID)
	c.Assert(err, IsNil)

	// Check if Network was added to Cluster
	cluster, err = testCtrl.Cluster(s.clusterID).Info()
	c.Assert(err, IsNil)
	c.Assert(len(cluster.Vnets.ID), Equals, 0)

	WaitResource(func() bool {
		vnet, _ := testCtrl.VirtualNetwork(vnID).Info(false)

		state, _ := vnet.State()

		return state == virtualnetwork.Ready
	})

	// Delete Network
	err = testCtrl.VirtualNetwork(vnID).Delete()
	c.Assert(err, IsNil)
}

// Test optimization plan api
func (s *ClusterSuite) TestPlanApi(c *C) {
	// Create Optimization Plan
	clusterC := testCtrl.Cluster(s.clusterID)

	err := clusterC.Optimize()
	c.Assert(err, IsNil)

	// Execute Optimization Plan - we don't have any optimization plan
	// Just test the API call exists
	err = clusterC.PlanExecute()
	c.Assert(err, NotNil)
	oneErr, _ := err.(*errors.ResponseError);
	c.Assert(int(oneErr.Code), Equals, errors.OneActionError)

	// Delete Optimization Plan - we don't have any optimization plan
	// Just test the API call exists
	err = clusterC.PlanDelete()
	c.Assert(err, NotNil)
	oneErr, _ = err.(*errors.ResponseError);
	c.Assert(int(oneErr.Code), Equals, errors.OneActionError)
}