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

package group

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula GroupPool
type Pool struct {
	Groups            []Group           `xml:"GROUP"`
	Quotas            []shared.Quotas   `xml:"QUOTAS"`
	DefaultUserQuotas shared.QuotasList `xml:"DEFAULT_USER_QUOTAS"`
}

// Group represents an OpenNebula Group
type Group struct {
	ID       int      `xml:"ID"`
	Name     string   `xml:"NAME"`
	UsersID  []int    `xml:"USERS>ID"`
	AdminsID []int    `xml:"ADMINS>ID"`
	Template Template `xml:"TEMPLATE"`

	// Variable part between one.grouppool.info and one.group.info
	shared.QuotasList
	DefaultUserQuotas shared.QuotasList `xml:"DEFAULT_USER_QUOTAS"`
}

type Template struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}
