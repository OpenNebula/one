package goca

import (
	"testing"
	"strconv"
)

func TestMarketplaceApp(t *testing.T){
	var mkt_app_name string = "new_mkt_app"
	var mkt_app *MarketPlaceApp
	var mkt_app_tmpl string
	var mkt_img_id uint
	var market_id  uint
	var err error

	mkt_app_tmpl = "NAME= \"" + mkt_app_name + "\"\n" +
					"TYPE=image\n"

	//Create an image
	img_tmpl := "NAME = \"test_img_go" + "\"\n" +
	"TYPE = DATABLOCK\n" +
	"SIZE = 1\n"

	mkt_img_id, err = testCtrl.Images().Create(img_tmpl, 1)
	if err != nil {
	    t.Fatalf("Test failed:\n" + err.Error())
	}

	WaitResource(func() bool{
		id, _ := testCtrl.ImageByName("test_img_go")
		img, _ := testCtrl.Image(id).Info()

		state, _ := img.State()

		return state == ImageReady
	})

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	mkt_app_tmpl += "ORIGIN_ID=" + strconv.Itoa(int(mkt_img_id)) + "\n"

	//Create a marketplace
	mkt_tmpl := "NAME = \"mkt-app-test\"\n" +
	"MARKET_MAD = \"http\"\n" +
	"BASE_URL = \"http://url/\"\n" +
	"PUBLIC_DIR = \"/var/loca/market-http\"\n"

	market_id, err = testCtrl.MarketPlaces().Create(mkt_tmpl)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	mkt_app_tmpl += "MARKETPLACE_ID=\"" + strconv.Itoa(int(market_id)) + "\"\n"

	//Create MarketplaceApp
	app_id, err := testCtrl.MarketPlaceApps().Create(mkt_app_tmpl, int(market_id))

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	mkt_app, err = testCtrl.MarketPlaceApp(app_id).Info()
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
