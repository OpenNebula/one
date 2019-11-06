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

package vmgroup

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula VM group pool
type Pool struct {
	XMLName  xml.Name  `xml:"VM_GROUP_POOL"`
	VMGroups []VMGroup `xml:"VM_GROUP"`
}

// VMGroup represents an OpenNebula VM group
type VMGroup struct {
	XMLName     xml.Name            `xml:"VM_GROUP"`
	ID          int                 `xml:"ID"`
	UID         int                 `xml:"UID"`
	GID         int                 `xml:"GID"`
	UName       string              `xml:"UNAME"`
	GName       string              `xml:"GNAME"`
	Name        string              `xml:"NAME"`
	Permissions *shared.Permissions `xml:"PERMISSIONS"`
	LockInfos   *shared.Lock        `xml:"LOCK"`
	Roles       []Role              `xml:"ROLES>ROLE"`
	Template    dyn.Template        `xml:"TEMPLATE"`
}

type Role struct {
	ID              int    `xml:"ID"`
	Name            string `xml:"NAME"`
	HostAffined     string `xml:"HOST_AFFINED,omitempty"`      // minOccurs=0
	HostAntiAffined string `xml:"HOST_ANTI_AFFINED,omitempty"` // minOccurs=0
	Policy          string `xml:"POLICY,omitempty"`            // minOccurs=0
	VMs             string `xml:"VMS,omitempty"`
}
