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
	"fmt"
)

// State is the state of an OpenNebula marketplace
type State int

const (
	Enabled State = iota
	Disabled
)

func (s State) isValid() bool {
	if s >= Enabled && s <= Disabled {
		return true
	}
	return false
}

func (s State) String() string {
	return [...]string{
		"ENABLED",
		"DISABLED",
	}[s]
}

// State looks up the state of the marketplace
func (app *MarketPlace) State() (State, error) {
	state := State(app.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Marketplace State: this state value is not currently handled: %d\n", app.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (app *MarketPlace) StateString() (string, error) {
	state := State(app.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Marketplace StateString: this state value is not currently handled: %d\n", app.StateRaw)
	}
	return state.String(), nil
}
