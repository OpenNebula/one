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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/zone"
	. "gopkg.in/check.v1"
)

type ZoneSuite struct {
	ID 	int
}

var _ = Suite(&ZoneSuite{})

func (s *ZoneSuite) SetUpTest(c *C) {
	s.ID = 0
}

func (s *ZoneSuite) TestGetByNameAndID(c *C) {
	// Get Zone by ID
	zone, err := testCtrl.Zone(s.ID).Info(false)

	c.Assert(err, IsNil)
	c.Assert(zone.ID, Equals, s.ID)

	// GetZone by name
	id, err := testCtrl.Zones().ByName(zone.Name)
	c.Assert(err, IsNil)
	c.Assert(zone.ID, Equals, id)
}

func (s *ZoneSuite) TestCreateFailure(c *C) {
	_, err := testCtrl.Zones().Create("NAME=TestZone\nENDPOINT=aaa", 0)
	c.Assert(err, NotNil)
}

func (s *ZoneSuite) TestDeleteFailure(c *C) {
	err := testCtrl.Zone(s.ID).Delete()
	c.Assert(err, NotNil)
}

func (s *ZoneSuite) TestUpdate(c *C) {
	zoneC := testCtrl.Zone(s.ID)
	err := zoneC.Update(`ENDPOINT="dummy"`, parameters.Merge)

	c.Assert(err, IsNil)

	zone, err := zoneC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(zone.Template.Endpoint, Equals, "dummy")
}

func (s *ZoneSuite) TestRename(c *C) {
	zoneC := testCtrl.Zone(s.ID)

	zone, err := zoneC.Info(false)
	c.Assert(err, IsNil)

	oldName := zone.Name

	err = zoneC.Rename("new_name")
	c.Assert(err, IsNil)

	zone, err = zoneC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(zone.Name, Equals, "new_name")

	err = zoneC.Rename(oldName)
	c.Assert(err, IsNil)
}


func (s *ZoneSuite) TestDisableEnable(c *C) {
	// Disable
	zoneC := testCtrl.Zone(s.ID)
	err := zoneC.Enable(false)
	c.Assert(err, IsNil)

	// Check state
	z, err := zoneC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(zone.State(z.StateRaw).String(), Equals, "DISABLED")

	// Enable
	err = zoneC.Enable(true)
	c.Assert(err, IsNil)
}

func (s *ZoneSuite) TestServer(c *C) {
	// Add server
	zoneC := testCtrl.Zone(s.ID)
	err := zoneC.AddServer("SERVER=[NAME=dummy,ENDPOINT=dummy]")
	c.Assert(err, IsNil)

	// Reset server
	err = zoneC.ResetServer(0)
	c.Assert(err, IsNil)

	// Delete server
	err = zoneC.DelServer(0)
	c.Assert(err, IsNil)
}

func (s *ZoneSuite) TestRaftStatus(c *C) {
	raft, err := testCtrl.Zones().ServerRaftStatus()
	c.Assert(err, IsNil)

	// Check if the state is valid
	state, err := raft.StateString()
	c.Assert(err, IsNil)
	c.Assert(state, Equals, "SOLO")
}
