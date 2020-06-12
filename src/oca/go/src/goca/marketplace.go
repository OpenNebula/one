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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// MarketPlacesController is a controller for a pool of MarketPlaces
type MarketPlacesController entitiesController

// MarketPlaceController is a controller for MarketPlace entities
type MarketPlaceController entityController

// MarketPlaces returns a MarketPlaces controller
func (c *Controller) MarketPlaces() *MarketPlacesController {
	return &MarketPlacesController{c}
}

// MarketPlace return MarketPlace controller
func (c *Controller) MarketPlace(id int) *MarketPlaceController {
	return &MarketPlaceController{c, id}
}

// ByName return MarketPlace ID from name
func (c *MarketPlacesController) ByName(name string) (int, error) {
	var id int

	marketPool, err := c.Info()
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(marketPool.MarketPlaces); i++ {
		if marketPool.MarketPlaces[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = marketPool.MarketPlaces[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil

}

// Info returns a marketplace pool. A connection to OpenNebula is
// performed.
func (mc *MarketPlacesController) Info(args ...int) (*marketplace.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := mc.c.Client.Call("one.marketpool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	marketPool := &marketplace.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), marketPool)
	if err != nil {
		return nil, err
	}

	return marketPool, nil
}

// Info retrieves information for the marketplace.
func (mc *MarketPlaceController) Info(decrypt bool) (*marketplace.MarketPlace, error) {
	response, err := mc.c.Client.Call("one.market.info", mc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	market := &marketplace.MarketPlace{}
	err = xml.Unmarshal([]byte(response.Body()), market)
	if err != nil {
		return nil, err
	}
	return market, nil
}

// Create allocates a new marketplace. It returns the new marketplace ID.
// * tpl: template of the marketplace
func (mc *MarketPlacesController) Create(tpl string) (int, error) {
	response, err := mc.c.Client.Call("one.market.allocate", tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given marketplace from the pool.
func (mc *MarketPlaceController) Delete() error {
	_, err := mc.c.Client.Call("one.market.delete", mc.ID)
	return err
}

// Update adds marketplace content.
// * tpl: The new marketplace contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (mc *MarketPlaceController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := mc.c.Client.Call("one.market.update", mc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a marketplace
func (mc *MarketPlaceController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{mc.ID}, perm.ToArgs()...)

	_, err := mc.c.Client.Call("one.market.chmod", args...)
	return err
}

// Chown changes the ownership of a marketplace.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (mc *MarketPlaceController) Chown(userID, groupID int) error {
	_, err := mc.c.Client.Call("one.market.chown", mc.ID, userID, groupID)
	return err
}

// Rename renames a marketplace.
// * newName: The new name.
func (mc *MarketPlaceController) Rename(newName string) error {
	_, err := mc.c.Client.Call("one.market.rename", mc.ID, newName)
	return err
}
