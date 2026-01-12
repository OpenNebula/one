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
	. "gopkg.in/check.v1"
)

type SystemSuite struct {
}

var _ = Suite(&SystemSuite{})

func (s *SystemSuite) TestVersion(c *C) {
	_, err := testCtrl.SystemVersion()
	c.Assert(err, IsNil)
}

func (s *SystemSuite) TestConfig(c *C) {
	_, err := testCtrl.SystemConfig()
	c.Assert(err, IsNil)
}
