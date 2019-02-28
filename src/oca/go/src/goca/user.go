/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
)

// UsersController is a controller for a pool of Users
type UsersController entitiesController

// UserController is a controller for User entities
type UserController entityController

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

// Users returns a Users controller.
func (c *Controller) Users() *UsersController {
	return &UsersController{c}
}

// User returns a User controller.
func (c *Controller) User(id uint) *UserController {
	return &UserController{c, id}
}

// ByName returns a User by Name
func (c *UsersController) ByName(name string) (uint, error) {
	var id uint

	userPool, err := c.Info()
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(userPool.Users); i++ {
		if userPool.Users[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = userPool.Users[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, err
}

// Info returns a user pool. A connection to OpenNebula is
// performed.
func (uc *UsersController) Info() (*UserPool, error) {
	response, err := uc.c.Client.Call("one.userpool.info")
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

// Info retrieves information for the user from ID
func (uc *UserController) Info() (*User, error) {
	response, err := uc.c.Client.Call("one.user.info", uc.ID)
	if err != nil {
		return nil, err
	}
	user := &User{}
	err = xml.Unmarshal([]byte(response.Body()), user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// Create allocates a new user. It returns the new user ID.
// * name: name of the user
// * password: password of the user
// * authDriver: auth driver
// * groupIDs: array of groupIDs to add to the user
func (uc *UsersController) Create(name, password, authDriver string, groupIDs []uint) (uint, error) {
	response, err := uc.c.Client.Call("one.user.allocate", name, password, authDriver, groupIDs)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given user from the pool.
func (uc *UserController) Delete() error {
	_, err := uc.c.Client.Call("one.user.delete", uc.ID)
	return err
}

// Passwd changes the password for the given user.
// * password: The new password
func (uc *UserController) Passwd(password string) error {
	_, err := uc.c.Client.Call("one.user.passwd", uc.ID, password)
	return err
}

// Login generates or sets a login token.
// * token: The token
// * timeSeconds: Valid period in seconds; 0 reset the token and -1 for a non-expiring token.
// * effectiveGID: Effective GID to use with this token. To use the current GID and user groups set it to -1
func (uc *UserController) Login(token string, timeSeconds int, effectiveGID int) error {
	_, err := uc.c.Client.Call("one.user.login", uc.ID, token, timeSeconds, effectiveGID)
	return err
}

// Update replaces the user template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (uc *UserController) Update(tpl string, appendTemplate int) error {
	_, err := uc.c.Client.Call("one.user.update", uc.ID, tpl, appendTemplate)
	return err
}

// Chauth changes the authentication driver and the password for the given user.
// * authDriver: The new authentication driver.
// * password: The new password. If it is an empty string
func (uc *UserController) Chauth(authDriver, password string) error {
	_, err := uc.c.Client.Call("one.user.chauth", uc.ID, authDriver, password)
	return err
}

// Quota sets the user quota limits.
// * tpl: The new quota template contents. Syntax can be the usual attribute=value or XML.
func (uc *UserController) Quota(tpl string) error {
	_, err := uc.c.Client.Call("one.user.quota", uc.ID, tpl)
	return err
}

// Chgrp changes the group of the given user.
// * groupID: The Group ID of the new group.
func (uc *UserController) Chgrp(groupID uint) error {
	_, err := uc.c.Client.Call("one.user.chgrp", uc.ID, int(groupID))
	return err
}

// AddGroup adds the User to a secondary group.
// * groupID: The Group ID of the new group.
func (uc *UserController) AddGroup(groupID uint) error {
	_, err := uc.c.Client.Call("one.user.addgroup", uc.ID, int(groupID))
	return err
}

// DelGroup removes the User from a secondary group
// * groupID: The Group ID.
func (uc *UserController) DelGroup(groupID uint) error {
	_, err := uc.c.Client.Call("one.user.delgroup", uc.ID, int(groupID))
	return err
}
