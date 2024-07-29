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

package template

import (
	"encoding/xml"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"

	vm "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
)

// Pool represents an OpenNebula Template pool
type Pool struct {
	XMLName   xml.Name   `xml:"VMTEMPLATE_POOL"`
	Templates []Template `xml:"VMTEMPLATE"`
}

// Template represents an OpenNebula Template
type Template struct {
	ID          int                 `xml:"ID,omitempty"`
	UID         int                 `xml:"UID,omitempty"`
	GID         int                 `xml:"GID,omitempty"`
	UName       string              `xml:"UNAME,omitempty"`
	GName       string              `xml:"GNAME,omitempty"`
	Name        string              `xml:"NAME"`
	LockInfos   *shared.Lock        `xml:"LOCK,omitempty"`
	Permissions *shared.Permissions `xml:"PERMISSIONS,omitempty"`
	RegTime     int                 `xml:"REGTIME,omitempty"`
	Template    vm.Template         `xml:"TEMPLATE"`
}
