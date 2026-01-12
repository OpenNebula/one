/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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
	//"fmt"

	. "gopkg.in/check.v1"
)

type AclSuite struct {
	aclID       int
}

var _ = Suite(&AclSuite{})

func (s *AclSuite) SetUpTest(c *C) {
	// Ensure aclID is reset for each test
	s.aclID = -1
}

func (s *AclSuite) TearDownTest(c *C) {
	// Clean up any ACL rule created during the test
	if s.aclID != -1 {
		err := testCtrl.ACLs().DeleteRule(s.aclID)
		c.Assert(err, IsNil)
	}
}

func (s *AclSuite) TestInfo(c *C) {
	// Show ACL rules
	acl, err := testCtrl.ACLs().Info()

	c.Assert(err, IsNil)
	c.Assert(acl.XMLName.Local, Equals, "ACL_POOL")
	c.Assert(len(acl.ACLs) > 0, Equals, true)
}

func (s *AclSuite) TestCreateAndDeleteRule(c *C) {
	aclC := testCtrl.ACLs()

	// Allocate rule "#0 HOST/* USE"
	expectedString := "#0 HOST/* USE #0"
	user := "100000000"
	resource := "2400000000"
	rights := "1"
	zone := "" // Empty string for default zone, which should become "#0"

	ruleID, err := aclC.CreateRule(user, resource, rights, zone)
	c.Assert(err, IsNil)
	c.Assert(ruleID, Not(Equals), -1) // Ensure a valid ID was returned

	s.aclID = ruleID // Store the ID for cleanup in TearDownTest

	// Verify the rule was created by fetching the ACL pool
	aclPool, err := aclC.Info()
	c.Assert(err, IsNil)

	found := false

	for _, aclRule := range aclPool.ACLs {
		if aclRule.ID == ruleID {
			found = true
			c.Assert(aclRule.String, Equals, expectedString)
			break
		}
	}
	c.Assert(found, Equals, true, Commentf("Created ACL rule with ID %d not found in ACL pool", ruleID))

	// The rule will be deleted by TearDownTest
}
