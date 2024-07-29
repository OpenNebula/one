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
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork/keys"
)

// Template is a virtual network template
type Template struct {
	dyn.Template
}

// NewTemplate returns a new virtual network Template object
func NewTemplate() *Template {
	return &Template{}
}

// Get returns the string value for a virtual network template
func (t *Template) Get(key keys.Template) (string, error) {
	return t.GetStr(string(key))
}

// GetI returns the integer value for an virtual network key
func (n *Template) GetI(key keys.Template) (int, error) {
	return n.GetInt(string(key))
}

// Add adds a virtual network template key, value pair.
func (t *Template) Add(key keys.Template, value interface{}) {
	t.AddPair(string(key), value)
}

// AddAR allow to add a AR to the template
func (t *Template) AddAddressRange() *AddressRange {
	ar := NewAddressRange()
	t.Elements = append(t.Elements, ar)
	return ar
}

// GetAR allow to retrieve ARs from template
func (t *Template) GetARs() []AddressRange {
	vecs := t.GetVectors(string(keys.ARVec))
	ars := make([]AddressRange, len(vecs))

	for i, v := range vecs {
		ars[i] = AddressRange{*v}
	}

	return ars
}
