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

package virtualrouter

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula VirtualRouter pool
type Pool struct {
	VirtualRouters []VirtualRouter `xml:"VROUTER"`
}

// VirtualRouter represents an OpenNebula VirtualRouter
type VirtualRouter struct {
	ID          int                 `xml:"ID"`
	UID         int                 `xml:"UID"`
	GID         int                 `xml:"GID"`
	UName       string              `xml:"UNAME"`
	GName       string              `xml:"GNAME"`
	Name        string              `xml:"NAME"`
	LockInfos   *shared.Lock        `xml:"LOCK"`
	Permissions *shared.Permissions `xml:"PERMISSIONS"`
	Type        int                 `xml:"TYPE"`
	DiskType    int                 `xml:"DISK_TYPE"`
	Persistent  int                 `xml:"PERSISTENT"`
	VMsID       []int               `xml:"VMS>ID"`
	Template    Template            `xml:"TEMPLATE"`
}

// Template represent the template part of the OpenNebula VirtualRouter
type Template struct {
	NIC     []NIC                  `xml:"NIC"`
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type NIC struct {
	NICID   int                    `xml:"NIC_ID"`
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}
