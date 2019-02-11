package goca

import (
    "testing"
    "strings"
)

var vnTpl = `
NAME = "vntest"
BRIDGE = "vnetbr"
PHYDEV = "eth0"
SECURITY_GROUPS = 0
VLAN_ID = 8000042
VN_MAD = "vxlan"
`

// Helper to create a Virtual Network
func createVirtualNetwork(t *testing.T) (*VirtualNetwork, uint) {
	id, err := CreateVirtualNetwork(vnTpl, -1)
	if err != nil {
		t.Error(err)
	}

	// Get Virtual Network by ID
	vnet := NewVirtualNetwork(id)

	err = vnet.Info()
	if err != nil {
		t.Error(err)
	}

	return vnet, id
}

func TestVirtualNetwork(t *testing.T) {
	var err error

	vnet, idOrig := createVirtualNetwork(t)

	idParse := vnet.ID
	if idParse != idOrig {
		t.Errorf("Virtual Network ID does not match")
	}

	// Get virtual network by Name
	name := vnet.Name

	vnet, err = NewVirtualNetworkFromName(name)
	if err != nil {
		t.Fatal(err)
	}

	err = vnet.Info()
	if err != nil {
		t.Error(err)
	}

	idParse = vnet.ID
	if idParse != idOrig {
		t.Errorf("Virtual Network ID does not match")
	}

    // Change Owner to user call
    err = vnet.Chown(-1, -1)
	if err != nil {
		t.Error(err)
	}
	
    err = vnet.Info()
	if err != nil {
		t.Error(err)
	}

	// Get Virtual Network Owner Name
	uname := vnet.UName

	// Get Image owner group Name
	gname := vnet.GName

    // Compare with caller username
    caller := strings.Split(client.token, ":")[0]
    if caller != uname {
        t.Error("Caller user and virtual network owner user mismatch")
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
    err = vnet.Chown(1, 1)
	if err != nil {
		t.Error(err)
	}

    err = vnet.Info()
	if err != nil {
		t.Error(err)
	}

	// Get Virtual Network Owner Name
	uname = vnet.UName

	// Get Image owner group Name
	gname = vnet.GName

    if "serveradmin" != uname {
		t.Error("Virtual network owner is not oenadmin")
	}

    // Compare with caller group
    if "users" != gname {
        t.Error("Virtual network owner group is not oneadmin")
    }

	// Delete template
	err = vnet.Delete()
	if err != nil {
		t.Error(err)
	}
}
