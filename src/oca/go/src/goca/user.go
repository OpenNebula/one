package goca

import (
	"encoding/xml"
	"errors"
)

// UserPool represents an OpenNebula UserPool
type UserPool struct {
	Users             []User     `xml:"USER"`
	Quotas            []quotas   `xml:"QUOTAS"`
	DefaultUserQuotas quotasList `xml:"DEFAULT_USER_QUOTAS"`
}

// User represents an OpenNebula user
type User struct {
	ID          uint         `xml:"ID"`
	GID         int          `xml:"GID"`
	GroupsID    []int        `xml:"GROUPS>ID"`
	GName       string       `xml:"GNAME"`
	Name        string       `xml:"NAME"`
	Password    string       `xml:"PASSWORD"`
	AuthDriver  string       `xml:"AUTH_DRIVER"`
	Enabled     int          `xml:"ENABLED"`
	LoginTokens []loginToken `xml:"LOGIN_TOKEN"`
	Template    userTemplate `xml:"TEMPLATE"`

	// Variable part between one.userpool.info and one.user.info
	quotasList
	DefaultUserQuotas quotasList `xml:"DEFAULT_USER_QUOTAS"`
}

type userTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

type loginToken struct {
	Token          string `xml:"TOKEN"`
	ExpirationTime int    `xml:"EXPIRATION_TIME"`
	EGID           int    `xml:"EGID"`
}

// NewUserPool returns a user pool. A connection to OpenNebula is
// performed.
func NewUserPool() (*UserPool, error) {
	response, err := client.Call("one.userpool.info")
	if err != nil {
		return nil, err
	}

	userpool := &UserPool{}
	err = xml.Unmarshal([]byte(response.Body()), userpool)
	if err != nil {
		return nil, err
	}

	return userpool, nil
}

// NewUser finds a user object by ID. No connection to OpenNebula.
func NewUser(id uint) *User {
	return &User{ID: id}
}

// NewUserFromName finds a user object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the user.
func NewUserFromName(name string) (*User, error) {
	var id uint

	userPool, err := NewUserPool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(userPool.Users); i++ {
		if userPool.Users[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = userPool.Users[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewUser(id), nil
}

// CreateUser allocates a new user. It returns the new user ID.
// * name: name of the user
// * password: password of the user
// * authDriver: auth driver
// * groupIDs: array of groupIDs to add to the user
func CreateUser(name, password, authDriver string, groupIDs []uint) (uint, error) {
	response, err := client.Call("one.user.allocate", name, password, authDriver, groupIDs)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given user from the pool.
func (user *User) Delete() error {
	_, err := client.Call("one.user.delete", user.ID)
	return err
}

// Passwd changes the password for the given user.
// * password: The new password
func (user *User) Passwd(password string) error {
	_, err := client.Call("one.user.passwd", user.ID, password)
	return err
}

// Login generates or sets a login token.
// * token: The token
// * timeSeconds: Valid period in seconds; 0 reset the token and -1 for a non-expiring token.
// * effectiveGID: Effective GID to use with this token. To use the current GID and user groups set it to -1
func (user *User) Login(token string, timeSeconds int, effectiveGID int) error {
	_, err := client.Call("one.user.login", user.ID, token, timeSeconds, effectiveGID)
	return err
}

// Update replaces the user template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (user *User) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.user.update", user.ID, tpl, appendTemplate)
	return err
}

// Chauth changes the authentication driver and the password for the given user.
// * authDriver: The new authentication driver.
// * password: The new password. If it is an empty string
func (user *User) Chauth(authDriver, password string) error {
	_, err := client.Call("one.user.chauth", user.ID, authDriver, password)
	return err
}

// Quota sets the user quota limits.
// * tpl: The new quota template contents. Syntax can be the usual attribute=value or XML.
func (user *User) Quota(tpl string) error {
	_, err := client.Call("one.user.quota", user.ID, tpl)
	return err
}

// Chgrp changes the group of the given user.
// * groupID: The Group ID of the new group.
func (user *User) Chgrp(groupID uint) error {
	_, err := client.Call("one.user.chgrp", user.ID, int(groupID))
	return err
}

// AddGroup adds the User to a secondary group.
// * groupID: The Group ID of the new group.
func (user *User) AddGroup(groupID uint) error {
	_, err := client.Call("one.user.addgroup", user.ID, int(groupID))
	return err
}

// DelGroup removes the User from a secondary group
// * groupID: The Group ID.
func (user *User) DelGroup(groupID uint) error {
	_, err := client.Call("one.user.delgroup", user.ID, int(groupID))
	return err
}

// Info retrieves information for the user.
func (user *User) Info() error {
	response, err := client.Call("one.user.info", user.ID)
	if err != nil {
		return err
	}
	*user = User{}
	return xml.Unmarshal([]byte(response.Body()), user)
}
