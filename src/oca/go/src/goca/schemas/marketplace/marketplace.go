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

package marketplace

import (
	"encoding/xml"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula MarketPlace pool
type Pool struct {
	XMLName      xml.Name      `xml:"MARKETPLACE_POOL"`
	MarketPlaces []MarketPlace `xml:"MARKETPLACE"`
}

// MarketPlace represents an OpenNebula MarketPlace
type MarketPlace struct {
	XMLName            xml.Name            `xml:"MARKETPLACE"`
	ID                 int                 `xml:"ID,omitempty"`
	UID                int                 `xml:"UID,omitempty"`
	GID                int                 `xml:"GID,omitempty"`
	UName              string              `xml:"UNAME,omitempty"`
	GName              string              `xml:"GNAME,omitempty"`
	Name               string              `xml:"NAME"`
	MarketMad          string              `xml:"MARKET_MAD,omitempty"`
	ZoneID             string              `xml:"ZONE_ID,omitempty"`
	TotalMB            int                 `xml:"TOTAL_MB,omitempty"`
	FreeMB             int                 `xml:"FREE_MB,omitempty"`
	UsedMB             int                 `xml:"USED_MB,omitempty"`
	MarketPlaceAppsIDs shared.EntitiesID   `xml:"MARKETPLACEAPPS,omitempty"`
	Permissions        *shared.Permissions `xml:"PERMISSIONS,omitempty"`
	StateRaw           int                 `xml:"STATE,omitempty"`
	Template           Template            `xml:"TEMPLATE"`
}
