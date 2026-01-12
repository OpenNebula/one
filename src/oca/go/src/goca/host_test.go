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
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

type HostSuite struct {
	hostID int
}

var _ = Suite(&HostSuite{})

func (s *HostSuite) SetUpTest(c *C) {
	// Create Host
	id, err := testCtrl.Hosts().Create("TestHost", "dummy", "dummy", 0)
	c.Assert(err, IsNil)
	s.hostID = id
}

func (s *HostSuite) TearDownTest(c *C) {
	// Delete Host
	hostC := testCtrl.Host(s.hostID)
	hostC.Delete()
}

func (s *HostSuite) TestGetByNameAndID(c *C) {
	// Get Host by ID
	host, err := testCtrl.Host(s.hostID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(host.ID, Equals, s.hostID)

	// Test value
	c.Assert(host.VMMAD, Equals, "dummy")

	// Get Host by Name
	id, err := testCtrl.Hosts().ByName(host.Name)
	c.Assert(err, IsNil)
	c.Assert(host.ID, Equals, id)
}

func (s *HostSuite) TestUpdate(c *C) {
	hostC := testCtrl.Host(s.hostID)
	err := hostC.Update(`DESCRIPTION="Test host description"`, parameters.Merge)

	c.Assert(err, IsNil)

	host, err := testCtrl.Host(s.hostID).Info(false)
	c.Assert(err, IsNil)

	description, err := host.Template.GetStr("DESCRIPTION")
	c.Assert(err, IsNil)
	c.Assert(description, Equals, "Test host description")
}

func (s *HostSuite) TestRename(c *C) {
	hostC := testCtrl.Host(s.hostID)
	err := hostC.Rename("new_name")
	c.Assert(err, IsNil)

	host, err := testCtrl.Host(s.hostID).Info(false)
	c.Assert(err, IsNil)

	c.Assert(host.Name, Equals, "new_name")
}

func (s *HostSuite) TestOffline(c *C) {
	hostC := testCtrl.Host(s.hostID)
	err := hostC.Status(2)
	c.Assert(err, IsNil)

	host, err := testCtrl.Host(s.hostID).Info(false)
	c.Assert(err, IsNil)
	st, err := host.StateString()
	c.Assert(st, Equals, "OFFLINE")
}

func (s *HostSuite) TestMonitoring(c *C) {
	hostC := testCtrl.Host(s.hostID)
	mon, err := hostC.Monitoring()
	c.Assert(err, IsNil)
	c.Assert(mon.XMLName.Local, Equals, "MONITORING_DATA")

	pool, err := testCtrl.Hosts().Monitoring(100)
	c.Assert(err, IsNil)

	c.Assert(pool.XMLName.Local, Equals, "MONITORING_DATA")
}

