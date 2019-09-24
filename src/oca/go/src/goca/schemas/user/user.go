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

package user

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula User pool
type Pool struct {
	Users             []User            `xml:"USER"`
	Quotas            []shared.Quotas   `xml:"QUOTAS"`
	DefaultUserQuotas shared.QuotasList `xml:"DEFAULT_USER_QUOTAS"`
}

// User represents an OpenNebula user
type User struct {
	ID          int          `xml:"ID"`
	GID         int          `xml:"GID"`
	GroupsID    []int        `xml:"GROUPS>ID"`
	GName       string       `xml:"GNAME"`
	Name        string       `xml:"NAME"`
	Password    string       `xml:"PASSWORD"`
	AuthDriver  string       `xml:"AUTH_DRIVER"`
	Enabled     int          `xml:"ENABLED"`
	LoginTokens []LoginToken `xml:"LOGIN_TOKEN"`
	Template    Template     `xml:"TEMPLATE"`

	// Variable part between one.userpool.info and one.user.info
	shared.QuotasList
	DefaultUserQuotas shared.QuotasList `xml:"DEFAULT_USER_QUOTAS"`
}

type Template struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

type LoginToken struct {
	Token          string `xml:"TOKEN"`
	ExpirationTime int    `xml:"EXPIRATION_TIME"`
	EGID           int    `xml:"EGID"`
}
