/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplaceapp"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// MarketPlaceAppsController is a controller for a pool of MarketPlaceApps
type MarketPlaceAppsController entitiesController

// MarketPlaceAppController is a controller for MarketPlaceApp entities
type MarketPlaceAppController entityController

// MarketPlaceApps returns a MarketPlaceApps controller
func (c *Controller) MarketPlaceApps() *MarketPlaceAppsController {
	return &MarketPlaceAppsController{c}
}

// MarketPlaceApp returns a MarketPlaceApp controller
func (c *Controller) MarketPlaceApp(id int) *MarketPlaceAppController {
	return &MarketPlaceAppController{c, id}
}

// ByName returns a MarketPlace ID from name
func (c *MarketPlaceAppsController) ByName(name string, args ...int) (int, error) {
	var id int

	marketAppPool, err := c.Info(args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(marketAppPool.MarketPlaceApps); i++ {
		if marketAppPool.MarketPlaceApps[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = marketAppPool.MarketPlaceApps[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a marketplace app pool. A connection to OpenNebula is
// performed.
func (mc *MarketPlaceAppsController) Info(args ...int) (*marketplaceapp.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := mc.c.Client.Call("one.marketapppool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	marketappPool := &marketplaceapp.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), marketappPool)
	if err != nil {
		return nil, err
	}

	return marketappPool, nil
}

// Info retrieves information for the marketplace app.
func (mc *MarketPlaceAppController) Info(decrypt bool) (*marketplaceapp.MarketPlaceApp, error) {
	response, err := mc.c.Client.Call("one.marketapp.info", mc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	marketApp := &marketplaceapp.MarketPlaceApp{}
	err = xml.Unmarshal([]byte(response.Body()), marketApp)
	if err != nil {
		return nil, err
	}
	return marketApp, nil

}

// Create allocates a new marketplace app. It returns the new marketplace app ID.
// * tpl: template of the marketplace app
// * market: market place ID
func (mc *MarketPlaceAppsController) Create(tpl string, market int) (int, error) {
	response, err := mc.c.Client.Call("one.marketapp.allocate", tpl, market)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
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

// Update adds marketplace app content.
// * tpl: The new marketplace contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (mc *MarketPlaceAppController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := mc.c.Client.Call("one.marketapp.update", mc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a marketplace app
func (mc *MarketPlaceAppController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{mc.ID}, perm.ToArgs()...)
	_, err := mc.c.Client.Call("one.marketapp.chmod", args...)
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
func (mc *MarketPlaceAppController) Lock(level shared.LockLevel) error {
	_, err := mc.c.Client.Call("one.marketapp.lock", mc.ID, level)
	return err
}

// Unlock unlocks the marketplace app.
func (mc *MarketPlaceAppController) Unlock() error {
	_, err := mc.c.Client.Call("one.marketapp.unlock", mc.ID)
	return err
}
