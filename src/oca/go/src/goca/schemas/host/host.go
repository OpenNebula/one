/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
	"encoding/xml"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Host pool
type Pool struct {
	XMLName xml.Name `xml:"HOST_POOL"`
	Hosts   []Host   `xml:"HOST"`
}

// Host represents an OpenNebula Host
type Host struct {
	XMLName     xml.Name          `xml:"HOST"`
	ID          int               `xml:"ID,omitempty"`
	Name        string            `xml:"NAME"`
	StateRaw    int               `xml:"STATE,omitempty"`
	IMMAD       string            `xml:"IM_MAD,omitempty"`
	VMMAD       string            `xml:"VM_MAD,omitempty"`
	LastMonTime int               `xml:"LAST_MON_TIME,omitempty"`
	ClusterID   int               `xml:"CLUSTER_ID,omitempty"`
	Cluster     string            `xml:"CLUSTER,omitempty"`
	Share       Share             `xml:"HOST_SHARE,omitempty"`
	VMs         shared.EntitiesID `xml:"VMS,omitempty"`
	Template    Template          `xml:"TEMPLATE,omitempty"`
}

type Share struct {
	DiskUsage int `xml:"DISK_USAGE,omitempty"`
	MemUsage  int `xml:"MEM_USAGE,omitempty"`
	CPUUsage  int `xml:"CPU_USAGE,omitempty"`
	TotalMem  int `xml:"TOTAL_MEM,omitempty"`
	TotalCPU  int `xml:"TOTAL_CPU,omitempty"`

	MaxDisk int `xml:"MAX_DISK,omitempty"`
	MaxMem  int `xml:"MAX_MEM,omitempty"`
	MaxCPU  int `xml:"MAX_CPU,omitempty"`

	FreeDisk int `xml:"FREE_DISK,omitempty"`
	FreeMem  int `xml:"FREE_MEM,omitempty"`
	FreeCPU  int `xml:"FREE_CPU,omitempty"`

	UsedDisk int `xml:"USED_DISK,omitempty"`
	UsedMem  int `xml:"USED_MEM,omitempty"`
	UsedCPU  int `xml:"USED_CPU,omitempty"`

	RunningVMs int          `xml:"RUNNING_VMS,omitempty"`
	Datastores []Datastores `xml:"DATASTORES>DS,omitempty"`
	PCIDevices interface{}  `xml:"PCI_DEVICES>PCI,omitempty"`
}

type Datastores struct {
	ID      int `xml:"ID,omitempty"`
	UsedMB  int `xml:"USED_MB,omitempty"`
	FreeMB  int `xml:"FREE_MB,omitempty"`
	TotalMB int `xml:"TOTAL_MB,omitempty"`
}
