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

package shared

import "encoding/xml"

// Quotas keeps quota value per User or Group
type Quotas struct {
	XMLName xml.Name `xml:"QUOTAS"`
	ID      int      `xml:"ID"`
	QuotasList
}

// QuotasList keeps quota per entity type
type QuotasList struct {
	Datastore []DatastoreQuota `xml:"DATASTORE_QUOTA>DATASTORE"`
	Network   []NetworkQuota   `xml:"NETWORK_QUOTA>NETWORK"`
	VM        *VMQuota         `xml:"VM_QUOTA>VM"`
	Image     []ImageQuota     `xml:"IMAGE_QUOTA>IMAGE"`
}

// DatastoreQuota keeps quota for a datastore
type DatastoreQuota struct {
	ID         int `xml:"ID"`
	Images     int `xml:"IMAGES"`
	ImagesUsed int `xml:"IMAGES_USED,omitempty"`
	Size       int `xml:"SIZE"`
	SizeUsed   int `xml:"SIZE_USED,omitempty"`
}

// NetworkQuota keeps quota for a network
type NetworkQuota struct {
	ID         int `xml:"ID"`
	Leases     int `xml:"LEASES"`
	LeasesUsed int `xml:"LEASES_USED,omitempty"`
}

// VMQuota keeps quota for all VMs in the group
type VMQuota struct {
	CPU                float32 `xml:"CPU"`
	CPUUsed            float32 `xml:"CPU_USED,omitempty"`
	Memory             int     `xml:"MEMORY"`
	MemoryUsed         int     `xml:"MEMORY_USED,omitempty"`
	RunningCPU         float32 `xml:"RUNNING_CPU"`
	RunningCPUUsed     float32 `xml:"RUNNING_CPU_USED,omitempty"`
	RunningMemory      int     `xml:"RUNNING_MEMORY"`
	RunningMemoryUsed  int     `xml:"RUNNING_MEMORY_USED,omitempty"`
	RunningVMs         int     `xml:"RUNNING_VMS"`
	RunningVMsUsed     int     `xml:"RUNNING_VMS_USED,omitempty"`
	SystemDiskSize     int64   `xml:"SYSTEM_DISK_SIZE"`
	SystemDiskSizeUsed int64   `xml:"SYSTEM_DISK_SIZE_USED,omitempty"`
	VMs                int     `xml:"VMS"`
	VMsUsed            int     `xml:"VMS_USED,omitempty"`
}

// ImageQuota keeps quota for an image
type ImageQuota struct {
	ID       int `xml:"ID"`
	RVMs     int `xml:"RVMS"`
	RVMsUsed int `xml:"RVMS_USED,omitempty"`
}
