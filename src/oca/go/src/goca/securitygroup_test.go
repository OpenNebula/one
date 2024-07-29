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

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/securitygroup"
	secgroup "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/securitygroup"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/securitygroup/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

func TestSGAllocate(t *testing.T) {
	var sg_name string = "new_test_sg"
	var sg *securitygroup.SecurityGroup

	sg_template := secgroup.NewTemplate()
	sg_template.Add(keys.Name, sg_name)
	sg_template.Add(keys.Description, "test security group")
	sg_template.AddPair("ATT1", "VAL1")
	sg_template.AddPair("ATT2", "VAL2")

	//Create SG
	sg_id, err := testCtrl.SecurityGroups().Create(sg_template.String())

	if err != nil {
		t.Fatalf("Test failed:\n" + err.Error())
	}

	sgC := testCtrl.SecurityGroup(sg_id)
	sg, err = sgC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual := sg.Name

	if actual != sg_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", sg_name, actual)
	}

	tmpl := "ATT3 = \"VAL3\""

	//Update SG
	err = sgC.Update(tmpl, 1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	sg, err = sgC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual_1, err := sg.Template.GetStr("ATT1")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "ATT1", err.Error())
	} else {
		if actual_1 != "VAL1" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL1", actual_1)
		}
	}

	actual_3, err := sg.Template.GetStr("ATT3")
	if err != nil {
		t.Errorf("Test failed, can't retrieve '%s', error: %s", "ATT3", err.Error())
	} else {
		if actual_3 != "VAL3" {
			t.Errorf("Test failed, expected: '%s', got:  '%s'", "VAL3", actual_3)
		}
	}

	clone_name := sg_name + "-cloned"

	//Clone SG
	clone_id, err := sgC.Clone(clone_name)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	clone, err := testCtrl.SecurityGroup(clone_id).Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual = clone.Name

	if actual != clone_name {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", clone_name, actual)
	}

	testCtrl.SecurityGroup(clone_id).Delete()

	//Change permission of SG
	err = sgC.Chmod(shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1})

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	sg, err = sgC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	expected_perm := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}
	actual_perm := sg.Permissions

	if actual_perm == nil || *actual_perm != expected_perm {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", expected_perm.String(), actual_perm.String())
	}

	//Change owner of SG
	err = sgC.Chown(1, 1)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	sg, err = sgC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	expected_usr := 1
	expected_grp := 1
	actual_usr := sg.UID
	actual_grp := sg.GID

	if actual_usr != expected_usr {
		t.Errorf("Test failed, expected: '%d', got:  '%d'", expected_usr, actual_usr)
	}

	if actual_grp != expected_grp {
		t.Errorf("Test failed, expected: '%d', got:  '%d'", expected_grp, actual_grp)
	}

	//Rename SG
	rename := sg_name + "-renamed"
	err = sgC.Rename(rename)

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	sg, err = sgC.Info(false)
	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}

	actual = sg.Name

	if actual != rename {
		t.Errorf("Test failed, expected: '%s', got:  '%s'", rename, actual)
	}

	//Delete SG
	err = sgC.Delete()

	if err != nil {
		t.Errorf("Test failed:\n" + err.Error())
	}
}
