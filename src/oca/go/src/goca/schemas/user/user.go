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

package user

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula User pool
type Pool struct {
	XMLName           xml.Name          `xml:"USER_POOL"`
	Users             []User            `xml:"USER"`
	Quotas            []shared.Quotas   `xml:"QUOTAS"`
	DefaultUserQuotas shared.QuotasList `xml:"DEFAULT_USER_QUOTAS"`
}

// UserShort keeps summary information on a user
type UserShort struct {
	XMLName     xml.Name          `xml:"USER"`
	ID          int               `xml:"ID,omitempty"`
	GID         int               `xml:"GID,omitempty"`
	Groups      shared.EntitiesID `xml:"GROUPS,omitempty"`
	GName       string            `xml:"GNAME,omitempty"`
	Name        string            `xml:"NAME,omitempty"`
	Password    string            `xml:"PASSWORD,omitempty"`
	AuthDriver  string            `xml:"AUTH_DRIVER,omitempty"`
	Enabled     int               `xml:"ENABLED,omitempty"`
	LoginTokens []LoginToken      `xml:"LOGIN_TOKEN,omitempty"`
	Template    dyn.Template      `xml:"TEMPLATE"`
}

// User represents an OpenNebula user
type User struct {
	UserShort

	// Variable part between one.userpool.info and one.user.info
	shared.QuotasList
	DefaultUserQuotas shared.QuotasList `xml:"DEFAULT_USER_QUOTAS"`
}

type LoginToken struct {
	Token          string `xml:"TOKEN"`
	ExpirationTime int    `xml:"EXPIRATION_TIME"`
	EGID           int    `xml:"EGID"`
}
