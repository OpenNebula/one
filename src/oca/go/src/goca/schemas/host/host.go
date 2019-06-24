/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
)

// Pool represents an OpenNebula Host pool
type Pool struct {
	Hosts []Host `xml:"HOST"`
}

// Host represents an OpenNebula Host
type Host struct {
	ID          int      `xml:"ID"`
	Name        string   `xml:"NAME"`
	StateRaw    int      `xml:"STATE"`
	IMMAD       string   `xml:"IM_MAD"`
	VMMAD       string   `xml:"VM_MAD"`
	LastMonTime int      `xml:"LAST_MON_TIME"`
	ClusterID   int      `xml:"CLUSTER_ID"`
	Cluster     string   `xml:"CLUSTER"`
	Share       Share    `xml:"HOST_SHARE"`
	VMsID       []int    `xml:"VMS>ID"`
	Template    Template `xml:"TEMPLATE"`
}

type Share struct {
	DiskUsage int `xml:"DISK_USAGE"`
	MemUsage  int `xml:"MEM_USAGE"`
	CPUUsage  int `xml:"CPU_USAGE"`
	TotalMem  int `xml:"TOTAL_MEM"`
	TotalCPU  int `xml:"TOTAL_CPU"`

	MaxDisk int `xml:"MAX_DISK"`
	MaxMem  int `xml:"MAX_MEM"`
	MaxCPU  int `xml:"MAX_CPU"`

	FreeDisk int `xml:"FREE_DISK"`
	FreeMem  int `xml:"FREE_MEM"`
	FreeCPU  int `xml:"FREE_CPU"`

	UsedDisk int `xml:"USED_DISK"`
	UsedMem  int `xml:"USED_MEM"`
	UsedCPU  int `xml:"USED_CPU"`

	RunningVMs int         `xml:"RUNNING_VMS"`
	Stores     []DS        `xml:"DATASTORES>DS"`
	PCIDevices interface{} `xml:"PCI_DEVICES>PCI"`
}

type DS struct {
	ID      int `xml:"ID"`
	UsedMB  int `xml:"USED_MB"`
	FreeMB  int `xml:"FREE_MB"`
	TotalMB int `xml:"TOTAL_MB"`
}

type Template struct {
	// Example of reservation: https://github.com/OpenNebula/addon-storpool/blob/ba9dd3462b369440cf618c4396c266f02e50f36f/misc/reserved.sh
	ReservedMem int                    `xml:"RESERVED_MEM"`
	ReservedCPU int                    `xml:"RESERVED_CPU"`
	Dynamic     dyn.UnmatchedTagsSlice `xml:",any"`
}

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
