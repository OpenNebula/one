/* -------------------------------------------------------------------------- */
/* Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                */
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
	"encoding/xml"
	"errors"

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	vn "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualnetwork"
)

// VirtualNetworksController is a controller for a pool of VirtualNetworks
type VirtualNetworksController entitiesController

// VirtualNetworkController is a controller for VirtualNetwork entities
type VirtualNetworkController entityController

// VirtualNetworks returns a VirtualNetworks controller
func (c *Controller) VirtualNetworks() *VirtualNetworksController {
	return &VirtualNetworksController{c}
}

// VirtualNetwork returns a VirtualNetwork controller
func (c *Controller) VirtualNetwork(id int) *VirtualNetworkController {
	return &VirtualNetworkController{c, id}
}

// ByName returns a VirtualNetwork ID from name
func (c *VirtualNetworksController) ByName(name string, args ...int) (int, error) {
	var id int

	virtualNetworkPool, err := c.Info(args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(virtualNetworkPool.VirtualNetworks); i++ {
		if virtualNetworkPool.VirtualNetworks[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = virtualNetworkPool.VirtualNetworks[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a virtualnetwork pool.
func (vc *VirtualNetworksController) Info(args ...int) (*vn.Pool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = parameters.PoolWhoAll
		start = -1
		end = -1
	case 1:
		who = args[0]
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := vc.c.Client.Call("one.vnpool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	vnPool := &vn.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), &vnPool)
	if err != nil {
		return nil, err
	}

	return vnPool, nil
}

// Info retrieves information for the virtual network.
func (vc *VirtualNetworkController) Info(decrypt bool) (*vn.VirtualNetwork, error) {
	response, err := vc.c.Client.Call("one.vn.info", vc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	vn := &vn.VirtualNetwork{}
	err = xml.Unmarshal([]byte(response.Body()), vn)
	if err != nil {
		return nil, err
	}
	return vn, nil
}

// Create allocates a new virtualnetwork. It returns the new virtualnetwork ID.
// * tpl: template of the virtualnetwork
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func (vc *VirtualNetworksController) Create(tpl string, clusterID int) (int, error) {
	response, err := vc.c.Client.Call("one.vn.allocate", tpl, clusterID)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given virtual network from the pool.
func (vc *VirtualNetworkController) Delete() error {
	_, err := vc.c.Client.Call("one.vn.delete", vc.ID)
	return err
}

// AddAR adds address ranges to a virtual network.
// * tpl: template of the address ranges to add. Syntax can be the usual attribute=value or XML
func (vc *VirtualNetworkController) AddAR(tpl string) error {
	_, err := vc.c.Client.Call("one.vn.add_ar", vc.ID, tpl)
	return err
}

// RmAR removes an address range from a virtual network.
// * arID: ID of the address range to remove.
func (vc *VirtualNetworkController) RmAR(arID int) error {
	_, err := vc.c.Client.Call("one.vn.rm_ar", vc.ID, arID)
	return err
}

// UpdateAR updates the attributes of an address range.
// * tpl: template of the address ranges to update. Syntax can be the usual attribute=value or XML
func (vc *VirtualNetworkController) UpdateAR(tpl string) error {
	_, err := vc.c.Client.Call("one.vn.update_ar", vc.ID, tpl)
	return err
}

// Reserve reserve network addresses. It returns the Reserved Virtual Network ID
// * tpl: Template
func (vc *VirtualNetworkController) Reserve(tpl string) (int, error) {
	response, err := vc.c.Client.Call("one.vn.reserve", vc.ID, tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// FreeAR frees a reserved address range from a virtual network.
// * arID: ID of the address range to free.
func (vc *VirtualNetworkController) FreeAR(arID int) error {
	_, err := vc.c.Client.Call("one.vn.free_ar", vc.ID, arID)
	return err
}

// Hold holds a virtual network Lease as used.
// * tpl: template of the lease to hold
func (vc *VirtualNetworkController) Hold(tpl string) error {
	_, err := vc.c.Client.Call("one.vn.hold", vc.ID, tpl)
	return err
}

// Release releases a virtual network Lease on hold.
// * tpl: template of the lease to release
func (vc *VirtualNetworkController) Release(tpl string) error {
	_, err := vc.c.Client.Call("one.vn.release", vc.ID, tpl)
	return err
}

// Update adds virtual network content.
// * tpl: The new virtual network contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (vc *VirtualNetworkController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := vc.c.Client.Call("one.vn.update", vc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a virtual network.
func (vc *VirtualNetworkController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{vc.ID}, perm.ToArgs()...)
	_, err := vc.c.Client.Call("one.vn.chmod", args...)
	return err
}

// Chown changes the ownership of a virtual network.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (vc *VirtualNetworkController) Chown(userID, groupID int) error {
	_, err := vc.c.Client.Call("one.vn.chown", vc.ID, userID, groupID)
	return err
}

// Rename renames a virtual network.
// * newName: The new name.
func (vc *VirtualNetworkController) Rename(newName string) error {
	_, err := vc.c.Client.Call("one.vn.rename", vc.ID, newName)
	return err
}

// Lock locks the vn following lock level. See levels in locks.go.
func (vc *VirtualNetworkController) Lock(level shared.LockLevel) error {
	_, err := vc.c.Client.Call("one.vn.lock", vc.ID, level)
	return err
}

// Unlock unlocks the vn.
func (vc *VirtualNetworkController) Unlock() error {
	_, err := vc.c.Client.Call("one.vn.unlock", vc.ID)
	return err
}

// Recover recovers a stuck Virtual Network
// * op: (0) failure, (1) success, (2) retry, (3) delete
func (vc *VirtualNetworkController) Recover(op int) error {
	_, err := vc.c.Client.Call("one.vn.recover", vc.ID, op)
	return err
}

// RecoverFailure forces a failure
func (vc *VirtualNetworkController) RecoverFailure() error {
	return vc.Recover(0)
}

// RecoverSuccess forces a success
func (vc *VirtualNetworkController) RecoverSuccess() error {
	return vc.Recover(1)
}

// RecoverDelete delete the network, call driver cleanup action
func (vc *VirtualNetworkController) RecoverDelete() error {
	return vc.Recover(2)
}
