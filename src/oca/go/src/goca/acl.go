/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
	"context"
	"encoding/xml"
	"fmt"

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
	return ac.InfoContext(context.Background())
}

// InfoContext returns an acl pool. A connection to OpenNebula is
// performed.
func (ac *ACLsController) InfoContext(ctx context.Context) (*acl.Pool, error) {
	response, err := ac.c.Client.CallContext(ctx, "one.acl.info")
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
// * zone: Optional zone component of the new rule. A string containing a hex number.
func (ac *ACLsController) CreateRule(user, resource, rights string, zone ...string) (int, error) {
	return ac.CreateRuleContext(context.Background(), user, resource, rights, zone...)
}

// CreateRuleContext adds a new ACL rule.
// * ctx: context for cancelation
// * user: User component of the new rule. A string containing a hex number.
// * resource: Resource component of the new rule. A string containing a hex number.
// * rights: Rights component of the new rule. A string containing a hex number.
// * zone: Optional zone component of the new rule. A string containing a hex number.
func (ac *ACLsController) CreateRuleContext(ctx context.Context, user, resource, rights string, zone ...string) (int, error) {
	if len(zone) > 1 {
		return -1, fmt.Errorf("CreateRule: %d extra parameters passed", len(zone)-1)
	}

	parameters := []interface{}{
		user, resource, rights,
	}

	for _, z := range zone {
		parameters = append(parameters, z)
	}

	response, err := ac.c.Client.CallContext(ctx, "one.acl.addrule", parameters...)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// DeleteRule deletes an ACL rule.
func (ac *ACLsController) DeleteRule(aclID int) error {
	return ac.DeleteRuleContext(context.Background(), aclID)
}

// DeleteRuleContext deletes an ACL rule.
func (ac *ACLsController) DeleteRuleContext(ctx context.Context, aclID int) error {
	_, err := ac.c.Client.CallContext(ctx, "one.acl.delrule", aclID)
	return err
}
