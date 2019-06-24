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

package cluster

import dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"

// Pool represents an OpenNebula Cluster pool
type Pool struct {
	Clusters []Cluster `xml:"CLUSTER"`
}

// Cluster represents an OpenNebula Cluster
type Cluster struct {
	ID           int      `xml:"ID"`
	Name         string   `xml:"NAME"`
	HostsID      []int    `xml:"HOSTS>ID"`
	DatastoresID []int    `xml:"DATASTORES>ID"`
	VnetsID      []int    `xml:"VNETS>ID"`
	Template     Template `xml:"TEMPLATE"`
}

type Template struct {
	// Example of reservation: https://github.com/OpenNebula/addon-storpool/blob/ba9dd3462b369440cf618c4396c266f02e50f36f/misc/reserved.sh
	ReservedMem string                 `xml:"RESERVED_MEM"`
	ReservedCPU string                 `xml:"RESERVED_CPU"`
	Dynamic     dyn.UnmatchedTagsSlice `xml:",any"`
}
