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

package securitygroup

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula SecurityGroup pool
type Pool struct {
	SecurityGroups []SecurityGroup `xml:"SECURITY_GROUP"`
}

// SecurityGroup represents an OpenNebula SecurityGroup
type SecurityGroup struct {
	ID          int                 `xml:"ID"`
	UID         int                 `xml:"UID"`
	GID         int                 `xml:"GID"`
	UName       string              `xml:"UNAME"`
	GName       string              `xml:"GNAME"`
	Name        string              `xml:"NAME"`
	Permissions *shared.Permissions `xml:"PERMISSIONS"`
	UpdatedVMs  []int               `xml:"UPDATED_VMS>ID"`
	OutdatedVMs []int               `xml:"OUTDATED_VMS>ID"`
	UpdatingVMs []int               `xml:"UPDATING_VMS>ID"`
	ErrorVMs    []int               `xml:"ERROR_VMS>ID"`
	Template    Template            `xml:"TEMPLATE"`
}

// Template represent the template part of the OpenNebula SecurityGroup
type Template struct {
	Description string                 `xml:"DESCRIPTION"`
	Rules       []SecurityGroupRule    `xml:"RULE"`
	Dynamic     dyn.UnmatchedTagsSlice `xml:",any"`
}

type SecurityGroupRule struct {
	Protocol string `xml:"PROTOCOL"`
	RuleType string `xml:"RULE_TYPE"`
}
