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

package virtualnetwork

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork/keys"
)

// Address Range template part

// AddressRange is a structure allowing to parse AddressRange templates. Common to VM and VRouter.
type AddressRange struct {
	dyn.Vector
}

// NewAddressRange returns a structure disk entity to build
func NewAddressRange() *AddressRange {
	return &AddressRange{
		dyn.Vector{XMLName: xml.Name{Local: keys.ARVec}},
	}
}

// ID returns the address range ID as an integer
func (n *AddressRange) ID() (int, error) {
	return n.GetInt(string(keys.ARID))
}

// Get returns the string value for an address range keys
func (n *AddressRange) Get(key keys.AddressRange) (string, error) {
	return n.GetStr(string(key))
}

// GetI returns the integer value for an address range key
func (n *AddressRange) GetI(key keys.AddressRange) (int, error) {
	return n.GetInt(string(key))
}

// Add adds an address range key, value pair.
func (n *AddressRange) Add(key keys.AddressRange, value interface{}) {
	n.AddPair(string(key), value)
}
