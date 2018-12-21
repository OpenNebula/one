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
func createVirtualNetwork(t *testing.T) *VirtualNetwork {
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

	return vnet
}

func TestVirtualNetwork(t *testing.T) {
	vnet := createVirtualNetwork(t)

	idParse, err := GetID(t, vnet, "VNET")
	if err != nil {
		t.Error(err)
	}

	if idParse != vnet.ID {
		t.Errorf("Virtual Network ID does not match")
	}

	// Get virtual network by Name
	name, ok := vnet.XPath("/VNET/NAME")
	if !ok {
		t.Errorf("Could not get name")
	}

	vnet, err = NewVirtualNetworkFromName(name)
	if err != nil {
		t.Fatal(err)
	}

	err = vnet.Info()
	if err != nil {
		t.Error(err)
	}

	idParse, err = GetID(t, vnet, "VNET")

	if idParse != vnet.ID {
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
	uname, ok := vnet.XPath("/VNET/UNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

	// Get Virtual Network owner group Name
	gname, ok := vnet.XPath("/VNET/GNAME")
	if !ok {
		t.Errorf("Could not get group name")
	}

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
	uname, ok = vnet.XPath("/VNET/UNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

	// Get Virtual Network Owner Name
	gname, ok = vnet.XPath("/VNET/GNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

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
