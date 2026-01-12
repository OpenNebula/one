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
	"fmt"
	"strings"

	//"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/image"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	. "gopkg.in/check.v1"
)

type ImageSuite struct {
	ID       int
}

var _ = Suite(&ImageSuite{})

func ImageExpectState(imageC *ImageController, state string) func() bool {
	return func() bool {
		image, err := imageC.Info(false)
		if err != nil {
			return false
		}

		s, err := image.StateString()
		if err != nil {
			return false
		}

		if state != "" && s == state {
			return true
		}

		return false
	}
}

func (s *ImageSuite) SetUpTest(c *C) {
	imageTpl := fmt.Sprintf(`
		NAME = "%s"
		SIZE = 1
		TYPE = "DATABLOCK"`, GenName("test-image"))

	// Create image
	id, err := testCtrl.Images().Create(imageTpl, 1)
	c.Assert(err, IsNil)

	s.ID = id
}

func (s *ImageSuite) TearDownTest(c *C) {
	// Delete Image
	imageC := testCtrl.Image(s.ID)

	wait := WaitResource(ImageExpectState(imageC, "READY"))
	c.Assert(wait, Equals, true)

	err := imageC.Delete()
	c.Assert(err, IsNil)
}

func (s *ImageSuite) TestGetByNameAndID(c *C) {
	// Get Image by ID
	imageC := testCtrl.Image(s.ID)
	image, err := imageC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(image.ID, Equals, s.ID)

	// Get Image by Name
	id, err := testCtrl.Images().ByName(image.Name)
	c.Assert(err, IsNil)
	c.Assert(image.ID, Equals, id)
}

func (s *ImageSuite) TestUpdate(c *C) {
	imageC := testCtrl.Image(s.ID)
	err := imageC.Update(`Description = "Image description"`, parameters.Merge)

	c.Assert(err, IsNil)

	image, err := testCtrl.Image(s.ID).Info(false)
	c.Assert(err, IsNil)

	vms, err := image.Template.GetStr("DESCRIPTION")

	c.Assert(err, IsNil)
	c.Assert(vms, Equals, "Image description")
}

func (s *ImageSuite) TestRename(c *C) {
	imageC := testCtrl.Image(s.ID)
	err := imageC.Rename("new_name")
	c.Assert(err, IsNil)

	image, err := imageC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(image.Name, Equals, "new_name");
}

func (s *ImageSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	imageC := testCtrl.Image(s.ID)

	err := imageC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	image, err := imageC.Info(false)

	c.Assert(err, IsNil)
	c.Assert(*image.Permissions, Equals, new_permissions);
}

func (s *ImageSuite) TestChown(c *C) {
	// Change Owner to user call
	imageC := testCtrl.Image(s.ID);

	err := imageC.Chown(-1, -1)
	c.Assert(err, IsNil)

	image, err := imageC.Info(false)
	c.Assert(err, IsNil)

	// Compare with caller username
	caller := strings.Split(testClient.GetToken(), ":")[0]
	c.Assert(image.UName, Equals, caller)

	// Compare with caller group
	group, err := GetUserGroup(caller)
	c.Assert(image.GName, Equals, group)
}

func (s *ImageSuite) TestLock(c *C) {
	// Wait Image is ready
	imageC := testCtrl.Image(s.ID)
	wait := WaitResource(ImageExpectState(imageC, "READY"))
	c.Assert(wait, Equals, true)

	// Lock
	err := imageC.Lock(shared.LockUse)
	c.Assert(err, IsNil)

	image, err := imageC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(image.LockInfos.Locked, Equals, 1);

	// Unlock
	err = imageC.Unlock()
	c.Assert(err, IsNil)

	image, err = imageC.Info(false)
	c.Assert(err, IsNil)
	c.Assert(image.LockInfos, IsNil)
}

func (s *ImageSuite) TestClone(c *C) {
	// Wait Image is ready
	imageC := testCtrl.Image(s.ID)
	wait := WaitResource(ImageExpectState(imageC, "READY"))
	c.Assert(wait, Equals, true)

	id, err := imageC.Clone(GenName("cloned_image"), 1)
	c.Assert(err, IsNil)

	// Delete cloned image
	clonedImageC := testCtrl.Image(id)

	wait = WaitResource(ImageExpectState(clonedImageC, "READY"))
	c.Assert(wait, Equals, true)

	err = clonedImageC.Delete()
	c.Assert(err, IsNil)
}

func (s *ImageSuite) TestEnable(c *C) {
	// Wait Image is ready
	imageC := testCtrl.Image(s.ID)
	wait := WaitResource(ImageExpectState(imageC, "READY"))
	c.Assert(wait, Equals, true)

	err := imageC.Enable(false)
	c.Assert(err, IsNil)

	err = imageC.Enable(true)
	c.Assert(err, IsNil)
}

func (s *ImageSuite) TestPersistent(c *C) {
	imageC := testCtrl.Image(s.ID)

	err := imageC.Persistent(true)
	c.Assert(err, IsNil)
}

func (s *ImageSuite) TestChtype(c *C) {
	imageC := testCtrl.Image(s.ID)

	err := imageC.Chtype("CDROM")
	c.Assert(err, IsNil)
}

func (s *ImageSuite) TestSnapshots(c *C) {
	// Wait Image is ready
	imageC := testCtrl.Image(s.ID)
	wait := WaitResource(ImageExpectState(imageC, "READY"))
	c.Assert(wait, Equals, true)

	snapC := imageC.Snapshot(-1)
	err := snapC.Revert()
	c.Assert(err, NotNil)
	c.Assert(err.Error(), Matches, ".*does not exist.*")

	err = snapC.Flatten()
	c.Assert(err, NotNil)
	c.Assert(err.Error(), Matches, ".*does not exist.*")

	err = snapC.Delete()
	c.Assert(err, NotNil)
	c.Assert(err.Error(), Matches, ".*does not exist.*")
}

func (s *ImageSuite) TestRestore(c *C) {
	imageC := testCtrl.Image(s.ID)
	err := imageC.Restore(1, "")
	c.Assert(err, NotNil)
	c.Assert(err.Error(), Matches, ".*Can only restore images of type BACKUP.*")
}
