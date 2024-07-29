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

package goca

import (
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/image"
	imgkeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/image/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace"
	mktkeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace/keys"
	mktapp "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplaceapp"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplaceapp/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

type MarketPlaceAppSuite struct {
	marketID    int
	imgID       int
	appID       int
	appName     string
}

var _ = Suite(&MarketPlaceAppSuite{})

func (s *MarketPlaceAppSuite) SetUpSuite(c *C) {
	// Create a marketplace
	mkt_tmpl := marketplace.NewTemplate()
	mkt_tmpl.Add(mktkeys.Name, "mkt-app-test")
	mkt_tmpl.Add(mktkeys.MarketMAD, "http")
	mkt_tmpl.Add(mktkeys.BaseUrl, "http://url/")
	mkt_tmpl.Add(mktkeys.PublicDir, "/var/local/market-http")

	id, err := testCtrl.MarketPlaces().Create(mkt_tmpl.String())

	c.Assert(err, IsNil)
	s.marketID = id

	// Create an image
	img_tmpl := image.NewTemplate()

	img_tmpl.Add(imgkeys.Name, "test_img_go")
	img_tmpl.Add(imgkeys.Size, "1")
	img_tmpl.SetType(image.Datablock)

	s.imgID, err = testCtrl.Images().Create(img_tmpl.String(), 1)
	c.Assert(err, IsNil)

	WaitResource(func() bool {
		id, _ := testCtrl.Images().ByName("test_img_go")
		img, _ := testCtrl.Image(id).Info(false)

		state, _ := img.State()

		return state == image.Ready
	})
}

func (s *MarketPlaceAppSuite) TearDownSuite(c *C) {
	// Delete image
	err := testCtrl.Image(s.imgID).Delete()
	c.Assert(err, IsNil)

	// Delete marketplace
	err = testCtrl.MarketPlace(s.marketID).Delete()
	c.Assert(err, IsNil)
}

func (s *MarketPlaceAppSuite) SetUpTest(c *C) {
	// Create Marketplace App
	s.appName = "new_mkt_app"

	mkt_app_tmpl := mktapp.NewTemplate()
	mkt_app_tmpl.Add(keys.Name, s.appName)
	mkt_app_tmpl.Add(keys.Size, "1")
	mkt_app_tmpl.SetType(mktapp.Image)
	mkt_app_tmpl.Add(keys.OriginID, s.imgID)
	mkt_app_tmpl.Add(keys.MarketPlaceID, s.marketID)

	app_id, err := testCtrl.MarketPlaceApps().Create(mkt_app_tmpl.String(), s.marketID)

	c.Assert(err, IsNil)
	s.appID = app_id
}

func (s *MarketPlaceAppSuite) TearDownTest(c *C) {
	// Delete Marketplace App
	appC := testCtrl.MarketPlaceApp(s.appID)
	appC.Delete()

	// Wait App deleted
	WaitResource(func() bool {
		_, err := appC.Info(false)

		return err != nil
	})
}

func (s *MarketPlaceAppSuite) TestGetByNameAndID(c *C) {
	// Get MarketPlace App by ID
	app, err := testCtrl.MarketPlaceApp(s.appID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(app.ID, Equals, s.appID)
	c.Assert(app.Name, Equals, s.appName)

	state, err := app.State()
	c.Assert(err, IsNil)
	c.Assert(state, Equals, mktapp.Locked);

	// Get MarketPlace App by Name
	id, err := testCtrl.MarketPlaceApps().ByName(s.appName)
	c.Assert(err, IsNil)
	c.Assert(id, Equals, s.appID)
}

func (s *MarketPlaceAppSuite) TestUpdate(c *C) {
	appC := testCtrl.MarketPlaceApp(s.appID)
	err := appC.Update(`DESCRIPTION = "Testing"`, parameters.Merge)

	c.Assert(err, IsNil)

	app, err := testCtrl.MarketPlaceApp(s.appID).Info(false)
	c.Assert(err, IsNil)

	descr, err := app.Template.Get(keys.Description)

	c.Assert(err, IsNil)
	c.Assert(descr, Equals, "Testing")
}

func (s *MarketPlaceAppSuite) TestRename(c *C) {
	appC := testCtrl.MarketPlaceApp(s.appID)
	appC.Rename("new_name")

	app, err := testCtrl.MarketPlaceApp(s.appID).Info(false)
	c.Assert(err, IsNil)
	c.Assert(app.Name, Equals, "new_name");
}

func (s *MarketPlaceAppSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	appC := testCtrl.MarketPlaceApp(s.appID)
	err := appC.Chown(1, 1)

	c.Assert(err, IsNil)
}

func (s *MarketPlaceAppSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	appC := testCtrl.MarketPlaceApp(s.appID)

	err := appC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	app, err := appC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(*app.Permissions, Equals, new_permissions);
}

func (s *MarketPlaceAppSuite) TestLock(c *C) {
	// Lock
	appC := testCtrl.MarketPlaceApp(s.appID)
	err := appC.Lock(shared.LockUse)

	c.Assert(err, IsNil)

	app, err := appC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(app.LockInfos.Locked, Equals, 1);

	// Unlock
	err = appC.Unlock()
	c.Assert(err, IsNil)

	app, err = appC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(app.LockInfos, IsNil)
}

func (s *MarketPlaceAppSuite) TestEnable(c *C) {
	id, err := testCtrl.MarketPlaceApps().ByName("Custom via netboot.xyz")
	c.Assert(err, IsNil)

	// Disable
	appC := testCtrl.MarketPlaceApp(id)
	err = appC.Enable(false)
	c.Assert(err, IsNil)

	app, err := appC.Info(false)
	c.Assert(err, IsNil)

	state, err := app.State()
	c.Assert(err, IsNil)
	c.Assert(state, Equals, mktapp.Disabled);

	// Enable
	err = appC.Enable(true)
	c.Assert(err, IsNil)

	app, err = appC.Info(false)
	c.Assert(err, IsNil)

	state, err = app.State()
	c.Assert(err, IsNil)
	c.Assert(state, Equals, mktapp.Ready);
}
