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
	"time"

	. "gopkg.in/check.v1"
)

type ContextSuite struct {
}

var _ = Suite(&ContextSuite{})

func (s *ContextSuite) TestDefaultContext(c *C) {
	userC := testCtrl.User(0)
	_, err := userC.InfoContext(context.Background(), false) // Same as user.Info(false)

	c.Assert(err, IsNil)
}

func (s *ContextSuite) TestContextTimeout(c *C) {
	// Simple example, which shows the timeout is triggered
	ctx, cancel := context.WithTimeout(context.Background(), time.Millisecond)
	defer cancel()

	userC := testCtrl.User(0)
	user, err := userC.InfoContext(ctx, false)

	c.Assert(user, IsNil)
	c.Assert(err, NotNil)
	c.Assert(err.Error(), Matches, "*context deadline exceeded")
	c.Assert(ctx.Err(), Equals, context.DeadlineExceeded)
}
