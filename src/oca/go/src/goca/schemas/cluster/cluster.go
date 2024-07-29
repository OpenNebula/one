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

package cluster

import (
	"encoding/xml"

	shared "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Cluster pool
type Pool struct {
	XMLName  xml.Name  `xml:"CLUSTER_POOL"`
	Clusters []Cluster `xml:"CLUSTER"`
}

// Cluster represents an OpenNebula Cluster
type Cluster struct {
	XMLName    xml.Name          `xml:"CLUSTER"`
	ID         int               `xml:"ID,omitempty"`
	Name       string            `xml:"NAME"`
	Hosts      shared.EntitiesID `xml:"HOSTS,omitempty"`
	Datastores shared.EntitiesID `xml:"DATASTORES,omitempty"`
	Vnets      shared.EntitiesID `xml:"VNETS,omitempty"`
	Template   Template          `xml:"TEMPLATE,omitempty"`
}
