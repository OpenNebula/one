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

package goca

// An user can take snapshot on VM, or on VM disks

// Common part
type snapshot struct {
	Children string `xml:"CHILDREN"` //minOccur=0
	Active   string `xml:"ACTIVE"`   //minOccur=0
	Date     int    `xml:"DATE"`
	ID       int    `xml:"ID"`
	Name     string `xml:"NAME"` //minOccur=0
	Parent   int    `xml:"PARENT"`
	Size     int    `xml:"SIZE"`
}

// Image entity related
type ImageSnapshot struct {
	AllowOrphans string     `xml:"ALLOW_ORPHANS"`
	CurrentBase  int        `xml:"CURRENT_BASE"`
	NextSnapshot int        `xml:"NEXT_SNAPSHOT"`
	Snapshots    []snapshot `xml:"SNAPSHOT"`
}

// VM entity related
type VMSnapshot struct {
	HypervisorID string `xml:"HYPERVISOR_ID"`
	Name         string `xml:"NAME"`
	ID           int    `xml:"SNAPSHOT_ID"`
	Time         string `xml:"TIME"`
}

type vmHistoryRecordSnapshot struct {
	ImageSnapshot
	DiskID int `xml:"DISK_ID"`
}

type vmMonitoringSnapshotSize struct {
	DiskID int `xml:"DISK_ID"`
	Size   int `xml:"SIZE"`
}
