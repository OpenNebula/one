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

package securitygroup

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/securitygroup/keys"
)

// Rule is a security group rule vector
type Rule struct {
	dyn.Vector
}

// NewRule returns a security group rule vector
func NewRule() *Rule {
	return &Rule{
		dyn.Vector{XMLName: xml.Name{Local: string(keys.RuleVec)}},
	}
}

// Get return the string value of a security group rule template key
func (t *Rule) Get(key keys.Rule) (string, error) {
	return t.GetStr(string(key))
}

// Add adds a security group rule template key, value pair
func (t *Rule) Add(key keys.Rule, value interface{}) {
	t.AddPair(string(key), value)
}
