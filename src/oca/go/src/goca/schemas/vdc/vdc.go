/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Vdc pool
type Pool struct {
	XMLName xml.Name `xml:"VDC_POOL"`
	VDCs    []VDC    `xml:"VDC"`
}

// VDC represents an OpenNebula Vdc
type VDC struct {
	XMLName    xml.Name          `xml:"VDC"`
	ID         int               `xml:"ID,omitempty"`
	Name       string            `xml:"NAME"`
	Groups     shared.EntitiesID `xml:"GROUPS,omitempty"`
	Clusters   []Cluster         `xml:"CLUSTERS>CLUSTER,omitempty"`
	Hosts      []Host            `xml:"HOSTS>HOST,omitempty"`
	Datastores []Datastore       `xml:"DATASTORES>DATASTORE,omitempty"`
	VNets      []VNet            `xml:"VNETS>VNET,omitempty"`
	Template   Template          `xml:"TEMPLATE"`
}

type Template struct {
	dyn.Template
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
