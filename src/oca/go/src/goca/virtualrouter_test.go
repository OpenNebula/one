package goca

import (
	"testing"
)



func TestVirtualRouter(t *testing.T){
	var vr_name string = "new_vr"
	var vr *VirtualRouter
	var vr_template string = "NAME = \"" + vr_name + "\"\n" +
							"VROUTER = YES\n" +
							"ATT1 = \"VAL1\"\n" +
							"ATT2 = \"VAL2\""

	//Create VirtualRouter
	vr_id, err := CreateVirtualRouter(vr_template)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	vr = NewVirtualRouter(vr_id)
	vr.Info()

	actual := vr.Name

	if actual != vr_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", vr_name, actual)
	}

	tmpl := "ATT3 = \"VAL3\""

	//Update VirtualRouter
	err = vr.Update(tmpl, 1)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	vr.Info()

	actual_1, err := vr.Template.Dynamic.GetContentByName("ATT1")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "ATT1", err.Error())
	} else {
		if actual_1 != "VAL1" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL1", actual_1)
		}
	}

	actual_3, err := vr.Template.Dynamic.GetContentByName("ATT3")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "ATT3", err.Error())
	} else {
		if actual_3 != "VAL3" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL3", actual_3)
		}
	}

	//Change permissions of VirtualRouter
	err = vr.Chmod(1,1,1,1,1,1,1,1,1)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	vr.Info()

	expected_perm := Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}
	actual_perm := vr.Permissions

	if actual_perm == nil || *actual_perm != expected_perm {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", expected_perm.String(), actual_perm.String())
	}

	//Change owner of VirtualRouter
	err = vr.Chown(1,1)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	vr.Info()

	expected_usr := 1
	expected_grp := 1
	actual_usr := vr.UID
	actual_grp := vr.GID

	if actual_usr != expected_usr {
		t.Errorf("Test failed, expected: '%d', got:  '%d'", expected_usr, actual_usr)
	}

	if actual_grp != expected_grp {
		t.Errorf("Test failed, expected: '%d', got:  '%d'", expected_grp, actual_grp)
	}

	rename := vr_name + "-renamed"

	//Rename VirtualRouter
	err = vr.Rename(rename)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	vr.Info()

	actual = vr.Name

	if actual != rename {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", rename, actual)
	}

	tmpl = "NAME = vrtemplate\n"+
		   "CPU = 0.1\n"+
		   "VROUTER = YES\n"+
		   "MEMORY = 64\n"

	tmpl_id, err := CreateTemplate(tmpl)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	//Instantiate VirtualRouter
	vr.Instantiate(1, int(tmpl_id), "vr_test_go", false, "")

	vm, err := NewVMFromName("vr_test_go")

	if err != nil {
	    t.Fatal("Test failed:\n" + err.Error())
	}

	vm.TerminateHard()
	template := NewTemplate(tmpl_id)

	template.Delete()

	vn_tmpl := "NAME = \"go-net\"\n"+
			   "BRIDGE = vbr0\n" +
			   "VN_MAD = dummy\n"

	vnet_id, _ := CreateVirtualNetwork(vn_tmpl, 0)

	nic_tmpl := "NIC = [ NETWORK=\"go-net\" ]"

	//Attach nic to VirtualRouter
	err = vr.AttachNic(nic_tmpl)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	vr.Info()

	if len(vr.Template.NIC) == 0{
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "NIC", err.Error())
	} else {
		actualNetName, _ :=  vr.Template.NIC[0].Dynamic.GetContentByName("NETWORK")

		if actualNetName != "go-net" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "go-net", actualNetName)
		}
	}

	vnet := NewVirtualNetwork(vnet_id)
	vnet.Delete()

	//Detach nic from VirtualRouter
	err = vr.DetachNic(0)

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	//LockAll for VirtualRouter
	err = vr.LockAll()

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	vr.Info()

	actualLock := vr.LockInfos
	if actualLock == nil {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", "LockInfos", "nil")
	}
	if actualLock.Locked != 4 {
		t.Errorf("Test failed, expected: '%d', got:  '%d'", 4, actualLock.Locked)
	}

	//Unlock VirtualRouter
	err = vr.Unlock()

	if err != nil {
	    t.Errorf("Test failed:\n" + err.Error())
	}

	vr.Info()

	actualLock = vr.LockInfos
	if actualLock != nil {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", "nil", "LockInfos")
	}

	//Delete VirtualRouter
	err = vr.Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}
}