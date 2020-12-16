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
	"strconv"
	"testing"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/image"
	imgkeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/image/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace"
	mktkeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace/keys"
	mktapp "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplaceapp"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplaceapp/keys"
)

func TestMarketplaceApp(t *testing.T) {
	var mkt_app_name string = "new_mkt_app"
	var mkt_app *mktapp.MarketPlaceApp
	var mkt_img_id int
	var market_id int
	var err error

	mkt_app_tmpl := mktapp.NewTemplate()
	mkt_app_tmpl.Add(keys.Name, mkt_app_name)
	mkt_app_tmpl.Add(keys.Size, "1")
	mkt_app_tmpl.SetType(mktapp.Image)

	//Create an image

	img_tmpl := image.NewTemplate()

	img_tmpl.Add(imgkeys.Name, "test_img_go")
	img_tmpl.Add(imgkeys.Size, "1")
	img_tmpl.SetType(image.Datablock)

	mkt_img_id, err = testCtrl.Images().Create(img_tmpl.String(), 1)
	if err != nil {
		t.Fatalf("Test failed:\n" + err.Error())
	}

	WaitResource(func() bool {
		id, _ := testCtrl.Images().ByName("test_img_go")
		img, _ := testCtrl.Image(id).Info(false)

		state, _ := img.State()

		return state == image.Ready
	})

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	mkt_app_tmpl.Add(keys.OriginID, strconv.Itoa(int(mkt_img_id)))

	//Create a marketplace

	mkt_tmpl := marketplace.NewTemplate()
	mkt_tmpl.Add(mktkeys.Name, "mkt-app-test")
	mkt_tmpl.Add(mktkeys.MarketMAD, "http")
	mkt_tmpl.Add(mktkeys.BaseUrl, "http://url/")
	mkt_tmpl.Add(mktkeys.PublicDir, "/var/loca/market-http")

	market_id, err = testCtrl.MarketPlaces().Create(mkt_tmpl.String())

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	mkt_app_tmpl.Add(keys.MarketPlaceID, strconv.Itoa(int(market_id)))
	//Create MarketplaceApp
	app_id, err := testCtrl.MarketPlaceApps().Create(mkt_app_tmpl.String(), int(market_id))

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	mkt_app, err = testCtrl.MarketPlaceApp(app_id).Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual := mkt_app.Name

	if actual != mkt_app_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", mkt_app_name, actual)
	}

	//Delete MarketplaceApp
	err = testCtrl.MarketPlaceApp(app_id).Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	//delete image
	err = testCtrl.Image(mkt_img_id).Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	//delete marketplace
	err = testCtrl.MarketPlace(market_id).Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}
}
