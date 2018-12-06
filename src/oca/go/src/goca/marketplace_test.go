package goca

import (
    "testing"
    "strings"
)

var mpTpl = `
NAME = "MPTEST"
MARKET_MAD = "http"
ZONE_ID = 0
BASE_URL = "http://frontend.opennebula.org/"
PUBLIC_DIR = "/var/loca/market-http"
BRIDGE_LIST = "web-server.opennebula.org"
`

// Helper to create a Marketplace
func createMarketPlace(t *testing.T) *MarketPlace {
	id, err := CreateMarketPlace(mpTpl)
	if err != nil {
		t.Error(err)
	}

	// Get Marketplace by ID
	mp := NewMarketPlace(id)

	err = mp.Info()
	if err != nil {
		t.Error(err)
	}

	return mp
}

func TestMarketPlace(t *testing.T) {
	mp := createMarketPlace(t)

	idParse, err := GetID(t, mp, "MARKETPLACE")
	if err != nil {
		t.Error(err)
	}

	if idParse != mp.ID {
		t.Errorf("Marketplace ID does not match")
	}

	// Get security group by Name
	name, ok := mp.XPath("/MARKETPLACE/NAME")
	if !ok {
		t.Errorf("Could not get name")
	}

	mp, err = NewMarketPlaceFromName(name)
	if err != nil {
		t.Error(err)
	}

	err = mp.Info()
	if err != nil {
		t.Error(err)
	}

	idParse, err = GetID(t, mp, "MARKETPLACE")

	if idParse != mp.ID {
		t.Errorf("Marketplace ID does not match")
	}

    // Change Owner to user call
    err = mp.Chown(-1, -1)
	if err != nil {
		t.Error(err)
	}
	
    err = mp.Info()
	if err != nil {
		t.Error(err)
	}

	// Get Marketplace Owner Name
	uname, ok := mp.XPath("/MARKETPLACE/UNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

	// Get Marketplace owner group Name
	gname, ok := mp.XPath("/MARKETPLACE/GNAME")
	if !ok {
		t.Errorf("Could not get group name")
	}

    // Compare with caller username
    caller := strings.Split(client.token, ":")[0]
    if caller != uname {
        t.Error("Caller user and marketplace owner user mismatch")
    }

    group, err := GetUserGroup(t, caller)
	if err != nil {
        t.Error("Cannot retreive caller group")
	}

    // Compare with caller group
    if group != gname {
        t.Error("Caller group and security group owner group mismatch")
    }

    // Change Owner to oneadmin call
    err = mp.Chown(0, 0)
	if err != nil {
		t.Error(err)
	}
	
    err = mp.Info()
	if err != nil {
		t.Error(err)
	}

	// Get Marketplace Owner Name
	uname, ok = mp.XPath("/MARKETPLACE/UNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

	// Get Marketplace Owner Name
	gname, ok = mp.XPath("/MARKETPLACE/GNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

    if "oneadmin" != uname {
		t.Error("MarketPlace owner is not oneadmin")
	}

    // Compare with caller group
    if "oneadmin" != gname {
        t.Error("MarketPlace owner group is not oneadmin")
    }

	// Delete template
	err = mp.Delete()
	if err != nil {
		t.Error(err)
	}
}
