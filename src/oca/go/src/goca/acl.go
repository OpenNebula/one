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
)

// ACLsController is a controller for a pool of ACL
type ACLsController entitiesController

// ACLPool represents an OpenNebula ACL list pool
type ACLPool struct {
	ID       uint   `xml:"ID"`
	User     int    `xml:"USER"`
	Resource int    `xml:"RESOURCE"`
	Rights   int    `xml:"RIGHTS"`
	Zone     int    `xml:"ZONE"`
	String   string `xml:"STRING"`
}

type AclUsers uint

const (
	UIDUsr     AclUsers = 0x100000000
	GIDUsr     AclUsers = 0x200000000
	AllUsr     AclUsers = 0x400000000
	ClusterUsr AclUsers = 0x800000000
)

type AclResources uint

const (
	VMRsc             AclResources = 0x1000000000
	HostRsc           AclResources = 0x2000000000
	NetRsc            AclResources = 0x4000000000
	ImageRsc          AclResources = 0x8000000000
	UserRsc           AclResources = 0x10000000000
	TemplateRsc       AclResources = 0x20000000000
	GroupRsc          AclResources = 0x40000000000
	DatastoreRsc      AclResources = 0x100000000000
	ClusterRsc        AclResources = 0x200000000000
	DocumentRsc       AclResources = 0x400000000000
	ZoneRsc           AclResources = 0x800000000000
	SecGroupRsc       AclResources = 0x1000000000000
	VdcRsc            AclResources = 0x2000000000000
	VRouterRsc        AclResources = 0x4000000000000
	MarketPlaceRsc    AclResources = 0x8000000000000
	MarketPlaceAppRsc AclResources = 0x10000000000000
	VMGroupRsc        AclResources = 0x20000000000000
	VNTemplateRsc     AclResources = 0x40000000000000
)

type AclRights uint

const (
	Use    AclRights = 0x1 // Auth. to use an object
	Manage AclRights = 0x2 // Auth. to perform management actions
	Admin  AclRights = 0x4 // Auth. to perform administrative actions
	Create AclRights = 0x8 // Auth. to create an object
)

// ACLs returns a hosts controller.
func (c *Controller) ACLs() *ACLsController {
	return &ACLsController{c}
}

// Info returns an acl pool. A connection to OpenNebula is
// performed.
func (ac *ACLsController) Info() (*ACLPool, error) {
	response, err := ac.c.Client.Call("one.acl.info")
	if err != nil {
		return nil, err
	}

	aclPool := &ACLPool{}
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
func (ac *ACLsController) CreateRule(user AclUsers, resource AclResources, rights AclRights) (uint, error) {
	response, err := ac.c.Client.Call("one.acl.addrule", user, resource, rights)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// DeleteRule deletes an ACL rule.
func (ac *ACLsController) DeleteRule(aclID uint) error {
	_, err := ac.c.Client.Call("one.acl.delrule", int(aclID))
	return err
}
