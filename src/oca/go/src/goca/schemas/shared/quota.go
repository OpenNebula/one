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

package shared

type Quotas struct {
	ID int `xml:"ID"`
	QuotasList
}

type QuotasList struct {
	Datastore []DatastoreQuota `xml:"DATASTORE_QUOTA>DATASTORE"`
	Network   []NetworkQuota   `xml:"NETWORK_QUOTA>NETWORK"`
	VM        *VMQuota         `xml:"VM_QUOTA>VM"`
	Image     []ImageQuota     `xml:"IMAGE_QUOTA>IMAGE"`
}

type DatastoreQuota struct {
	ID         int    `xml:"ID"`
	Images     string `xml:"IMAGES"`
	ImagesUsed string `xml:"IMAGES_USED,omitempty"`
	Size       string `xml:"SIZE"`
	SizeUsed   string `xml:"SIZE_USED,omitempty"`
}

type NetworkQuota struct {
	ID         int    `xml:"ID"`
	Leases     string `xml:"LEASES"`
	LeasesUsed string `xml:"LEASES_USED,omitempty"`
}

type VMQuota struct {
	CPU                string `xml:"CPU"`
	CPUUsed            string `xml:"CPU_USED,omitempty"`
	Memory             string `xml:"MEMORY"`
	MemoryUsed         string `xml:"MEMORY_USED,omitempty"`
	RunningCPU         string `xml:"RUNNING_CPU"`
	RunningCPUUsed     string `xml:"RUNNING_CPU_USED,omitempty"`
	RunningMemory      string `xml:"RUNNING_MEMORY"`
	RunningMemoryUsed  string `xml:"RUNNING_MEMORY_USED,omitempty"`
	RunningVMs         string `xml:"RUNNING_VMS"`
	RunningVMsUsed     string `xml:"RUNNING_VMS_USED,omitempty"`
	SystemDiskSize     string `xml:"SYSTEM_DISK_SIZE"`
	SystemDiskSizeUsed string `xml:"SYSTEM_DISK_SIZE_USED,omitempty"`
	VMs                string `xml:"VMS"`
	VMsUsed            string `xml:"VMS_USED,omitempty"`
}

type ImageQuota struct {
	ID       int    `xml:"ID"`
	RVMs     string `xml:"RVMS"`
	RVMsUsed string `xml:"RVMS_USED,omitempty"`
}
