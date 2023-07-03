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

package shared

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
)

// SchedAction is a scheduled action on VM
type SchedAction struct {
	dyn.Vector
}

// SchedAction define keys for scheduled action
type SchedActionKeys string

const (
	SchedActionVec string = "SCHED_ACTION"

	ActionID SchedActionKeys = "ID"
	ParentID SchedActionKeys = "PARENT_ID"
	Action   SchedActionKeys = "ACTION"
	Time     SchedActionKeys = "TIME"
	Repeat   SchedActionKeys = "REPEAT"
	Days     SchedActionKeys = "DAYS"
	EndType  SchedActionKeys = "END_TYPE"
	EndValue SchedActionKeys = "END_VALUE"
	Done     SchedActionKeys = "DONE"
)

// AddSchedAction returns a Scheduled Action structure
func NewSchedAction() *SchedAction {
	return &SchedAction{
		dyn.Vector{XMLName: xml.Name{Local: SchedActionVec}},
	}
}

// Add adds a key, value pair to Scheduled Action
func (sa *SchedAction) Add(key SchedActionKeys, value interface{}) {
	sa.AddPair(string(key), value)
}

// ID returns the Scheduled Action ID as an integer
func (sa *SchedAction) ID() (int, error) {
	return sa.GetInt(string(ActionID))
}

// Get return the string value for Scheduled Action key
func (t *SchedAction) Get(key SchedActionKeys) (string, error) {
	return t.GetStr(string(key))
}

// GetI returns the integer value for a disk key
func (d *SchedAction) GetI(key SchedActionKeys) (int, error) {
	return d.GetInt(string(key))
}
