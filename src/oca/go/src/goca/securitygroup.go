package goca

import (
	"encoding/xml"
	"errors"
)

// SecurityGroupPool represents an OpenNebula SecurityGroupPool
type SecurityGroupPool struct {
	SecurityGroups []SecurityGroup `xml:"SECURITY_GROUP"`
}

// SecurityGroup represents an OpenNebula SecurityGroup
type SecurityGroup struct {
	ID          uint                  `xml:"ID"`
	UID         int                   `xml:"UID"`
	GID         int                   `xml:"GID"`
	UName       string                `xml:"UNAME"`
	GName       string                `xml:"GNAME"`
	Name        string                `xml:"NAME"`
	Permissions *Permissions          `xml:"PERMISSIONS"`
	UpdatedVMs  []int                 `xml:"UPDATED_VMS>ID"`
	OutdatedVMs []int                 `xml:"OUTDATED_VMS>ID"`
	UpdatingVMs []int                 `xml:"UPDATING_VMS>ID"`
	ErrorVMs    []int                 `xml:"ERROR_VMS>ID"`
	Template    securityGroupTemplate `xml:"TEMPLATE"`
}

// VirtualRouterTemplate represent the template part of the OpenNebula VirtualRouter
type securityGroupTemplate struct {
	Description string              `xml:"DESCRIPTION"`
	Rules       []securityGroupRule `xml:"RULE"`
	Dynamic     unmatchedTagsSlice  `xml:",any"`
}

type securityGroupRule struct {
	Protocol string `xml:"PROTOCOL"`
	RuleType string `xml:"RULE_TYPE"`
}

// NewSecurityGroupPool returns a security group pool. A connection to OpenNebula is
// performed.
func NewSecurityGroupPool(args ...int) (*SecurityGroupPool, error) {
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

    response, err := client.Call("one.secgrouppool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	secgroupPool := &SecurityGroupPool{}
	err = xml.Unmarshal([]byte(response.Body()), secgroupPool)
	if err != nil {
		return nil, err
	}

	return secgroupPool, nil
}

// NewSecurityGroup finds a security group object by ID. No connection to OpenNebula.
func NewSecurityGroup(id uint) *SecurityGroup {
	return &SecurityGroup{ID: id}
}

// NewSecurityGroupFromName finds a security group object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the security group.
func NewSecurityGroupFromName(name string) (*SecurityGroup, error) {
	var id uint

	secgroupPool, err := NewSecurityGroupPool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(secgroupPool.SecurityGroups); i++ {
		if secgroupPool.SecurityGroups[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = secgroupPool.SecurityGroups[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewSecurityGroup(id), nil
}

// CreateSecurityGroup allocates a new security group. It returns the new security group ID.
// * tpl: template of the security group
func CreateSecurityGroup(tpl string) (uint, error) {
	response, err := client.Call("one.secgroup.allocate", tpl)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Clone clones an existing security group. It returns the clone ID
func (sg *SecurityGroup) Clone(cloneName string) (uint, error) {
	response, err := client.Call("one.secgroup.clone", sg.ID, cloneName)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given security group from the pool.
func (sg *SecurityGroup) Delete() error {
	_, err := client.Call("one.secgroup.delete", sg.ID)
	return err
}

// Update replaces the security group template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (sg *SecurityGroup) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.secgroup.update", sg.ID, tpl, appendTemplate)
	return err
}

// Commit apply security group changes to associated VMs.
// * recovery: If set the commit operation will only operate on outdated and error VMs. If not set operate on all VMs
func (sg *SecurityGroup) Commit(recovery bool) error {
    _, err := client.Call("one.secgroup.commit", sg.ID, recovery)
    return err
}

// Chmod changes the permission bits of a security group
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (sg *SecurityGroup) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.secgroup.chmod", sg.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Chown changes the ownership of a security group.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (sg *SecurityGroup) Chown(userID, groupID int) error {
	_, err := client.Call("one.secgroup.chown", sg.ID, userID, groupID)
	return err
}

// Rename renames a security group.
// * newName: The new name.
func (sg *SecurityGroup) Rename(newName string) error {
	_, err := client.Call("one.secgroup.rename", sg.ID, newName)
	return err
}

// Info retrieves information for the security group.
func (sg *SecurityGroup) Info() error {
	response, err := client.Call("one.secgroup.info", sg.ID)
	if err != nil {
		return err
	}
	*sg = SecurityGroup{}
	return xml.Unmarshal([]byte(response.Body()), sg)
}
