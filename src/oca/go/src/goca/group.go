package goca

import (
	"encoding/xml"
	"errors"
)

// GroupPool represents an OpenNebula GroupPool
type GroupPool struct {
	Groups            []Group    `xml:"GROUP"`
	Quotas            []quotas   `xml:"QUOTAS"`
	DefaultUserQuotas quotasList `xml:"DEFAULT_USER_QUOTAS"`
}

// Group represents an OpenNebula Group
type Group struct {
	ID       uint          `xml:"ID"`
	Name     string        `xml:"NAME"`
	Users    []int         `xml:"USERS>ID"`
	Admins   []int         `xml:"ADMINS>ID"`
	Template groupTemplate `xml:"TEMPLATE"`

	// Variable part between one.grouppool.info and one.group.info
	quotasList
	DefaultUserQuotas quotasList `xml:"DEFAULT_USER_QUOTAS"`
}

type groupTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// NewGroupPool returns a group pool. A connection to OpenNebula is
// performed.
func NewGroupPool() (*GroupPool, error) {
	response, err := client.Call("one.grouppool.info")
	if err != nil {
		return nil, err
	}

	groupPool := &GroupPool{}
	err = xml.Unmarshal([]byte(response.Body()), groupPool)
	if err != nil {
		return nil, err
	}

	return groupPool, nil
}

// NewGroup finds a group object by ID. No connection to OpenNebula.
func NewGroup(id uint) *Group {
	return &Group{ID: id}
}

// NewGroupFromName finds a group object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the group.
func NewGroupFromName(name string) (*Group, error) {
	var id uint

	groupPool, err := NewGroupPool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(groupPool.Groups); i++ {
		if groupPool.Groups[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = groupPool.Groups[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewGroup(id), nil
}

// CreateGroup allocates a new group. It returns the new group ID.
func CreateGroup(name string) (uint, error) {
	response, err := client.Call("one.group.allocate", name)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given group from the pool.
func (group *Group) Delete() error {
	_, err := client.Call("one.group.delete", group.ID)
	return err
}

// Info retrieves information for the group.
func (group *Group) Info() error {
	response, err := client.Call("one.group.info", group.ID)
	if err != nil {
		return err
	}
	*group = Group{}
	return xml.Unmarshal([]byte(response.Body()), group)
}

// Update replaces the group template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (group *Group) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.group.update", group.ID, tpl, appendTemplate)
	return err
}

// AddAdmin adds a User to the Group administrators set
// * userID: The user ID.
func (group *Group) AddAdmin(userID uint) error {
	_, err := client.Call("one.group.addadmin", group.ID, int(userID))
	return err
}

// DelAdmin removes a User from the Group administrators set
// * userID: The user ID.
func (group *Group) DelAdmin(userID uint) error {
	_, err := client.Call("one.group.deladmin", group.ID, int(userID))
	return err
}

// Quota sets the group quota limits.
// * tpl: The new quota template contents. Syntax can be the usual attribute=value or XML.
func (group *Group) Quota(tpl string) error {
	_, err := client.Call("one.group.quota", group.ID, tpl)
	return err
}
