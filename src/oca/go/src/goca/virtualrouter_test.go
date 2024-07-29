/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	vn "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork"
	vnkeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork/keys"
	vrouter "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualrouter"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualrouter/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	vmkeys "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
)

func TestVirtualRouter(t *testing.T) {
	var vr_name string = "new_vr"
	var vr *vrouter.VirtualRouter

	vr_template := vrouter.NewTemplate()
	vr_template.Add(keys.Name, vr_name)
	vr_template.AddPair("ATT1", "VAL1")
	vr_template.AddPair("ATT2", "VAL2")

	//Create VirtualRouter
	vr_id, err := testCtrl.VirtualRouters().Create(vr_template.String())

	if err != nil {
		t.Fatalf("Test failed:\n" + err.Error())
	}

	vrC := testCtrl.VirtualRouter(vr_id)
	vr, err = vrC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual := vr.Name

	if actual != vr_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", vr_name, actual)
	}

	tmpl := "ATT3 = \"VAL3\""

	//Update VirtualRouter
	err = vrC.Update(tmpl, 1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	vr, err = vrC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual_1, err := vr.Template.GetStr("ATT1")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "ATT1", err.Error())
	} else {
		if actual_1 != "VAL1" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL1", actual_1)
		}
	}

	actual_3, err := vr.Template.GetStr("ATT3")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "ATT3", err.Error())
	} else {
		if actual_3 != "VAL3" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL3", actual_3)
		}
	}

	//Change permissions of VirtualRouter
	err = vrC.Chmod(shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1})

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	vr, err = vrC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	expected_perm := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}
	actual_perm := vr.Permissions

	if actual_perm == nil || *actual_perm != expected_perm {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", expected_perm.String(), actual_perm.String())
	}

	//Change owner of VirtualRouter
	err = vrC.Chown(1, 1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	vr, err = vrC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

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
	err = vrC.Rename(rename)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	vr, err = vrC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual = vr.Name

	if actual != rename {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", rename, actual)
	}

	vrTmpl := vm.NewTemplate()
	vrTmpl.Add(vmkeys.Name, "vrtemplate")
	vrTmpl.Add(vmkeys.VRouter, "YES")
	vrTmpl.CPU(0.1).Memory(64)

	tmpl_id, err := testCtrl.Templates().Create(vrTmpl.String())
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	//Instantiate VirtualRouter
	vrC.Instantiate(1, int(tmpl_id), "vr_test_go", false, "")

	id, err := testCtrl.VMs().ByName("vr_test_go")
	if err != nil {
		t.Fatal("Test failed:\n" + err.Error())
	}

	err = testCtrl.VM(id).TerminateHard()
	if err != nil {
		t.Fatal("Test failed:\n" + err.Error())
	}

	template := testCtrl.Template(tmpl_id)

	template.Delete()

	vn_tmpl := vn.NewTemplate()
	vn_tmpl.Add(vnkeys.Name, "go-net")
	vn_tmpl.Add(vnkeys.Bridge, "vbr0")
	vn_tmpl.Add(vnkeys.VNMad, "dummy")

	vnet_id, _ := testCtrl.VirtualNetworks().Create(vn_tmpl.String(), 0)

	nic_tmpl := shared.NewNIC()
	nic_tmpl.Add(shared.Network, "go-net")

	//Attach nic to VirtualRouter
	err = vrC.AttachNic(nic_tmpl.String())

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	vr, err = vrC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	nics := vr.Template.GetVectors(string(shared.NICVec))
	if len(nics) == 0 {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "NIC", err.Error())
	} else {
		actualNetName, _ := nics[0].GetStr("NETWORK")

		if actualNetName != "go-net" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "go-net", actualNetName)
		}
	}

	err = testCtrl.VirtualNetwork(vnet_id).Delete()
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	//Detach nic from VirtualRouter
	err = vrC.DetachNic(0)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	//LockUse for VirtualRouter
	err = vrC.Lock(shared.LockUse)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	vr, err = vrC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actualLock := vr.LockInfos
	if actualLock == nil {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", "LockInfos", "nil")
	}
	if actualLock.Locked != int(shared.LockUse) {
		t.Errorf("Test failed, expected: '%d', got:  '%d'", shared.LockUse, actualLock.Locked)
	}

	//Unlock VirtualRouter
	err = vrC.Unlock()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	vr, err = vrC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actualLock = vr.LockInfos
	if actualLock != nil {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", "nil", "LockInfos")
	}

	//Delete VirtualRouter
	err = vrC.Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}
}
