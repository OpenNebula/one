package goca

import (
	"testing"
)

func TestMarketplace(t *testing.T){
	var mkt_name string = "marketplace_test_go"

	var market *MarketPlace

	var mkt_template string =  "NAME = \"" + mkt_name + "\"\n" +
							"MARKET_MAD = \"http\"\n" +
							"BASE_URL = \"http://url/\"\n" +
							"PUBLIC_DIR = \"/var/loca/market-http\""

	//Create Marketpkace
	market_id, err := CreateMarketPlace(mkt_template)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market = NewMarketPlace(market_id)
	market.Info()

	actual := market.Name

	if actual != mkt_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", mkt_name, actual)
	}

	tmpl := "ATT1 = \"VAL1\""

	//Update Marketpkace
	err = market.Update(tmpl, 1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market.Info()

	actual_mm := market.MarketMad
	actual_1, err := market.Template.Dynamic.GetContentByName("ATT1")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "ATT1", err.Error())
	} else {
		if actual_1 != "VAL1" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL1", actual_1)
		}
	}

	if actual_mm != "http" {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", "http", actual_mm)
	}

	//Change permissions for Marketpkace
	err = market.Chmod(1,1,1,1,1,1,1,1,1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market.Info()

	expected_perm := Permissions{ 1, 1, 1, 1, 1, 1, 1, 1, 1 }
	actual_perm := *market.Permissions

	if actual_perm != expected_perm {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", expected_perm.String(), actual_perm.String())
	}

	//Change owner of Marketpkace
	err = market.Chown(1,1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market.Info()

	expected_usr := 1
	expected_grp := 1
	actual_usr := market.UID
	actual_grp := market.GID

	if actual_usr != expected_usr {
		t.Errorf("Test failed, expected: '%d', got:  '%d'", expected_usr, actual_usr)
	}

	if actual_grp != expected_grp {
		t.Errorf("Test failed, expected: '%d', got:  '%d'", expected_grp, actual_grp)
	}

	rename := mkt_name + "-renamed"

	//Rename Marketpkace
	err = market.Rename(rename)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market.Info()

	actual = market.Name

	if actual != rename {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", rename, actual)
	}

	//Delete Marketpkace
	err = market.Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}
}