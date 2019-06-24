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

package marketplace

import (
	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula MarketPlace pool
type Pool struct {
	MarketPlaces []MarketPlace `xml:"MARKETPLACE"`
}

// MarketPlace represents an OpenNebula MarketPlace
type MarketPlace struct {
	ID                 int                 `xml:"ID"`
	UID                int                 `xml:"UID"`
	GID                int                 `xml:"GID"`
	UName              string              `xml:"UNAME"`
	GName              string              `xml:"GNAME"`
	Name               string              `xml:"NAME"`
	MarketMad          string              `xml:"MARKET_MAD"`
	ZoneID             string              `xml:"ZONE_ID"`
	TotalMB            int                 `xml:"TOTAL_MB"`
	FreeMB             int                 `xml:"FREE_MB"`
	UsedMB             int                 `xml:"USED_MB"`
	MarketPlaceAppsIDs []int               `xml:"MARKETPLACEAPPS>ID"`
	Permissions        *shared.Permissions `xml:"PERMISSIONS"`
	Template           Template            `xml:"TEMPLATE"`
}

// MarketPlaceTemplate represent the template part of the MarketPlace
type Template struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}
