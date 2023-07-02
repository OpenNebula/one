/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/user"
)

// UsersController is a controller for a pool of Users
type UsersController entitiesController

// UserController is a controller for User entities
type UserController entityController

// UserByNameController is a controller for an user by it's name
type UserByNameController struct {
	c    *Controller
	Name string
}

// Users returns a Users controller.
func (c *Controller) Users() *UsersController {
	return &UsersController{c}
}

// User returns a User controller.
func (c *Controller) User(id int) *UserController {
	return &UserController{c, id}
}

// UserByName returns a UserByName controller.
func (c *Controller) UserByName(name string) *UserByNameController {
	return &UserByNameController{c, name}
}

// ByName returns a User by Name
func (c *UsersController) ByName(name string) (int, error) {
	var id int

	userPool, err := c.Info()
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(userPool.Users); i++ {
		if userPool.Users[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = userPool.Users[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, err
}

// Info returns a user pool. A connection to OpenNebula is
// performed.
func (uc *UsersController) Info() (*user.Pool, error) {
	response, err := uc.c.Client.Call("one.userpool.info")
	if err != nil {
		return nil, err
	}

	userpool := &user.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), userpool)
	if err != nil {
		return nil, err
	}

	return userpool, nil
}

// Info retrieves information for the user from ID
func (uc *UserController) Info(decrypt bool) (*user.User, error) {
	response, err := uc.c.Client.Call("one.user.info", uc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	user := &user.User{}
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
func (uc *UsersController) Create(name, password, authDriver string, groupIDs []int) (int, error) {
	response, err := uc.c.Client.Call("one.user.allocate", name, password, authDriver, groupIDs)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
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
// * token: The token, if empty oned will generate one
// * timeSeconds: Valid period in seconds; 0 reset the token and -1 for a non-expiring token.
// * effectiveGID: Effective GID to use with this token. To use the current GID and user groups set it to -1
// NOTE: This method make two XML-RPC calls, to make only one call, use UserByName(name).Login(...) method
func (uc *UserController) Login(token string, timeSeconds int, effectiveGID int) error {
	user, err := uc.Info(false)

	if err != nil {
		return err
	}
	_, err = uc.c.Client.Call("one.user.login", user.Name, token, timeSeconds, effectiveGID)
	return err
}

// Login generates or sets a login token.
// * token: The token, if empty oned will generate one
// * timeSeconds: Valid period in seconds; 0 reset the token and -1 for a non-expiring token.
// * effectiveGID: Effective GID to use with this token. To use the current GID and user groups set it to -1
func (uc *UserByNameController) Login(token string, timeSeconds int, effectiveGID int) error {
	_, err := uc.c.Client.Call("one.user.login", uc.Name, token, timeSeconds, effectiveGID)
	return err
}

// Update adds user content.
// * tpl: The new user contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (uc *UserController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := uc.c.Client.Call("one.user.update", uc.ID, tpl, uType)
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
func (uc *UserController) Chgrp(groupID int) error {
	_, err := uc.c.Client.Call("one.user.chgrp", uc.ID, int(groupID))
	return err
}

// AddGroup adds the User to a secondary group.
// * groupID: The Group ID of the new group.
func (uc *UserController) AddGroup(groupID int) error {
	_, err := uc.c.Client.Call("one.user.addgroup", uc.ID, int(groupID))
	return err
}

// DelGroup removes the User from a secondary group
// * groupID: The Group ID.
func (uc *UserController) DelGroup(groupID int) error {
	_, err := uc.c.Client.Call("one.user.delgroup", uc.ID, int(groupID))
	return err
}
