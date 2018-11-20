package goca

import (
	"errors"
)

// VNTemplate represents an OpenNebula Virtual Network Template
type VNTemplate struct {
	XMLResource
	ID   uint
	Name string
}

// VNTemplatePool represents an OpenNebula Virtual Network TemplatePool
type VNTemplatePool struct {
	XMLResource
}

// NewVNTemplatePool returns a vntemplate pool. A connection to OpenNebula is
// performed.
func NewVNTemplatePool(args ...int) (*VNTemplatePool, error) {
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

	response, err := client.Call("one.vntemplatepool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	vntemplatepool := &VNTemplatePool{XMLResource{body: response.Body()}}

	return vntemplatepool, err

}

// NewVNTemplate finds a vntemplate object by ID. No connection to OpenNebula.
func NewVNTemplate(id uint) *VNTemplate {
	return &VNTemplate{ID: id}
}

// NewVNTemplateFromName finds a vntemplate object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the vntemplate.
func NewVNTemplateFromName(name string) (*VNTemplate, error) {
	vntemplatePool, err := NewVNTemplatePool()
	if err != nil {
		return nil, err
	}

	id, err := vntemplatePool.GetIDFromName(name, "/VNTEMPLATE_POOL/VNTEMPLATE")
	if err != nil {
		return nil, err
	}

	return NewVNTemplate(id), nil
}

// CreateVNTemplate allocates a new vntemplate. It returns the new vntemplate ID.
func CreateVNTemplate(vntemplate string) (uint, error) {
	response, err := client.Call("one.vntemplate.allocate", vntemplate)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Info connects to OpenNebula and fetches the information of the VNTemplate
func (vntemplate *VNTemplate) Info() error {
	response, err := client.Call("one.vntemplate.info", vntemplate.ID)
	vntemplate.body = response.Body()
	return err
}

// Update will modify the vntemplate. If appendTemplate is 0, it will
// replace the whole vntemplate. If its 1, it will merge.
func (vntemplate *VNTemplate) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.vntemplate.update", vntemplate.ID, tpl, appendTemplate)
	return err
}

// Chown changes the owner/group of a vntemplate. If uid or gid is -1 it will not
// change
func (vntemplate *VNTemplate) Chown(uid, gid int) error {
	_, err := client.Call("one.vntemplate.chown", vntemplate.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a vntemplate. If any perm is -1 it will not
// change
func (vntemplate *VNTemplate) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.vntemplate.chmod", vntemplate.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Rename changes the name of vntemplate
func (vntemplate *VNTemplate) Rename(newName string) error {
	_, err := client.Call("one.vntemplate.rename", vntemplate.ID, newName)
	return err
}

// Delete will remove the vntemplate from OpenNebula.
func (vntemplate *VNTemplate) Delete() error {
	_, err := client.Call("one.vntemplate.delete", vntemplate.ID)
	return err
}

// Instantiate will instantiate the template
func (vntemplate *VNTemplate) Instantiate(name string, extra string) (uint, error) {
	response, err := client.Call("one.vntemplate.instantiate", vntemplate.ID, name, extra)

	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Clone an existing vntemplate.
func (vntemplate *VNTemplate) Clone(name string) error {
	_, err := client.Call("one.vntemplate.clone", vntemplate.ID, name)
	return err
}

//Lock an existing vntemplate
func (vntemplate *VNTemplate) Lock(level uint) error {
	_, err := client.Call("one.vntemplate.lock", vntemplate.ID, level)
	return err
}

//Unlock an existing vntemplate
func (vntemplate *VNTemplate) Unlock() error {
	_, err := client.Call("one.vntemplate.unlock", vntemplate.ID)
	return err
}

// Lock actions

// LockUse locks USE actions for the vntemplate
func (vntemplate *VNTemplate) LockUse() error {
    return vntemplate.Lock(1)
}

// LockManage locks MANAGE actions for the vntemplate
func (vntemplate *VNTemplate) LockManage() error {
    return vntemplate.Lock(2)
}

// LockAdmin locks ADMIN actions for the vntemplate
func (vntemplate *VNTemplate) LockAdmin() error {
    return vntemplate.Lock(3)
}

// LockAll locks all actions for the vntemplate
func (vntemplate *VNTemplate) LockAll() error {
    return vntemplate.Lock(4)
}
