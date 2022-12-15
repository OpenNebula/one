/* -------------------------------------------------------------------------- */
/* Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                */
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
	"fmt"

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
	StateRaw             int                 `xml:"STATE,omitempty"`
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
	ARs  []AddressRange `xml:"AR_POOL>AR,omitempty"`
	Lock *shared.Lock   `xml:"LOCK,omitempty"`
}

// State is the state of the Virtual Network
type State int

const (
	// Init Virtual Network is being initialized
	Init State = iota

	// Ready Virtual Network is ready to be used
	Ready

	// LockCreate Virtual Network driver vnet_create pending
	LockCreate

	// LockDelete Virtual Network driver vnet_delete pending
	LockDelete

	// Done Virtual Netowrk finalized
	Done

	// Error Virtual Network is in error state
	Error
)

func (s State) isValid() bool {
	if s >= Init && s <= Error {
		return true
	}
	return false
}

// String returns the string version of the State
func (s State) String() string {
	return [...]string{
		"INIT",
		"READY",
		"LOCK_CREATE",
		"LOCK_DELETE",
		"DONE",
		"ERROR",
	}[s]
}

// State looks up the state of the Virtual Network and returns the State
func (vn *VirtualNetwork) State() (State, error) {
	state := State(vn.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Virtual Network State: this state value is not currently handled: %d\n", vn.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (vn *VirtualNetwork) StateString() (string, error) {
	state := State(vn.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Virtual Network State: this state value is not currently handled: %d\n", vn.StateRaw)
	}
	return state.String(), nil
}