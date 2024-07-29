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

package host

import (
	"fmt"
)

// HostState is the state of an OpenNebula Host
type State int

const (
	// Init host is in the initial state when enabled
	Init = iota

	// MonitoringMonitored host is being monitored (from monitored state)
	MonitoringMonitored

	// Monitored host has been successfully monitored
	Monitored

	// Error host has encountered an error ocurred while monitoring
	Error

	// Disabled host is disabled
	Disabled

	// MonitoringError host is being monitored (from error state)
	MonitoringError

	// MonitoringInit host is being monitored (from init state)
	MonitoringInit

	// MonitoringDisabled host is being monitored (from disabled state)
	MonitoringDisabled

	// Offline host is totally offline
	Offline
)

func (s State) isValid() bool {
	if s >= Init && s <= Offline {
		return true
	}
	return false
}

func (s State) String() string {
	return [...]string{
		"INIT",
		"MONITORING_MONITORED",
		"MONITORED",
		"ERROR",
		"DISABLED",
		"MONITORING_ERROR",
		"MONITORING_INIT",
		"MONITORING_DISABLED",
		"OFFLINE",
	}[s]
}

// State looks up the state of the image and returns the ImageState
func (host *Host) State() (State, error) {
	state := State(host.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Host State: this state value is not currently handled: %d\n", host.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (host *Host) StateString() (string, error) {
	state := State(host.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Host StateString: this state value is not currently handled: %d\n", host.StateRaw)
	}
	return state.String(), nil
}
