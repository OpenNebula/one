package goca

import "errors"

// VirtualNetwork represents an OpenNebula VirtualNetwork
type VirtualNetwork struct {
	XMLResource
	ID   uint
	Name string
}

// VirtualNetworkPool represents an OpenNebula VirtualNetworkPool
type VirtualNetworkPool struct {
	XMLResource
}

// NewVirtualNetworkPool returns a virtualnetwork pool. A connection to OpenNebula is
// performed.
func NewVirtualNetworkPool(args ...int) (*VirtualNetworkPool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
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

	response, err := client.Call("one.vnpool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	vnpool := &VirtualNetworkPool{XMLResource{body: response.Body()}}

	return vnpool, err
}

// NewVirtualNetwork finds a virtualnetwork object by ID. No connection to OpenNebula.
func NewVirtualNetwork(id uint) *VirtualNetwork {
	return &VirtualNetwork{ID: id}
}

// NewVirtualNetworkFromName finds a virtualnetwork object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the virtualnetwork.
func NewVirtualNetworkFromName(name string) (*VirtualNetwork, error) {
	virtualnetworkPool, err := NewVirtualNetworkPool()
	if err != nil {
		return nil, err
	}

	id, err := virtualnetworkPool.GetIDFromName(name, "/VNET_POOL/VNET")
	if err != nil {
		return nil, err
	}

	return NewVirtualNetwork(id), nil
}

// CreateVirtualnetwork allocates a new virtualnetwork. It returns the new virtualnetwork ID.
// * tpl: template of the virtualnetwork
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func CreateVirtualnetwork(tpl string, clusterID int) (uint, error) {
	response, err := client.Call("one.vn.allocate", tpl, clusterID)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given virtual network from the pool.
func (vn *VirtualNetwork) Delete() error {
	_, err := client.Call("one.vn.delete", vn.ID)
	return err
}

// AddAr adds address ranges to a virtual network.
// * tpl: template of the address ranges to add. Syntax can be the usual attribute=value or XML
func (vn *VirtualNetwork) AddAr(tpl string) error {
	_, err := client.Call("one.vn.add_ar", vn.ID, tpl)
	return err
}

// RmAr removes an address range from a virtual network.
// * arID: ID of the address range to remove.
func (vn *VirtualNetwork) RmAr(arID int) error {
	_, err := client.Call("one.vn.rm_ar", vn.ID, arID)
	return err
}

// UpdateAr updates the attributes of an address range.
// * tpl: template of the address ranges to update. Syntax can be the usual attribute=value or XML
func (vn *VirtualNetwork) UpdateAr(tpl string) error {
	_, err := client.Call("one.vn.update_ar", vn.ID, tpl)
	return err
}

// Reserve reserve network addresses.
// * tpl: Template
func (vn *VirtualNetwork) Reserve(tpl string) error {
	_, err := client.Call("one.vn.reserve", vn.ID, tpl)
	return err
}

// FreeAr frees a reserved address range from a virtual network.
// * arID: ID of the address range to free.
func (vn *VirtualNetwork) FreeAr(arID int) error {
	_, err := client.Call("one.vn.free_ar", vn.ID, arID)
	return err
}

// Hold holds a virtual network Lease as used.
// * tpl: template of the lease to hold
func (vn *VirtualNetwork) Hold(tpl string) error {
	_, err := client.Call("one.vn.hold", vn.ID, tpl)
	return err
}

// Release releases a virtual network Lease on hold.
// * tpl: template of the lease to release
func (vn *VirtualNetwork) Release(tpl string) error {
	_, err := client.Call("one.vn.release", vn.ID, tpl)
	return err
}

// Update replaces the virtual network template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (vn *VirtualNetwork) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.vn.update", vn.ID, tpl, appendTemplate)
	return err
}

// Chmod changes the permission bits of a virtual network.
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (vn *VirtualNetwork) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.vn.chmod", vn.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Chown changes the ownership of a virtual network.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (vn *VirtualNetwork) Chown(userID, groupID uint) error {
	_, err := client.Call("one.vn.chown", vn.ID, int(userID), int(groupID))
	return err
}

// Rename renames a virtual network.
// * newName: The new name.
func (vn *VirtualNetwork) Rename(newName string) error {
	_, err := client.Call("one.vn.rename", vn.ID, newName)
	return err
}

// Info retrieves information for the virtual network.
func (vn *VirtualNetwork) Info() error {
	_, err := client.Call("one.vn.info", vn.ID)
	return err
}
