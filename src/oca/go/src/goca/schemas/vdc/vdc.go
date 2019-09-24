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

package vdc

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
)

// Pool represents an OpenNebula Vdc pool
type Pool struct {
	VDCs []VDC `xml:"VDC"`
}

// VDC represents an OpenNebula Vdc
type VDC struct {
	ID         int         `xml:"ID"`
	Name       string      `xml:"NAME"`
	GroupsID   []int       `xml:"GROUPS>ID"`
	Clusters   []Cluster   `xml:"CLUSTERS>CLUSTER"`
	Hosts      []Host      `xml:"HOSTS>HOST"`
	Datastores []Datastore `xml:"DATASTORES>DATASTORE"`
	VNets      []VNet      `xml:"VNETS>VNET"`
	Template   Template    `xml:"TEMPLATE"`
}

type Template struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type Cluster struct {
	ZoneID    int `xml:"ZONE_ID"`
	ClusterID int `xml:"CLUSTER_ID"`
}

type Host struct {
	ZoneID int `xml:"ZONE_ID"`
	HostID int `xml:"HOST_ID"`
}

type Datastore struct {
	ZoneID      int `xml:"ZONE_ID"`
	DatastoreID int `xml:"DATASTORE_ID"`
}

type VNet struct {
	ZoneID int `xml:"ZONE_ID"`
	VnetID int `xml:"VNET_ID"`
}
