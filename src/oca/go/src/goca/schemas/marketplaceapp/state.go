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

package marketplaceapp

import (
	"fmt"
)

// State is the state of an OpenNebula marketplace
type State int

const (
	Init State = iota
	Ready
	Locked
	Error
	Disabled
)

func (s State) isValid() bool {
	if s >= Init && s <= Disabled {
		return true
	}
	return false
}

func (s State) String() string {
	return [...]string{
		"INIT",
		"READY",
		"LOCKED",
		"ERROR",
		"DISABLED",
	}[s]
}

// State looks up the state of the marketplace appliance
func (app *MarketPlaceApp) State() (State, error) {
	state := State(app.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Marketplace appliance State: this state value is not currently handled: %d\n", app.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (app *MarketPlaceApp) StateString() (string, error) {
	state := State(app.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Marketplace appliance StateString: this state value is not currently handled: %d\n", app.StateRaw)
	}
	return state.String(), nil
}
