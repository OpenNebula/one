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
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula VirtualNetwork pool
type Pool struct {
	VirtualNetworks []VirtualNetwork `xml:"VNET"`
}

// VirtualNetwork represents an OpenNebula VirtualNetwork
type VirtualNetwork struct {
	ID                   int                 `xml:"ID"`
	UID                  int                 `xml:"UID"`
	GID                  int                 `xml:"GID"`
	UName                string              `xml:"UNAME"`
	GName                string              `xml:"GNAME"`
	Name                 string              `xml:"NAME"`
	Permissions          *shared.Permissions `xml:"PERMISSIONS"`
	ClustersID           []int               `xml:"CLUSTERS>ID"`
	Bridge               string              `xml:"BRIDGE"`
	BridgeType           string              `xml:"BRIDGE_TYPE"` // minOccurs=0
	ParentNetworkID      string              `xml:"PARENT_NETWORK_ID"`
	VNMad                string              `xml:"VN_MAD"`
	PhyDev               string              `xml:"PHYDEV"`
	VlanID               string              `xml:"VLAN_ID"`       // minOccurs=0
	OuterVlanID          string              `xml:"OUTER_VLAN_ID"` // minOccurs=0
	VlanIDAutomatic      string              `xml:"VLAN_ID_AUTOMATIC"`
	OuterVlanIDAutomatic string              `xml:"OUTER_VLAN_ID_AUTOMATIC"`
	UsedLeases           int                 `xml:"USED_LEASES"`
	VRoutersID           []int               `xml:"VROUTERS>ID"`
	Template             Template            `xml:"TEMPLATE"`

	// Variable parts between one.vnpool.info and one.vn.info
	ARs  []AR         `xml:"AR_POOL>AR"`
	Lock *shared.Lock `xml:"LOCK"`
}

type Template struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type AR struct {
	ID                string  `xml:"AR_ID"`
	GlobalPrefix      string  `xml:"GLOBAL_PREFIX"` // minOccurs=0
	IP                string  `xml:"IP"`            // minOccurs=0
	MAC               string  `xml:"MAC"`
	ParentNetworkARID string  `xml:"PARENT_NETWORK_AR_ID"` // minOccurs=0
	Size              int     `xml:"SIZE"`
	Type              string  `xml:"TYPE"`
	ULAPrefix         string  `xml:"ULA_PREFIX"` // minOccurs=0
	VNMAD             string  `xml:"VN_MAD"`     // minOccurs=0
	MACEnd            string  `xml:"MAC_END"`
	IPEnd             string  `xml:"IP_END"`
	IP6ULA            string  `xml:"IP6_ULA"`
	IP6ULAEnd         string  `xml:"IP6_ULA_END"`
	IP6Global         string  `xml:"IP6_GLOBAL"`
	IP6GlobalEnd      string  `xml:"IP6_GLOBAL_END"`
	IP6               string  `xml:"IP6"`
	IP6End            string  `xml:"IP6_END"`
	UsedLeases        string  `xml:"USED_LEASES"`
	Leases            []Lease `xml:"LEASES>LEASE"`

	// Not filled with Info
	Allocated string `xml:ALLOCATED`
}

type Lease struct {
	IP        string `xml:"IP"`
	IP6       string `xml:"IP6"`
	IP6Global string `xml:"IP6GLOBAL"`
	IP6Link   string `xml:"IP6LINK"`
	IP6ULA    string `xml:"IP6ULA"`
	MAC       string `xml:"MAC"`
	VM        int    `xml:"VM"`
	VNet      int    `xml:"VNET"`
	VRouter   int    `xml:"VROUTER"`
}
