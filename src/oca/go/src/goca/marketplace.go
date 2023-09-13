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

package goca

import (
	"context"
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
	return c.ByNameContext(context.Background(), name)
}

// ByNameContext return MarketPlace ID from name
func (c *MarketPlacesController) ByNameContext(ctx context.Context, name string) (int, error) {
	var id int

	marketPool, err := c.InfoContext(ctx)
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
	return mc.InfoContext(context.Background(), args...)
}

// InfoContext returns a marketplace pool. A connection to OpenNebula is
// performed.
func (mc *MarketPlacesController) InfoContext(ctx context.Context, args ...int) (*marketplace.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := mc.c.Client.CallContext(ctx, "one.marketpool.info", fArgs...)
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
	return mc.InfoContext(context.Background(), decrypt)
}

// InfoContext retrieves information for the marketplace.
func (mc *MarketPlaceController) InfoContext(ctx context.Context, decrypt bool) (*marketplace.MarketPlace, error) {
	response, err := mc.c.Client.CallContext(ctx, "one.market.info", mc.ID, decrypt)
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
	return mc.CreateContext(context.Background(), tpl)
}

// Create allocates a new marketplace. It returns the new marketplace ID.
// * ctx: context for cancelation
// * tpl: template of the marketplace
func (mc *MarketPlacesController) CreateContext(ctx context.Context, tpl string) (int, error) {
	response, err := mc.c.Client.CallContext(ctx, "one.market.allocate", tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given marketplace from the pool.
func (mc *MarketPlaceController) Delete() error {
	return mc.DeleteContext(context.Background())
}

// DeleteContext deletes the given marketplace from the pool.
func (mc *MarketPlaceController) DeleteContext(ctx context.Context) error {
	_, err := mc.c.Client.CallContext(ctx, "one.market.delete", mc.ID)
	return err
}

// Enable enables or disables a marketplace.
// * enable: True for enabling, False for disabling
func (mc *MarketPlaceController) Enable(enable bool) error {
	return mc.EnableContext(context.Background(), enable)
}

// Enable enables or disables a marketplace.
// * enable: True for enabling, False for disabling
func (mc *MarketPlaceController) EnableContext(ctx context.Context, enable bool) error {
	_, err := mc.c.Client.CallContext(ctx, "one.market.enable", mc.ID, enable)
	return err
}

// Update adds marketplace content.
//   - tpl: The new marketplace contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (mc *MarketPlaceController) Update(tpl string, uType parameters.UpdateType) error {
	return mc.UpdateContext(context.Background(), tpl, uType)
}

// Update adds marketplace content.
//   - ctx: context for cancelation
//   - tpl: The new marketplace contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (mc *MarketPlaceController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := mc.c.Client.CallContext(ctx, "one.market.update", mc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a marketplace
func (mc *MarketPlaceController) Chmod(perm shared.Permissions) error {
	return mc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permission bits of a marketplace
func (mc *MarketPlaceController) ChmodContext(ctx context.Context, perm shared.Permissions) error {
	args := append([]interface{}{mc.ID}, perm.ToArgs()...)

	_, err := mc.c.Client.CallContext(ctx, "one.market.chmod", args...)
	return err
}

// Chown changes the ownership of a marketplace.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (mc *MarketPlaceController) Chown(userID, groupID int) error {
	return mc.ChownContext(context.Background(), userID, groupID)
}

// ChownContext changes the ownership of a marketplace.
// * ctx: context for cancelation
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (mc *MarketPlaceController) ChownContext(ctx context.Context, userID, groupID int) error {
	_, err := mc.c.Client.CallContext(ctx, "one.market.chown", mc.ID, userID, groupID)
	return err
}

// Rename renames a marketplace.
// * newName: The new name.
func (mc *MarketPlaceController) Rename(newName string) error {
	return mc.RenameContext(context.Background(), newName)
}

// RenameContext renames a marketplace.
// * ctx: context for cancelation
// * newName: The new name.
func (mc *MarketPlaceController) RenameContext(ctx context.Context, newName string) error {
	_, err := mc.c.Client.CallContext(ctx, "one.market.rename", mc.ID, newName)
	return err
}
