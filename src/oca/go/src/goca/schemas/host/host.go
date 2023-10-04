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

package host

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Host pool
type Pool struct {
	XMLName xml.Name `xml:"HOST_POOL"`
	Hosts   []Host   `xml:"HOST"`
}

// PoolMonitoring contains the monitoring records of the hosts
type PoolMonitoring struct {
	XMLName xml.Name       `xml:"MONITORING_DATA"`
	Records []dyn.Template `xml:"MONITORING"`
}

// Host represents an OpenNebula Host
type Host struct {
	XMLName         xml.Name          `xml:"HOST"`
	ID              int               `xml:"ID,omitempty"`
	Name            string            `xml:"NAME"`
	StateRaw        int               `xml:"STATE,omitempty"`
	IMMAD           string            `xml:"IM_MAD,omitempty"`
	VMMAD           string            `xml:"VM_MAD,omitempty"`
	ClusterID       int               `xml:"CLUSTER_ID,omitempty"`
	Cluster         string            `xml:"CLUSTER,omitempty"`
	Share           Share             `xml:"HOST_SHARE,omitempty"`
	VMs             shared.EntitiesID `xml:"VMS,omitempty"`
	MonitoringInfos dyn.Template      `xml:"MONITORING,omitempty"`
	Template        Template          `xml:"TEMPLATE,omitempty"`
}

// Monitoring contains the monitoring records of a host
type Monitoring struct {
	XMLName xml.Name       `xml:"MONITORING_DATA"`
	Records []dyn.Template `xml:"MONITORING"`
}

type Share struct {
	MemUsage int `xml:"MEM_USAGE,omitempty"`
	CPUUsage int `xml:"CPU_USAGE,omitempty"`
	TotalMem int `xml:"TOTAL_MEM,omitempty"`
	TotalCPU int `xml:"TOTAL_CPU,omitempty"`

	MaxMem int `xml:"MAX_MEM,omitempty"`
	MaxCPU int `xml:"MAX_CPU,omitempty"`

	RunningVMs int          `xml:"RUNNING_VMS,omitempty"`
	Datastores Datastores   `xml:"DATASTORES,omitempty"`
	NumaNodes  []NumaNode   `xml:"NUMA_NODES>NODE,omitempty"`
	PCIDevices []PCIDevices `xml:"PCI_DEVICES>PCI,omitempty"`
}

type Datastores struct {
	DiskUsage  int         `xml:"DISK_USAGE,omitempty"`
	FreeDisk   int         `xml:"FREE_DISK,omitempty"`
	MaxDisk    int         `xml:"MAX_DISK,omitempty"`
	UsedDisk   int         `xml:"USED_DISK,omitempty"`
	Datastores []Datastore `xml:"DS,omitempty"`
}

type Datastore struct {
	ID      int `xml:"ID,omitempty"`
	TotalMB int `xml:"TOTAL_MB,omitempty"`
	FreeMB  int `xml:"FREE_MB,omitempty"`
	UsedMB  int `xml:"USED_MB,omitempty"`
}

type PCIDevices struct {
	Address      string     `xml:"ADDRESS,omitempty"`
	Bus          string     `xml:"BUS,omitempty"`
	Class        string     `xml:"CLASS,omitempty"`
	ClassName    string     `xml:"CLASS_NAME,omitempty"`
	Device       string     `xml:"DEVICE,omitempty"`
	DeviceName   string     `xml:"DEVICE_NAME,omitempty"`
	Domain       string     `xml:"DOMAIN,omitempty"`
	Function     string     `xml:"FUNCTION,omitempty"`
	NumaNodes    []NumaNode `xml:"NUMA_NODE,omitempty"`
	ShortAddress string     `xml:"SHORT_ADDRESS,omitempty"`
	Slot         string     `xml:"SLOT,omitempty"`
	Type         string     `xml:"TYPE,omitempty"`
	Vendor       string     `xml:"VENDOR,omitempty"`
	VendorName   string     `xml:"VENDOR_NAME,omitempty"`
	VMID         int        `xml:"VMID,omitempty"`
}

type NumaNode struct {
	ID        int        `xml:"NODE_ID,omitempty"`
	Cores     []Core     `xml:"CORE,omitempty"`
	HugePages []HugePage `xml:"HUGEPAGE,omitempty"`
	Memories  []Memory   `xml:"MEMORY,omitempty"`
}

type HugePage struct {
	Pages int `xml:"PAGES,omitempty"`
	Size  int `xml:"SIZE,omitempty"`
	Usage int `xml:"USAGE,omitempty"`
}

type Memory struct {
	Distance string `xml:"DISTANCE,omitempty"`
	Total    int    `xml:"TOTAL,omitempty"`
	Usage    int    `xml:"USAGE,omitempty"`
}

type Core struct {
	ID        int    `xml:"ID,omitempty"`
	CPUs      string `xml:"CPUS,omitempty"`
	Dedicated string `xml:"DEDICATED,omitempty"`
	Free      int    `xml:"FREE,omitempty"`
}
