package goca

import (
	"encoding/xml"
	"errors"
)

// VirtualRouterPool represents an OpenNebula VirtualRouterPool
type VirtualRouterPool struct {
	VirtualRouters []VirtualRouter `xml:"VROUTER"`
}

// VirtualRouter represents an OpenNebula VirtualRouter
type VirtualRouter struct {
	ID          uint                  `xml:"ID"`
	UID         int                   `xml:"UID"`
	GID         int                   `xml:"GID"`
	UName       string                `xml:"UNAME"`
	GName       string                `xml:"GNAME"`
	Name        string                `xml:"NAME"`
	LockInfos   *Lock                 `xml:"LOCK"`
	Permissions *Permissions          `xml:"PERMISSIONS"`
	Type        int                   `xml:"TYPE"`
	DiskType    int                   `xml:"DISK_TYPE"`
	Persistent  int                   `xml:"PERSISTENT"`
	VMsID       []int                 `xml:"VMS>ID"`
	Template    virtualRouterTemplate `xml:"TEMPLATE"`
}

// VirtualRouterTemplate represent the template part of the OpenNebula VirtualRouter
type virtualRouterTemplate struct {
	NIC     []virtualRouterNIC `xml:"NIC"`
	Dynamic unmatchedTagsSlice `xml:",any"`
}

type virtualRouterNIC struct {
	NICID   int                `xml:"NIC_ID"`
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// NewVirtualRouterPool returns a virtual router pool. A connection to OpenNebula is
// performed.
func NewVirtualRouterPool(args ...int) (*VirtualRouterPool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := client.Call("one.vrouterpool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	vrouterPool := &VirtualRouterPool{}

	err = xml.Unmarshal([]byte(response.Body()), vrouterPool)
	if err != nil {
		return nil, err
	}

	return vrouterPool, nil
}

// NewVirtualRouter finds a virtual router object by ID. No connection to OpenNebula.
func NewVirtualRouter(id uint) *VirtualRouter {
	return &VirtualRouter{ID: id}
}

// NewVirtualRouterFromName finds a virtual router object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the virtual router.
func NewVirtualRouterFromName(name string) (*VirtualRouter, error) {
	var id uint

	vrouterPool, err := NewVirtualRouterPool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(vrouterPool.VirtualRouters); i++ {
		if vrouterPool.VirtualRouters[i].Name == name {
			if match {
				return nil, errors.New("multiple resources with that name")
			}
			id = vrouterPool.VirtualRouters[i].ID
			match = true
		}
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewVirtualRouter(id), nil
}

// CreateVirtualRouter allocates a new virtual router. It returns the new Virtual Router ID
// * tpl: template of the marketplace
func CreateVirtualRouter(tpl string) (uint, error) {
	response, err := client.Call("one.vrouter.allocate", tpl)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Info connects to OpenNebula and fetches the information of the VirtualRouter
func (vr *VirtualRouter) Info() error {
	response, err := client.Call("one.vrouter.info", vr.ID)
	if err != nil {
		return err
	}
	*vr = VirtualRouter{}
	return xml.Unmarshal([]byte(response.Body()), vr)
}

// Update will modify the virtual router. If appendVirtualRouter is 0, it will
// replace the whole virtual router. If its 1, it will merge.
func (vr *VirtualRouter) Update(tpl string, appendVirtualRouter int) error {
	_, err := client.Call("one.vrouter.update", vr.ID, tpl, appendVirtualRouter)
	return err
}

// Chown changes the owner/group of a virtual router. If uid or gid is -1 it will not
// change
func (vr *VirtualRouter) Chown(uid, gid int) error {
	_, err := client.Call("one.vrouter.chown", vr.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a virtual router. If any perm is -1 it will not
// change
func (vr *VirtualRouter) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.vrouter.chmod", vr.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Rename changes the name of virtual router
func (vr *VirtualRouter) Rename(newName string) error {
	_, err := client.Call("one.vrouter.rename", vr.ID, newName)
	return err
}

// Delete will remove the virtual router from OpenNebula.
func (vr *VirtualRouter) Delete() error {
	_, err := client.Call("one.vrouter.delete", vr.ID)
	return err
}

// Instantiate will instantiate the virtual router. It returns the ID of the new VM
// * number: Number of VMs to instantiate.
// * tplid: VM Template id to instantiate.
// * name: Name for the VM instances. If it is an empty string OpenNebula will set a default name. Wildcard %i can be used.
// * hold: False to create the VM on pending (default), True to create it on hold.
// * extra: A string containing an extra template to be merged with the one being instantiated. It can be empty. Syntax can be the usual attribute=value or XML.
func (vr *VirtualRouter) Instantiate(number, tplid int, name string, hold bool, extra string) (uint, error) {
	response, err := client.Call("one.vrouter.instantiate", vr.ID, number, tplid, name, hold, extra)

	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// AttachNic attaches a new network interface to the virtual router and the virtual machines.
// * tpl: NIC template string
func (vr *VirtualRouter) AttachNic(tpl string) error {
	_, err := client.Call("one.vrouter.attachnic", vr.ID, tpl)
	return err
}

// DetachNic detaches a network interface from the virtual router and the virtual machines
// * nicid: NIC ID to detach
func (vr *VirtualRouter) DetachNic(nicid uint) error {
	_, err := client.Call("one.vrouter.detachnic", vr.ID, nicid)
	return err
}

// Lock locks the virtual router depending on blocking level.
func (vr *VirtualRouter) Lock(level uint) error {
	_, err := client.Call("one.vrouter.lock", vr.ID, level)
	return err
}

// Unlock unlocks the virtual router.
func (vr *VirtualRouter) Unlock() error {
	_, err := client.Call("one.vrouter.unlock", vr.ID)
	return err
}

// Lock actions

// LockUse locks USE actions for the virtual router
func (vr *VirtualRouter) LockUse() error {
    return vr.Lock(1)
}

// LockManage locks MANAGE actions for the virtual router
func (vr *VirtualRouter) LockManage() error {
    return vr.Lock(2)
}

// LockAdmin locks ADMIN actions for the virtual router
func (vr *VirtualRouter) LockAdmin() error {
    return vr.Lock(3)
}

// LockAll locks all actions for the virtual router
func (vr *VirtualRouter) LockAll() error {
    return vr.Lock(4)
}
