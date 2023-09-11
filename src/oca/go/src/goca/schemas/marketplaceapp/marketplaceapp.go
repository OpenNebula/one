/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

package marketplaceapp

import (
	"encoding/xml"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula MarketPlaceApp pool
type Pool struct {
	XMLName         xml.Name         `xml:"MARKETPLACEAPP_POOL"`
	MarketPlaceApps []MarketPlaceApp `xml:"MARKETPLACEAPP"`
}

// MarketPlaceApp represents an OpenNebula MarketPlaceApp
type MarketPlaceApp struct {
	XMLName       xml.Name            `xml:"MARKETPLACEAPP"`
	ID            int                 `xml:"ID,omitempty"`
	UID           int                 `xml:"UID,omitempty"`
	GID           int                 `xml:"GID,omitempty"`
	UName         string              `xml:"UNAME,omitempty"`
	GName         string              `xml:"GNAME,omitempty"`
	LockInfos     *shared.Lock        `xml:"LOCK,omitempty"`
	Permissions   *shared.Permissions `xml:"PERMISSIONS,omitempty"`
	RegTime       int                 `xml:"REGTIME,omitempty"`
	Name          string              `xml:"NAME"`
	ZoneID        string              `xml:"ZONE_ID,omitempty"`
	OriginID      int                 `xml:"ORIGIN_ID"`
	Source        string              `xml:"SOURCE,omitempty"`
	MD5           string              `xml:"MD5,omitempty"`
	Size          int                 `xml:"SIZE,omitempty"`
	Description   string              `xml:"DESCRIPTION,omitempty"`
	Version       string              `xml:"VERSION,omitempty"`
	Format        string              `xml:"FORMAT,omitempty"`
	AppTemplate64 string              `xml:"APPTEMPLATE64,omitempty"`
	MarketPlaceID *int                `xml:"MARKETPLACE_ID,omitempty"`
	MarketPlace   string              `xml:"MARKETPLACE,omitempty"`
	StateRaw      int                 `xml:"STATE,omitempty"`
	Type          int                 `xml:"TYPE,omitempty"`
	Template      Template            `xml:"TEMPLATE"`
}
