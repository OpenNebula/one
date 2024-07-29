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
	"context"
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
	return c.ByNameContext(context.Background(), name, args...)
}

// ByNameContext returns a VirtualNetwork ID from name
func (c *VirtualNetworksController) ByNameContext(ctx context.Context, name string, args ...int) (int, error) {
	var id int

	virtualNetworkPool, err := c.InfoContext(ctx, args...)
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
	return vc.InfoContext(context.Background(), args...)
}

// InfoContext returns a virtualnetwork pool.
func (vc *VirtualNetworksController) InfoContext(ctx context.Context, args ...int) (*vn.Pool, error) {
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

	response, err := vc.c.Client.CallContext(ctx, "one.vnpool.info", who, start, end)
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
	return vc.InfoContext(context.Background(), decrypt)
}

// InfoContext retrieves information for the virtual network.
func (vc *VirtualNetworkController) InfoContext(ctx context.Context, decrypt bool) (*vn.VirtualNetwork, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vn.info", vc.ID, decrypt)
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
	return vc.CreateContext(context.Background(), tpl, clusterID)
}

// CreateContext allocates a new virtualnetwork. It returns the new virtualnetwork ID.
// * ctx: context for cancelation
// * tpl: template of the virtualnetwork
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func (vc *VirtualNetworksController) CreateContext(ctx context.Context, tpl string, clusterID int) (int, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vn.allocate", tpl, clusterID)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Delete deletes the given virtual network from the pool.
func (vc *VirtualNetworkController) Delete() error {
	return vc.DeleteContext(context.Background())
}

// DeleteContext deletes the given virtual network from the pool.
func (vc *VirtualNetworkController) DeleteContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.delete", vc.ID)
	return err
}

// AddAR adds address ranges to a virtual network.
// * tpl: template of the address ranges to add. Syntax can be the usual attribute=value or XML
func (vc *VirtualNetworkController) AddAR(tpl string) error {
	return vc.AddARContext(context.Background(), tpl)
}

// AddARContext adds address ranges to a virtual network.
// * ctx: context for cancelation
// * tpl: template of the address ranges to add. Syntax can be the usual attribute=value or XML
func (vc *VirtualNetworkController) AddARContext(ctx context.Context, tpl string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.add_ar", vc.ID, tpl)
	return err
}

// RmAR removes an address range from a virtual network.
// * arID: ID of the address range to remove.
func (vc *VirtualNetworkController) RmAR(arID int) error {
	return vc.RmARContext(context.Background(), arID)
}

// RmARContext removes an address range from a virtual network.
// * ctx: context for cancelation
// * arID: ID of the address range to remove.
func (vc *VirtualNetworkController) RmARContext(ctx context.Context, arID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.rm_ar", vc.ID, arID)
	return err
}

// UpdateAR updates the attributes of an address range.
// * tpl: template of the address ranges to update. Syntax can be the usual attribute=value or XML
func (vc *VirtualNetworkController) UpdateAR(tpl string) error {
	return vc.UpdateARContext(context.Background(), tpl)
}

// UpdateARContext updates the attributes of an address range.
// * ctx: context for cancelation
// * tpl: template of the address ranges to update. Syntax can be the usual attribute=value or XML
func (vc *VirtualNetworkController) UpdateARContext(ctx context.Context, tpl string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.update_ar", vc.ID, tpl)
	return err
}

// Reserve reserve network addresses. It returns the Reserved Virtual Network ID
// * tpl: Template
func (vc *VirtualNetworkController) Reserve(tpl string) (int, error) {
	return vc.ReserveContext(context.Background(), tpl)
}

