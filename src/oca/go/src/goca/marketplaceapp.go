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

package goca

import (
	"encoding/xml"
	"errors"
)

// MarketPlaceAppsController is a controller for a pool of MarketPlaceApps
type MarketPlaceAppsController entitiesController

// MarketPlaceAppController is a controller for MarketPlaceApp entities
type MarketPlaceAppController entityController

// MarketPlaceAppPool represents an OpenNebula MarketPlaceAppPool
type MarketPlaceAppPool struct {
	MarketPlaceApps []MarketPlaceApp `xml:"MARKETPLACEAPP"`
}

// MarketPlaceApp represents an OpenNebula MarketPlaceApp
type MarketPlaceApp struct {
	ID            uint                   `xml:"ID"`
	UID           int                    `xml:"UID"`
	GID           int                    `xml:"GID"`
	UName         string                 `xml:"UNAME"`
	GName         string                 `xml:"GNAME"`
	LockInfos     *Lock                  `xml:"LOCK"`
	Permissions   *Permissions           `xml:"PERMISSIONS"`
	RegTime       int                    `xml:"REGTIME"`
	Name          string                 `xml:"NAME"`
	ZoneID        string                 `xml:"ZONE_ID"`
	OriginID      string                 `xml:"ORIGIN_ID"`
	Source        string                 `xml:"SOURCE"`
	MD5           string                 `xml:"MD5"`
	Size          int                    `xml:"SIZE"`
	Description   string                 `xml:"DESCRIPTION"`
	Version       string                 `xml:"VERSION"`
	Format        string                 `xml:"FORMAT"`
	AppTemplate64 string                 `xml:"APPTEMPLATE64"`
	MarketPlaceID int                    `xml:"MARKETPLACEID"`
	MarketPlace   string                 `xml:"MARKETPLACE"`
	State         int                    `xml:"STATE"`
	Type          int                    `xml:"TYPE"`
	Template      marketPlaceAppTemplate `xml:"TEMPLATE"`
}

type marketPlaceAppTemplate struct {
	Dynamic unmatchedTagsSlice `xml:,any`
}

// MarketPlaceApps returns a MarketPlaceApps controller
func (c *Controller) MarketPlaceApps() *MarketPlaceAppsController {
	return &MarketPlaceAppsController{c}
}

// MarketPlaceApp returns a MarketPlaceApp controller
func (c *Controller) MarketPlaceApp(id uint) *MarketPlaceAppController {
	return &MarketPlaceAppController{c, id}
}

// ByName returns a MarketPlace ID from name
func (c *MarketPlaceAppsController) ByName(name string, args ...int) (uint, error) {
	var id uint

	marketAppPool, err := c.Info(args...)
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(marketAppPool.MarketPlaceApps); i++ {
		if marketAppPool.MarketPlaceApps[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = marketAppPool.MarketPlaceApps[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a marketplace app pool. A connection to OpenNebula is
// performed.
func (mc *MarketPlaceAppsController) Info(args ...int) (*MarketPlaceAppPool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
	case 1:
		who = args[0]
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := mc.c.Client.Call("one.marketapppool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	marketappPool := &MarketPlaceAppPool{}
	err = xml.Unmarshal([]byte(response.Body()), marketappPool)
	if err != nil {
		return nil, err
	}

	return marketappPool, nil
}

// Info retrieves information for the marketplace app.
func (mc *MarketPlaceAppController) Info() (*MarketPlaceApp, error) {
	response, err := mc.c.Client.Call("one.marketapp.info", mc.ID)
	if err != nil {
		return nil, err
	}
	marketApp := &MarketPlaceApp{}
	err = xml.Unmarshal([]byte(response.Body()), marketApp)
	if err != nil {
		return nil, err
	}
	return marketApp, nil

}

// Create allocates a new marketplace app. It returns the new marketplace app ID.
// * tpl: template of the marketplace app
// * market: market place ID
func (mc *MarketPlaceAppsController) Create(tpl string, market int) (uint, error) {
	response, err := mc.c.Client.Call("one.marketapp.allocate", tpl, market)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given marketplace app from the pool.
func (mc *MarketPlaceAppController) Delete() error {
	_, err := mc.c.Client.Call("one.marketapp.delete", mc.ID)
	return err
}

// Enable enables or disables a marketplace app.
// * enable: True for enabling, False for disabling
func (mc *MarketPlaceAppController) Enable(enable bool) error {
	_, err := mc.c.Client.Call("one.marketapp.enable", mc.ID, enable)
	return err
}

// Update replaces the cluster cluster contents.
// * tpl: The new cluster contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (mc *MarketPlaceAppController) Update(tpl string, uType UpdateType) error {
	_, err := mc.c.Client.Call("one.marketapp.update", mc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a marketplace app
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (mc *MarketPlaceAppController) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := mc.c.Client.Call("one.marketapp.chmod", mc.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Chown changes the ownership of a marketplace app.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (mc *MarketPlaceAppController) Chown(userID, groupID int) error {
	_, err := mc.c.Client.Call("one.marketapp.chown", mc.ID, userID, groupID)
	return err
}

// Rename renames a marketplace app.
// * newName: The new name.
func (mc *MarketPlaceAppController) Rename(newName string) error {
	_, err := mc.c.Client.Call("one.marketapp.rename", mc.ID, newName)
	return err
}

// Lock locks the marketplace app depending on blocking level. See levels in locks.go.
func (mc *MarketPlaceAppController) Lock(level LockLevel) error {
	_, err := mc.c.Client.Call("one.marketapp.lock", mc.ID, level)
	return err
}

// Unlock unlocks the marketplace app.
func (mc *MarketPlaceAppController) Unlock() error {
	_, err := mc.c.Client.Call("one.marketapp.unlock", mc.ID)
	return err
}
