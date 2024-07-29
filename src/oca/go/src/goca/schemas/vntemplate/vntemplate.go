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

package vntemplate

// Since version 5.8 of OpenNebula

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Virtual Network Template pool
type Pool struct {
	XMLName     xml.Name     `xml:"VNTEMPLATE_POOL"`
	VNTemplates []VNTemplate `xml:"VNTEMPLATE"`
}

// VNTemplate represents an OpenNebula Virtual Network Template
type VNTemplate struct {
	XMLName     xml.Name           `xml:"VNTEMPLATE"`
	ID          int                `xml:"ID,omitempty"`
	UID         int                `xml:"UID,omitempty"`
	GID         int                `xml:"GID,omitempty"`
	UName       string             `xml:"UNAME,omitempty"`
	GName       string             `xml:"GNAME,omitempty"`
	Name        string             `xml:"NAME"`
	LockInfos   *shared.Lock       `xml:"LOCK"`
	Permissions shared.Permissions `xml:"PERMISSIONS"`
	RegTime     string             `xml:"REGTIME"`
	Template    dyn.Template       `xml:"TEMPLATE"`
}
