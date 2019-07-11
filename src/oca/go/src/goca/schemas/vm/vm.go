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

package vm

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/image"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/securitygroup"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Virtual Machine pool
type Pool struct {
	VMs []VM `xml:"VM"`
}

// VM represents an OpenNebula Virtual Machine
type VM struct {
	ID              int                 `xml:"ID"`
	UID             int                 `xml:"UID"`
	GID             int                 `xml:"GID"`
	UName           string              `xml:"UNAME"`
	GName           string              `xml:"GNAME"`
	Name            string              `xml:"NAME"`
	Permissions     *shared.Permissions `xml:"PERMISSIONS"`
	LastPoll        int                 `xml:"LAST_POLL"`
	StateRaw        int                 `xml:"STATE"`
	LCMStateRaw     int                 `xml:"LCM_STATE"`
	PrevStateRaw    int                 `xml:"PREV_STATE"`
	PrevLCMStateRaw int                 `xml:"PREV_LCM_STATE"`
	ReschedValue    int                 `xml:"RESCHED"`
	STime           int                 `xml:"STIME"`
	ETime           int                 `xml:"ETIME"`
	DeployID        string              `xml:"DEPLOY_ID"`
	MonitoringInfos Monitoring          `xml:"MONITORING"`
	Template        Template            `xml:"TEMPLATE"`
	UserTemplate    *UserTemplate       `xml:"USER_TEMPLATE"`
	HistoryRecords  []HistoryRecord     `xml:"HISTORY_RECORDS>HISTORY"`

	// Not filled with NewUserPool call
	LockInfos *shared.Lock `xml:"LOCK"`
}

type Monitoring struct {
	DiskSize     []MonitoringDiskSize     `xml:"DISK_SIZE"`
	SnapshotSize []MonitoringSnapshotSize `xml:"SNAPSHOT_SIZE"`
	Dynamic      dyn.UnmatchedTagsSlice   `xml:",any"`
}

type MonitoringDiskSize struct {
	ID   int `xml:"ID"`
	Size int `xml:"SIZE"`
}

// History records
type HistoryRecord struct {
	OID       int                     `xml:"OID"`
	SEQ       int                     `xml:"SEQ"`
	Hostname  string                  `xml:"HOSTNAME"`
	HID       int                     `xml:"HID"`
	CID       int                     `xml:"CID"`
	DSID      int                     `xml:"DS_ID"`
	Action    int                     `xml:"ACTION"`
	UID       int                     `xml:"UID"`
	GID       int                     `xml:"GID"`
	RequestID string                  `xml:"REQUEST_ID"`
	PSTime    int                     `xml:"PSTIME"`
	PETime    int                     `xml:"PETIME"`
	RSTime    int                     `xml:"RSTIME"`
	RETime    int                     `xml:"RETIME"`
	ESTime    int                     `xml:"ESTIME"`
	EETime    int                     `xml:"EETIME"`
	STime     int                     `xml:"STIME"`
	ETime     int                     `xml:"ETIME"`
	VMMad     string                  `xml:"VM_MAD"`
	TMMad     string                  `xml:"TM_MAD"`
	Snapshots []HistoryRecordSnapshot `xml:"SNAPSHOTS"`
}

type HistoryRecordSnapshot struct {
	image.Snapshot
	DiskID int `xml:"DISK_ID"`
}

type MonitoringSnapshotSize struct {
	DiskID int `xml:"DISK_ID"`
	Size   int `xml:"SIZE"`
}

// VMUserTemplate contain custom attributes
type UserTemplate struct {
	Error        string               `xml:"ERROR"`
	SchedMessage string               `xml:"SCHED_MESSAGE"`
	Dynamic      dyn.UnmatchedTagsMap `xml:",any"`
}

type Template struct {
	CPU                float64                `xml:"CPU"`
	Memory             int                    `xml:"MEMORY"`
	NICs               []Nic                  `xml:"NIC"`
	NICAliases         []NicAlias             `xml:"NIC_ALIAS"`
	Context            *Context               `xml:"CONTEXT"`
	Disks              []Disk                 `xml:"DISK"`
	Graphics           *Graphics              `xml:"GRAPHICS"`
	OS                 *OS                    `xml:"OS"`
	Snapshots          []Snapshot             `xml:"SNAPSHOT"`
	SecurityGroupRules []SecurityGroupRule    `xml:"SECURITY_GROUP_RULE"`
	Dynamic            dyn.UnmatchedTagsSlice `xml:",any"`
}

type Context struct {
	Dynamic dyn.UnmatchedTagsMap `xml:",any"`
}

type Nic struct {
	ID      int                    `xml:"NIC_ID"`
	Network string                 `xml:"NETWORK"`
	IP      string                 `xml:"IP"`
	MAC     string                 `xml:"MAC"`
	PhyDev  string                 `xml:"PHYDEV"`
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type NicAlias struct {
	ID       int    `xml:"NIC_ID"`    // minOccurs=1
	Parent   string `xml:"PARENT"`    // minOccurs=1
	ParentID string `xml:"PARENT_ID"` // minOccurs=1
}

type Graphics struct {
	Listen string `xml:"LISTEN"`
	Port   string `xml:"PORT"`
	Type   string `xml:"TYPE"`
}

type Disk struct {
	ID           int                    `xml:"DISK_ID"`
	Datastore    string                 `xml:"DATASTORE"`
	DiskType     string                 `xml:"DISK_TYPE"`
	Image        string                 `xml:"IMAGE"`
	Driver       string                 `xml:"DRIVER"`
	OriginalSize int                    `xml:"ORIGINAL_SIZE"`
	Size         int                    `xml:"SIZE"`
	Dynamic      dyn.UnmatchedTagsSlice `xml:",any"`
}

type OS struct {
	Arch string `xml:"ARCH"`
	Boot string `xml:"BOOT"`
}

type SecurityGroupRule struct {
	securitygroup.SecurityGroupRule
	SecurityGroup string `xml:"SECURITY_GROUP_NAME"`
}

type Snapshot struct {
	HypervisorID string `xml:"HYPERVISOR_ID"`
	Name         string `xml:"NAME"`
	ID           int    `xml:"SNAPSHOT_ID"`
	Time         string `xml:"TIME"`
}
