/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

package marketplaceapp

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplaceapp/keys"
)

// Types is a type used to enumerate marketplace app types
type Types string

const (
	// Virtual Machine disks
	Datablock Types = "DATABLOCK"
	Image     Types = "IMAGE"
)

// Template is the dynamic part of the marketplace app entity
type Template struct {
	dyn.Template
}

// NewTemplate returns a marketplace app template
func NewTemplate() *Template {
	return &Template{
		dyn.Template{},
	}
}

// Get return the string value of a template marketplace app key
func (t *Template) Get(key keys.Template) (string, error) {
	return t.GetStr(string(key))
}

// GetI returns the integer value for a marketplace app template key
func (n *Template) GetI(key keys.Template) (int, error) {
	return n.GetInt(string(key))
}

// Add adds a marketplace app template key, value pair
func (t *Template) Add(key keys.Template, value interface{}) {
	t.AddPair(string(key), value)
}

// SetType set a Datastore type
func (t *Template) SetType(typ Types) {

	pair, err := t.GetPair(string(keys.Type))
	if err != nil {
		t.AddPair(string(keys.Type), string(typ))
	} else {
		pair.Value = string(typ)
	}
}
