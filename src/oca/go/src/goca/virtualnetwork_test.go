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
	"strings"
	"testing"

	vn "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork/keys"
)

// Helper to create a Virtual Network
func createVirtualNetwork(t *testing.T) (*vn.VirtualNetwork, int) {

	vnTpl := vn.NewTemplate()
	vnTpl.Add(keys.Name, "vntest")
	vnTpl.Add(keys.Bridge, "vnetbr")
	vnTpl.Add(keys.PhyDev, "eth0")
	vnTpl.Add(keys.SecGroups, "0")
	vnTpl.Add(keys.VlanID, "8000042")
	vnTpl.Add(keys.VNMad, "vxlan")

	id, err := testCtrl.VirtualNetworks().Create(vnTpl.String(), -1)
	if err != nil {
		t.Fatal(err)
	}

	// Get Virtual Network by ID
	vnet, err := testCtrl.VirtualNetwork(id).Info(false)
	if err != nil {
		t.Error(err)
	}

	return vnet, id
}

func WaitState(t *testing.T, vnetC *VirtualNetworkController, state string) {
	wait := WaitResource(func() bool {
		vnet, _ := vnetC.Info(false)

		st, _ := vnet.StateString()
		return st == state
	})

	if !wait {
		t.Error("Virtual Network should be in ERROR state")
	}

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

	id, err := testCtrl.VirtualNetworks().ByName(name)
	if err != nil {
		t.Fatal(err)
	}

	vnetC := testCtrl.VirtualNetwork(id)
	vnet, err = vnetC.Info(false)
	if err != nil {
		t.Error(err)
	}

	idParse = vnet.ID
	if idParse != idOrig {
		t.Errorf("Virtual Network ID does not match")
	}

	// Change Owner to user call
	err = vnetC.Chown(-1, -1)
	if err != nil {
		t.Error(err)
	}

	vnet, err = vnetC.Info(false)
	if err != nil {
		t.Error(err)
	}

	// Get Virtual Network Owner Name
	uname := vnet.UName

	// Get Image owner group Name
	gname := vnet.GName

	// Compare with caller username
	caller := strings.Split(testClient.token, ":")[0]
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
	err = vnetC.Chown(1, 1)
	if err != nil {
		t.Error(err)
	}

	vnet, err = vnetC.Info(false)
	if err != nil {
		t.Error(err)
	}

	// Get Virtual Network Owner Name
	uname = vnet.UName

	// Get Image owner group Name
	gname = vnet.GName

	if "serveradmin" != uname {
		t.Error("Virtual network owner is not oneadmin")
	}

	// Compare with caller group
	if "users" != gname {
		t.Error("Virtual network owner group is not oneadmin")
	}

	// Delete template
	err = vnetC.Delete()
	if err != nil {
		t.Error(err)
	}
}

func TestVirtualNetworkRecover(t *testing.T) {
	var err error

	vnTpl := "NAME = vn_invalid_ar\n" +
			 "BRIDGE = vbr0\n" +
			 "VN_MAD = dummy\n" +
			 "NETWORK_ADDRESS = 192.168.0.0\n"+
			 "AR = [ TYPE = IP4, IP = 192.168.0.1, SIZE = -1 ]\n"

	id, err := testCtrl.VirtualNetworks().Create(vnTpl, -1)
	if err != nil {
		t.Fatal(err)
	}

	// Get Virtual Network by ID
	vnetC := testCtrl.VirtualNetwork(id)

	WaitState(t, vnetC, "ERROR")

	vnetC.RecoverSuccess()

	WaitState(t, vnetC, "READY")

	// Delete template
	err = vnetC.Delete()
	if err != nil {
		t.Error(err)
	}
}
