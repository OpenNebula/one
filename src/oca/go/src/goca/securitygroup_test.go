package goca

import (
	"testing"
	"goca"
)

func TestSGAllocate(t *testing.T){
	var sg_name string = "new_test_sg"
	var sg *goca.SecurityGroup
	var sg_template string =  "NAME = \"" + sg_name + "\"\n" +
							"DESCRIPTION  = \"test security group\"\n"+
							"ATT1 = \"VAL1\"\n" +
							"ATT2 = \"VAL2\""

	//Create SG
	sg_id, err := goca.CreateSecurityGroup(sg_template)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	sg = goca.NewSecurityGroup(sg_id)
	sg.Info()

	actual, _:= sg.XMLResource.XPath("/SECURITY_GROUP/NAME")

	if actual != sg_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", sg_name, actual)
	}

	tmpl := "ATT3 = \"VAL3\""

	//Update SG
	err = sg.Update(tmpl, 1)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	sg.Info()

	actual_1, _ := sg.XMLResource.XPath("/SECURITY_GROUP/TEMPLATE/ATT1")
	actual_3, _ := sg.XMLResource.XPath("/SECURITY_GROUP/TEMPLATE/ATT3")

	if actual_1 != "VAL1" {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL1", actual_1)
	}

	if actual_3 != "VAL3" {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL3", actual_3)
	}

	clone_name := sg_name + "-cloned"

	//Clone SG
	clone_id, err := sg.Clone(clone_name)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	clone := goca.NewSecurityGroup(clone_id)
	clone.Info()

	actual, _ = clone.XMLResource.XPath("/SECURITY_GROUP/NAME")

	if actual != clone_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", clone_name, actual)
	}

	clone.Delete()

	//Change permission of SG
	err = sg.Chmod(1,1,1,1,1,1,1,1,1)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	sg.Info()

	expected := "111111111"
	actual, _ = sg.XMLResource.XPath("/SECURITY_GROUP/PERMISSIONS")

	if actual != expected {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", expected, actual)
	}

	//Change owner of SG
	err = sg.Chown(1,1)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	sg.Info()

	expected_usr := "1"
	expected_grp := "1"
	actual_usr, _ := sg.XMLResource.XPath("/SECURITY_GROUP/UID")
	actual_grp, _ := sg.XMLResource.XPath("/SECURITY_GROUP/GID")

	if actual_usr != expected_usr {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", expected_usr, actual_usr)
	}

	if actual_grp != expected_grp {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", expected_grp, actual_grp)
	}

	//Rename SG
	rename := sg_name + "-renamed"
	err = sg.Rename(rename)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	sg.Info()

	actual, _ = sg.XMLResource.XPath("/SECURITY_GROUP/NAME")

	if actual != rename {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", rename, actual)
	}

	//Delete SG
	err = sg.Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}
}
