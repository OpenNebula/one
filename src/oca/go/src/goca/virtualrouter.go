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
	vr "github.com/OpenNebula/one/src/oca/go/src/goca/schemas/virtualrouter"
)

// VirtualRoutersController is a controller for a pool of VirtualRouters
type VirtualRoutersController entitiesController

// VirtualRouterController is a controller for VirtualRouter entities
type VirtualRouterController entityController

// VirtualRouters returns a VirtualRouters controller.
func (c *Controller) VirtualRouters() *VirtualRoutersController {
	return &VirtualRoutersController{c}
}

// VirtualRouter returns a VirtualRouter controller.
func (c *Controller) VirtualRouter(id int) *VirtualRouterController {
	return &VirtualRouterController{c, id}
}

// VirtualRouterByName returns a VirtualRouter By name
func (c *Controller) VirtualRouterByName(name string, args ...int) (int, error) {
	var id int

	vrouterPool, err := (&VirtualRoutersController{c}).Info(args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(vrouterPool.VirtualRouters); i++ {
		if vrouterPool.VirtualRouters[i].Name == name {
			if match {
				return -1, errors.New("multiple resources with that name")
			}
			id = vrouterPool.VirtualRouters[i].ID
			match = true
		}
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a virtual router pool. A connection to OpenNebula is
// performed.
func (vc *VirtualRoutersController) Info(args ...int) (*vr.Pool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = parameters.PoolWhoAll
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := vc.c.Client.Call("one.vrouterpool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	vrouterPool := &vr.Pool{}

	err = xml.Unmarshal([]byte(response.Body()), vrouterPool)
	if err != nil {
		return nil, err
	}

	return vrouterPool, nil
}

// Info connects to OpenNebula and fetches the information of the VirtualRouter
func (vc *VirtualRouterController) Info(decrypt bool) (*vr.VirtualRouter, error) {
	response, err := vc.c.Client.Call("one.vrouter.info", vc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	vr := &vr.VirtualRouter{}
	err = xml.Unmarshal([]byte(response.Body()), vr)
	if err != nil {
		return nil, err
	}

	return vr, nil
}

// Create allocates a new virtual router. It returns the new Virtual Router ID
// * tpl: template of the marketplace
func (vc *VirtualRoutersController) Create(tpl string) (int, error) {
	response, err := vc.c.Client.Call("one.vrouter.allocate", tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Update adds virtual router content.
// * tpl: The new virtual router contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (vc *VirtualRouterController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := vc.c.Client.Call("one.vrouter.update", vc.ID, tpl, uType)
	return err
}

// Chown changes the owner/group of a virtual router. If uid or gid is -1 it will not
// change
func (vc *VirtualRouterController) Chown(uid, gid int) error {
	_, err := vc.c.Client.Call("one.vrouter.chown", vc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a virtual router. If any perm is -1 it will not
// change
func (vc *VirtualRouterController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{vc.ID}, perm.ToArgs()...)

	_, err := vc.c.Client.Call("one.vrouter.chmod", args...)
	return err
}

// Rename changes the name of virtual router
func (vc *VirtualRouterController) Rename(newName string) error {
	_, err := vc.c.Client.Call("one.vrouter.rename", vc.ID, newName)
	return err
}

// Delete will remove the virtual router from OpenNebula.
func (vc *VirtualRouterController) Delete() error {
	_, err := vc.c.Client.Call("one.vrouter.delete", vc.ID)
	return err
}

// Instantiate will instantiate the virtual router. It returns the ID of the new VM
// * number: Number of VMs to instantiate.
// * tplid: VM Template id to instantiate.
// * name: Name for the VM instances. If it is an empty string OpenNebula will set a default name. Wildcard %i can be used.
// * hold: False to create the VM on pending (default), True to create it on hold.
// * extra: A string containing an extra template to be merged with the one being instantiated. It can be empty. Syntax can be the usual attribute=value or XML.
func (vc *VirtualRouterController) Instantiate(number, tplid int, name string, hold bool, extra string) (int, error) {
	response, err := vc.c.Client.Call("one.vrouter.instantiate", vc.ID, number, tplid, name, hold, extra)

	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// AttachNic attaches a new network interface to the virtual router and the virtual machines.
// * tpl: NIC template string
func (vc *VirtualRouterController) AttachNic(tpl string) error {
	_, err := vc.c.Client.Call("one.vrouter.attachnic", vc.ID, tpl)
	return err
}

// DetachNic detaches a network interface from the virtual router and the virtual machines
// * nicid: NIC ID to detach
func (vc *VirtualRouterController) DetachNic(nicid int) error {
	_, err := vc.c.Client.Call("one.vrouter.detachnic", vc.ID, nicid)
	return err
}

// Lock locks the virtual router depending on blocking level. See levels in locks.go.
func (vc *VirtualRouterController) Lock(level shared.LockLevel) error {
	_, err := vc.c.Client.Call("one.vrouter.lock", vc.ID, level)
	return err
}

// Unlock unlocks the virtual router.
func (vc *VirtualRouterController) Unlock() error {
	_, err := vc.c.Client.Call("one.vrouter.unlock", vc.ID)
	return err
}
