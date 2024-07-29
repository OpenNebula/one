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

package virtualrouter

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualrouter/keys"
)

// Template is a virtual router template
type Template struct {
	dyn.Template
}

// NewTemplate returns a new virtual router Template object
func NewTemplate() *Template {
	tpl := &Template{}

	tpl.Add(keys.VRouter, "YES")

	return tpl
}

// Get returns the string value for a virtual router template
func (t *Template) Get(key keys.Template) (string, error) {
	return t.GetStr(string(key))
}

// GetI returns the integer value for an virtual router key
func (n *Template) GetI(key keys.Template) (int, error) {
	return n.GetInt(string(key))
}

// Add adds a virtual router template key, value pair
func (t *Template) Add(key keys.Template, value interface{}) {
	t.AddPair(string(key), value)
}

// AddNIC allow to add a NIC to the template
func (t *Template) AddNIC() *shared.NIC {
	nic := shared.NewNIC()
	t.Elements = append(t.Elements, nic)
	return nic
}

// GetNICs allow to get NICs from Template
func (t *Template) GetNICs() []shared.NIC {

	vecs := t.GetVectors(string(shared.NICVec))
	nics := make([]shared.NIC, len(vecs))

	for i, v := range vecs {
		nics[i] = shared.NIC{*v}
	}

	return nics
}