// ReserveContext reserve network addresses. It returns the Reserved Virtual Network ID
// * ctx: context for cancelation
// * tpl: Template
func (vc *VirtualNetworkController) ReserveContext(ctx context.Context, tpl string) (int, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vn.reserve", vc.ID, tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// FreeAR frees a reserved address range from a virtual network.
// * arID: ID of the address range to free.
func (vc *VirtualNetworkController) FreeAR(arID int) error {
	return vc.FreeARContext(context.Background(), arID)
}

// FreeARContext frees a reserved address range from a virtual network.
// * ctx: context for cancelation
// * arID: ID of the address range to free.
func (vc *VirtualNetworkController) FreeARContext(ctx context.Context, arID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.free_ar", vc.ID, arID)
	return err
}

// Hold holds a virtual network Lease as used.
// * tpl: template of the lease to hold
func (vc *VirtualNetworkController) Hold(tpl string) error {
	return vc.HoldContext(context.Background(), tpl)
}

// HoldContext holds a virtual network Lease as used.
// * ctx: context for cancelation
// * tpl: template of the lease to hold
func (vc *VirtualNetworkController) HoldContext(ctx context.Context, tpl string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.hold", vc.ID, tpl)
	return err
}

// Release releases a virtual network Lease on hold.
// * tpl: template of the lease to release
func (vc *VirtualNetworkController) Release(tpl string) error {
	return vc.ReleaseContext(context.Background(), tpl)
}

// ReleaseContext releases a virtual network Lease on hold.
// * ctx: context for cancelation
// * tpl: template of the lease to release
func (vc *VirtualNetworkController) ReleaseContext(ctx context.Context, tpl string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.release", vc.ID, tpl)
	return err
}

// Update adds virtual network content.
// * tpl: The new virtual network contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (vc *VirtualNetworkController) Update(tpl string, uType parameters.UpdateType) error {
	return vc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext adds virtual network content.
//   - ctx: context for cancelation
//   - tpl: The new virtual network contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (vc *VirtualNetworkController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.update", vc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a virtual network.
func (vc *VirtualNetworkController) Chmod(perm shared.Permissions) error {
	return vc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permission bits of a virtual network.
func (vc *VirtualNetworkController) ChmodContext(ctx context.Context, perm shared.Permissions) error {
	args := append([]interface{}{vc.ID}, perm.ToArgs()...)
	_, err := vc.c.Client.CallContext(ctx, "one.vn.chmod", args...)
	return err
}

// Chown changes the ownership of a virtual network.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (vc *VirtualNetworkController) Chown(userID, groupID int) error {
	return vc.ChownContext(context.Background(), userID, groupID)
}

// ChownContext changes the ownership of a virtual network.
// * ctx: context for cancelation
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (vc *VirtualNetworkController) ChownContext(ctx context.Context, userID, groupID int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.chown", vc.ID, userID, groupID)
	return err
}

// Rename renames a virtual network.
// * newName: The new name.
func (vc *VirtualNetworkController) Rename(newName string) error {
	return vc.RenameContext(context.Background(), newName)
}

// RenameContext renames a virtual network.
// * ctx: context for cancelation
// * newName: The new name.
func (vc *VirtualNetworkController) RenameContext(ctx context.Context, newName string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.rename", vc.ID, newName)
	return err
}

// Lock locks the vn following lock level. See levels in locks.go.
func (vc *VirtualNetworkController) Lock(level shared.LockLevel) error {
	return vc.LockContext(context.Background(), level)
}

// LockContext locks the vn following lock level. See levels in locks.go.
func (vc *VirtualNetworkController) LockContext(ctx context.Context, level shared.LockLevel) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.lock", vc.ID, level)
	return err
}

// Unlock unlocks the vn.
func (vc *VirtualNetworkController) Unlock() error {
	return vc.UnlockContext(context.Background())
}

// UnlockContext unlocks the vn.
func (vc *VirtualNetworkController) UnlockContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.unlock", vc.ID)
	return err
}

// Recover recovers a stuck Virtual Network
// * op: (0) failure, (1) success, (2) retry, (3) delete
func (vc *VirtualNetworkController) Recover(op int) error {
	return vc.RecoverContext(context.Background(), op)
}

// RecoverContext recovers a stuck Virtual Network
// * ctx: context for cancelation
// * op: (0) failure, (1) success, (2) retry, (3) delete
func (vc *VirtualNetworkController) RecoverContext(ctx context.Context, op int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vn.recover", vc.ID, op)
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
