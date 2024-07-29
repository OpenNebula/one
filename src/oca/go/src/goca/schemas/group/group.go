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

package group

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula GroupPool
type Pool struct {
	XMLName            xml.Name          `xml:"GROUP_POOL"`
	Groups             []GroupShort      `xml:"GROUP"`
	Quotas             []shared.Quotas   `xml:"QUOTAS"`
	DefaultGroupQuotas shared.QuotasList `xml:"DEFAULT_GROUP_QUOTAS"`
}

// GroupShort keeps summary information on a group
type GroupShort struct {
	XMLName  xml.Name     `xml:"GROUP"`
	ID       int          `xml:"ID,omitempty"`
	Name     string       `xml:"NAME"`
	Template dyn.Template `xml:"TEMPLATE"`

	Users  shared.EntitiesID `xml:"USERS,omitempty"`
	Admins shared.EntitiesID `xml:"ADMINS,omitempty"`
}

// Group represents an OpenNebula Group
type Group struct {
	GroupShort

	// Variable part between one.groupool.info and one.group.info
	shared.QuotasList
	DefaultGroupQuotas shared.QuotasList `xml:"DEFAULT_GROUP_QUOTAS"`
}
