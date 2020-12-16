/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/acl"
)

// ACLsController is a controller for a pool of ACL
type ACLsController entitiesController

// ACLs returns a hosts controller.
func (c *Controller) ACLs() *ACLsController {
	return &ACLsController{c}
}

// Info returns an acl pool. A connection to OpenNebula is
// performed.
func (ac *ACLsController) Info() (*acl.Pool, error) {
	response, err := ac.c.Client.Call("one.acl.info")
	if err != nil {
		return nil, err
	}

	aclPool := &acl.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), aclPool)
	if err != nil {
		return nil, err
	}

	return aclPool, nil
}

// CreateRule adds a new ACL rule.
// * user: User component of the new rule. A string containing a hex number.
// * resource: Resource component of the new rule. A string containing a hex number.
// * rights: Rights component of the new rule. A string containing a hex number.
func (ac *ACLsController) CreateRule(user, resource, rights string) (int, error) {
	response, err := ac.c.Client.Call("one.acl.addrule", user, resource, rights)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// DeleteRule deletes an ACL rule.
func (ac *ACLsController) DeleteRule(aclID int) error {
	_, err := ac.c.Client.Call("one.acl.delrule", aclID)
	return err
}
