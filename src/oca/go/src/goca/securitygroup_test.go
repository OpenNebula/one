package goca

import (
    "testing"
    "strings"
)

var sgTpl = `
NAME = "ssh-test"
RULE = [
  PROTOCOL = "TCP",
  RANGE = 22,
  RULE_TYPE = "inbound"
]
RULE = [
  PROTOCOL = "TCP",
  RULE_TYPE = "outbound"
]
`

// Helper to create a Security Group
func createSecurityGroup(t *testing.T) *SecurityGroup {
	id, err := CreateSecurityGroup(sgTpl)
	if err != nil {
		t.Error(err)
	}

	// Get Security Group by ID
	secgroup := NewSecurityGroup(id)

	err = secgroup.Info()
	if err != nil {
		t.Error(err)
	}

	return secgroup
}

func TestSecurityGroup(t *testing.T) {
	secgroup := createSecurityGroup(t)

	idParse, err := GetID(t, secgroup, "SECURITY_GROUP")
	if err != nil {
		t.Error(err)
	}

	if idParse != secgroup.ID {
		t.Errorf("Security Group ID does not match")
	}

	// Get security group by Name
	name, ok := secgroup.XPath("/SECURITY_GROUP/NAME")
	if !ok {
		t.Errorf("Could not get name")
	}

	secgroup, err = NewSecurityGroupFromName(name)
	if err != nil {
		t.Error(err)
	}

	err = secgroup.Info()
	if err != nil {
		t.Error(err)
	}

	idParse, err = GetID(t, secgroup, "SECURITY_GROUP")

	if idParse != secgroup.ID {
		t.Errorf("Security Group ID does not match")
	}

    // Change Owner to user call
    err = secgroup.Chown(-1, -1)
	if err != nil {
		t.Error(err)
	}
	
    err = secgroup.Info()
	if err != nil {
		t.Error(err)
	}

	// Get Security Group Owner Name
	uname, ok := secgroup.XPath("/SECURITY_GROUP/UNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

	// Get Security Group owner group Name
	gname, ok := secgroup.XPath("/SECURITY_GROUP/GNAME")
	if !ok {
		t.Errorf("Could not get group name")
	}

    // Compare with caller username
    caller := strings.Split(client.token, ":")[0]
    if caller != uname {
        t.Error("Caller user and security group owner user mismatch")
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
    err = secgroup.Chown(0, 0)
	if err != nil {
		t.Error(err)
	}
	
    err = secgroup.Info()
	if err != nil {
		t.Error(err)
	}

	// Get Security Group Owner Name
	uname, ok = secgroup.XPath("/SECURITY_GROUP/UNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

	// Get Security Group Owner Name
	gname, ok = secgroup.XPath("/SECURITY_GROUP/GNAME")
	if !ok {
		t.Errorf("Could not get user name")
	}

    if "oneadmin" != uname {
		t.Error("Security group owner is not oneadmin")
	}

    // Compare with caller group
    if "oneadmin" != gname {
        t.Error("Security group owner group is not oneadmin")
    }

	// Delete template
	err = secgroup.Delete()
	if err != nil {
		t.Error(err)
	}
}
