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

package marketplaceapp

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula MarketPlaceApp pool
type Pool struct {
	MarketPlaceApps []MarketPlaceApp `xml:"MARKETPLACEAPP"`
}

// MarketPlaceApp represents an OpenNebula MarketPlaceApp
type MarketPlaceApp struct {
	ID            int                 `xml:"ID"`
	UID           int                 `xml:"UID"`
	GID           int                 `xml:"GID"`
	UName         string              `xml:"UNAME"`
	GName         string              `xml:"GNAME"`
	LockInfos     *shared.Lock        `xml:"LOCK"`
	Permissions   *shared.Permissions `xml:"PERMISSIONS"`
	RegTime       int                 `xml:"REGTIME"`
	Name          string              `xml:"NAME"`
	ZoneID        string              `xml:"ZONE_ID"`
	OriginID      string              `xml:"ORIGIN_ID"`
	Source        string              `xml:"SOURCE"`
	MD5           string              `xml:"MD5"`
	Size          int                 `xml:"SIZE"`
	Description   string              `xml:"DESCRIPTION"`
	Version       string              `xml:"VERSION"`
	Format        string              `xml:"FORMAT"`
	AppTemplate64 string              `xml:"APPTEMPLATE64"`
	MarketPlaceID int                 `xml:"MARKETPLACEID"`
	MarketPlace   string              `xml:"MARKETPLACE"`
	State         int                 `xml:"STATE"`
	Type          int                 `xml:"TYPE"`
	Template      Template            `xml:"TEMPLATE"`
}

type Template struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:,any`
}
