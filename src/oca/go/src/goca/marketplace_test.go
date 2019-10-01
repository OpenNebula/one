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
	"testing"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/marketplace"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

func TestMarketplace(t *testing.T) {
	var mkt_name string = "marketplace_test_go"

	var market *marketplace.MarketPlace

	var mkt_template string = "NAME = \"" + mkt_name + "\"\n" +
		"MARKET_MAD = \"http\"\n" +
		"BASE_URL = \"http://url/\"\n" +
		"PUBLIC_DIR = \"/var/loca/market-http\""

	//Create Marketpkace
	market_id, err := testCtrl.MarketPlaces().Create(mkt_template)
	if err != nil {
		t.Fatalf("Test failed:\n" + err.Error())
	}

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	marketCtrl := testCtrl.MarketPlace(market_id)
	market, err = marketCtrl.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual := market.Name

	if actual != mkt_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", mkt_name, actual)
	}

	tmpl := "ATT1 = \"VAL1\""

	//Update Marketpkace
	err = marketCtrl.Update(tmpl, 1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market, err = marketCtrl.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

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
	err = marketCtrl.Chmod(&shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1})

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market, err = marketCtrl.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	expected_perm := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}
	actual_perm := *market.Permissions

	if actual_perm != expected_perm {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", expected_perm.String(), actual_perm.String())
	}

	//Change owner of Marketpkace
	err = marketCtrl.Chown(1, 1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market, err = marketCtrl.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

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
	err = marketCtrl.Rename(rename)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	market, err = marketCtrl.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual = market.Name

	if actual != rename {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", rename, actual)
	}

	//Delete Marketpkace
	err = marketCtrl.Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}
}
