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

package virtualnetwork

import (
	"encoding/xml"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula VirtualNetwork pool
type Pool struct {
	XMLName         xml.Name         `xml:"VNET_POOL"`
	VirtualNetworks []VirtualNetwork `xml:"VNET"`
}

// VirtualNetwork represents an OpenNebula VirtualNetwork
type VirtualNetwork struct {
	XMLName              xml.Name            `xml:"VNET"`
	ID                   int                 `xml:"ID,omitempty"`
	UID                  int                 `xml:"UID,omitempty"`
	GID                  int                 `xml:"GID,omitempty"`
	UName                string              `xml:"UNAME,omitempty"`
	GName                string              `xml:"GNAME,omitempty"`
	Name                 string              `xml:"NAME"`
	Permissions          *shared.Permissions `xml:"PERMISSIONS,omitempty"`
	Clusters             shared.EntitiesID   `xml:"CLUSTERS,omitempty"`
	Bridge               string              `xml:"BRIDGE,omitempty"`
	BridgeType           string              `xml:"BRIDGE_TYPE,omitempty"` // minOccurs=0
	ParentNetworkID      string              `xml:"PARENT_NETWORK_ID,omitempty"`
	VNMad                string              `xml:"VN_MAD"`
	PhyDev               string              `xml:"PHYDEV,omitempty"`
	VlanID               string              `xml:"VLAN_ID,omitempty"`       // minOccurs=0
	OuterVlanID          string              `xml:"OUTER_VLAN_ID,omitempty"` // minOccurs=0
	VlanIDAutomatic      string              `xml:"VLAN_ID_AUTOMATIC,omitempty,omitempty"`
	OuterVlanIDAutomatic string              `xml:"OUTER_VLAN_ID_AUTOMATIC,omitempty"`
	UsedLeases           int                 `xml:"USED_LEASES,omitempty"`
	VRouters             shared.EntitiesID   `xml:"VROUTERS,omitempty"`
	Template             Template            `xml:"TEMPLATE"`

	// Variable parts between one.vnpool.info and one.vn.info
	ARs  []AR         `xml:"AR_POOL>AR,omitempty"`
	Lock *shared.Lock `xml:"LOCK,omitempty"`
}

type AR struct {
	ID                string  `xml:"AR_ID,omitempty"`
	GlobalPrefix      string  `xml:"GLOBAL_PREFIX,omitempty"` // minOccurs=0
	IP                string  `xml:"IP"`                      // minOccurs=0
	MAC               string  `xml:"MAC,omitempty"`
	ParentNetworkARID string  `xml:"PARENT_NETWORK_AR_ID,omitempty"` // minOccurs=0
	Size              int     `xml:"SIZE"`
	Type              string  `xml:"TYPE"`
	ULAPrefix         string  `xml:"ULA_PREFIX,omitempty"` // minOccurs=0
	VNMAD             string  `xml:"VN_MAD,omitempty"`     // minOccurs=0
	MACEnd            string  `xml:"MAC_END,omitempty"`
	IPEnd             string  `xml:"IP_END,omitempty"`
	IP6ULA            string  `xml:"IP6_ULA,omitempty"`
	IP6ULAEnd         string  `xml:"IP6_ULA_END,omitempty"`
	IP6Global         string  `xml:"IP6_GLOBAL,omitempty"`
	IP6GlobalEnd      string  `xml:"IP6_GLOBAL_END,omitempty"`
	IP6               string  `xml:"IP6,omitempty"`
	IP6End            string  `xml:"IP6_END,omitempty"`
	UsedLeases        string  `xml:"USED_LEASES,omitempty"`
	Leases            []Lease `xml:"LEASES>LEASE,omitempty"`

	// Not filled with Info
	Allocated string `xml:"ALLOCATED"`
}

type Lease struct {
	IP        string `xml:"IP,omitempty"`
	IP6       string `xml:"IP6,omitempty"`
	IP6Global string `xml:"IP6GLOBAL,omitempty"`
	IP6Link   string `xml:"IP6LINK,omitempty"`
	IP6ULA    string `xml:"IP6ULA,omitempty"`
	MAC       string `xml:"MAC,omitempty"`
	VM        int    `xml:"VM,omitempty"`
	VNet      int    `xml:"VNET,omitempty"`
	VRouter   int    `xml:"VROUTER,omitempty"`
}
