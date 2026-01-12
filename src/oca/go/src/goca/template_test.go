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

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vm/keys"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

type TemplateSuite struct {
	ID       int
}

var _ = Suite(&TemplateSuite{})

func (s *TemplateSuite) SetUpTest(c *C) {
	templateName := GenName("template")

	// Create template
	tpl := vm.NewTemplate()
	tpl.Add(keys.Name, templateName)
	tpl.CPU(1).Memory(64)

	id, err := testCtrl.Templates().Create(tpl.String())
	c.Assert(err, IsNil)

	s.ID = id
}

func (s *TemplateSuite) TearDownTest(c *C) {
	// Delete tmpl
	testCtrl.Template(s.ID).Delete()
}

func (s *TemplateSuite) TestGetByNameAndID(c *C) {
	// Get tmpl by ID
	tmplC := testCtrl.Template(s.ID)
	tmpl, err := tmplC.Info(false, false)
	c.Assert(err, IsNil)
	c.Assert(tmpl.ID, Equals, s.ID)

	// Get tmpl by Name
	id, err := testCtrl.Templates().ByName(tmpl.Name)
	c.Assert(err, IsNil)
	c.Assert(tmpl.ID, Equals, id)
}

func (s *TemplateSuite) TestUpdate(c *C) {
	// Update
	tmplC := testCtrl.Template(s.ID)
	err := tmplC.Update("A=B", 1)
	c.Assert(err, IsNil)

	tmpl, err := tmplC.Info(false, false)
	c.Assert(err, IsNil)

	val, err := tmpl.Template.GetStr("A")
	c.Assert(err, IsNil)
	c.Assert(val, Equals, "B")
}

func (s *TemplateSuite) TestRename(c *C) {
	tmplC := testCtrl.Template(s.ID)
	tmplC.Rename("new_name")

	tmpl, err := tmplC.Info(false, false)
	c.Assert(err, IsNil)
	c.Assert(tmpl.Name, Equals, "new_name");
}

func (s *TemplateSuite) TestChmod(c *C) {
	new_permissions := shared.Permissions{1, 1, 1, 1, 1, 1, 1, 1, 1}

	tmplC := testCtrl.Template(s.ID)

	err := tmplC.Chmod(new_permissions)

	c.Assert(err, IsNil)

	tmpl, err := tmplC.Info(false, false)

	c.Assert(err, IsNil)
	c.Assert(*tmpl.Permissions, Equals, new_permissions);
}

func (s *TemplateSuite) TestChown(c *C) {
	// Test only if the call exists, no real change
	tmplC := testCtrl.Template(s.ID)
	err := tmplC.Chown(1, 1)

	c.Assert(err, IsNil)

	tmpl, err := tmplC.Info(false, false)
	c.Assert(err, IsNil)
	c.Assert(tmpl.UID, Equals, 1);
	c.Assert(tmpl.GID, Equals, 1);
}

func (s *TemplateSuite) TestLock(c *C) {
	// Lock
	tmplC := testCtrl.Template(s.ID)
	err := tmplC.Lock(shared.LockUse)
	c.Assert(err, IsNil)

	tmpl, err := tmplC.Info(false, false)
	c.Assert(err, IsNil)
	c.Assert(tmpl.LockInfos.Locked, Equals, 1);

	// Unlock
	err = tmplC.Unlock()
	c.Assert(err, IsNil)

	tmpl, err = tmplC.Info(false, false)
	c.Assert(err, IsNil)
	c.Assert(tmpl.LockInfos, IsNil)
}

func (s *TemplateSuite) TestClone(c *C) {
	name := GenName("cloned_tmpl")
	tmplC := testCtrl.Template(s.ID)
	err := tmplC.Clone(name, false)
	c.Assert(err, IsNil)

	// Delete cloned tmpl
	id, err := testCtrl.Templates().ByName(name)
	c.Assert(err, IsNil)

	testCtrl.Template(id).Delete()
}

func (s *TemplateSuite) TestInstantiate(c *C) {
	// Get template by ID
	tmplC := testCtrl.Template(s.ID)

	// Instantiate(name string, pending bool, extra string) (uint, error)
	vmid, err := tmplC.Instantiate("", false, "", false)
	c.Assert(err, IsNil)

	err = testCtrl.VM(vmid).Terminate()
	c.Assert(err, IsNil)
}
