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

package marketplace

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace/keys"
)

// Template is the dynamic part of the marketplace entity
type Template struct {
	dyn.Template
}

// NewTemplate returns a marketplace template
func NewTemplate() *Template {
	return &Template{
		dyn.Template{},
	}
}

// Get return the string value of a template marketplace key
func (t *Template) Get(key keys.Template) (string, error) {
	return t.GetStr(string(key))
}

// GetI returns the integer value for a marketplace template key
func (n *Template) GetI(key keys.Template) (int, error) {
	return n.GetInt(string(key))
}

// Add adds a marketplace Template key, value pair
func (t *Template) Add(key keys.Template, value interface{}) {
	t.AddPair(string(key), value)
}
