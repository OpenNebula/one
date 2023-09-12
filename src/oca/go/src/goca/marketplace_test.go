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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

type MarketPlaceSuite struct {
	marketName string
	marketID   int
}

var _ = Suite(&MarketPlaceSuite{})

func (s *MarketPlaceSuite) SetUpTest(c *C) {
	// Create Marketpkace
	s.marketName = "marketplace_test_go"

	tpl := marketplace.NewTemplate()
	tpl.Add(keys.Name, s.marketName)
	tpl.Add(keys.MarketMAD, "http")
	tpl.Add(keys.BaseUrl, "http://url/")
	tpl.Add(keys.PublicDir, "/var/local/market-http")

	id, err := testCtrl.MarketPlaces().Create(tpl.String())
	c.Assert(err, IsNil)
	s.marketID = id
}

func (s *MarketPlaceSuite) TearDownTest(c *C) {
	// Delete Marketpkace
	marketC := testCtrl.MarketPlace(s.marketID)
	err := marketC.Delete()

	c.Assert(err, IsNil)
}

func (s *MarketPlaceSuite) TestGetByNameAndID(c *C) {
	// Get MarketPlace by ID
	market, err := testCtrl.MarketPlace(s.marketID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(market.ID, Equals, s.marketID)
	c.Assert(market.Name, Equals, s.marketName)
	c.Assert(market.MarketMad, Equals, "http")

	state, err := market.State()
	c.Assert(err, IsNil)
	c.Assert(state, Equals, marketplace.Enabled);

	// Test value from MarketPlace template
	baseUrl, err := market.Template.Get(keys.BaseUrl)

	c.Assert(err, IsNil)
	c.Assert(baseUrl, Equals, "http://url/")

	// Get Backup Job by Name
	id, err := testCtrl.MarketPlaces().ByName(s.marketName)
	c.Assert(err, IsNil)
	c.Assert(id, Equals, s.marketID)
}

func (s *MarketPlaceSuite) TestUpdate(c *C) {
	marketC := testCtrl.MarketPlace(s.marketID)
	err := marketC.Update(`ATT1 = "VAL1"`, parameters.Merge)

	c.Assert(err, IsNil)

	market, err := testCtrl.MarketPlace(s.marketID).Info(false)
	c.Assert(err, IsNil)

	att, err := market.Template.Get("ATT1")

	c.Assert(err, IsNil)
	c.Assert(att, Equals, "VAL1")
	c.Assert(market.MarketMad, Equals, "http")
}

func (s *MarketPlaceSuite) TestRename(c *C) {
	marketC := testCtrl.MarketPlace(s.marketID)
	marketC.Rename("new_name")

	market, err := testCtrl.MarketPlace(s.marketID).Info(false)
	c.Assert(err, IsNil)
	c.Assert(market.Name, Equals, "new_name");
}

func (s *MarketPlaceSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	marketC := testCtrl.MarketPlace(s.marketID)
	err := marketC.Chown(1, 1)

	c.Assert(err, IsNil)

	market, err := testCtrl.MarketPlace(s.marketID).Info(false)
	c.Assert(err, IsNil)
	c.Assert(market.UID, Equals, 1);
	c.Assert(market.GID, Equals, 1);
}

func (s *MarketPlaceSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	marketC := testCtrl.MarketPlace(s.marketID)

	err := marketC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	market, err := marketC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(*market.Permissions, Equals, new_permissions);
}

func (s *MarketPlaceSuite) TestEnable(c *C) {
	// Disable
	marketC := testCtrl.MarketPlace(s.marketID)
	err := marketC.Enable(false)
	c.Assert(err, IsNil)

	market, err := marketC.Info(false)
	c.Assert(err, IsNil)

	state, err := market.State()
	c.Assert(err, IsNil)
	c.Assert(state, Equals, marketplace.Disabled);

	// Enable
	err = marketC.Enable(true)
	c.Assert(err, IsNil)

	market, err = marketC.Info(false)
	c.Assert(err, IsNil)

	state, err = market.State()
	c.Assert(err, IsNil)
	c.Assert(state, Equals, marketplace.Enabled);
}
