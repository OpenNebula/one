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
	"errors"

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/template"
)

// TemplatesController is a controller for a pool of template
type TemplatesController entitiesController

// TemplateController is a controller for Template entities
type TemplateController entityController

// Templates returns a Templates controller.
func (c *Controller) Templates() *TemplatesController {
	return &TemplatesController{c}
}

// Template returns a Template controller
func (c *Controller) Template(id int) *TemplateController {
	return &TemplateController{c, id}
}

// ByName returns a Template by Name
func (c *TemplatesController) ByName(name string, args ...int) (int, error) {
	return c.ByNameContext(context.Background(), name, args...)
}

// ByNameContext returns a Template by Name
func (c *TemplatesController) ByNameContext(ctx context.Context, name string, args ...int) (int, error) {
	var id int

	templatePool, err := c.InfoContext(ctx, args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(templatePool.Templates); i++ {
		if templatePool.Templates[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = templatePool.Templates[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a template pool. A connection to OpenNebula is
// performed.
func (tc *TemplatesController) Info(args ...int) (*template.Pool, error) {
	return tc.InfoContext(context.Background(), args...)
}

// InfoContext returns a template pool. A connection to OpenNebula is
// performed.
func (tc *TemplatesController) InfoContext(ctx context.Context, args ...int) (*template.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := tc.c.Client.CallContext(ctx, "one.templatepool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	templatePool := &template.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), templatePool)
	if err != nil {
		return nil, err
	}

	return templatePool, nil
}

// Info connects to OpenNebula and fetches the information of the Template
func (tc *TemplateController) Info(extended, decrypt bool) (*template.Template, error) {
	return tc.InfoContext(context.Background(), extended, decrypt)
}

// InfoContext connects to OpenNebula and fetches the information of the Template
func (tc *TemplateController) InfoContext(ctx context.Context, extended, decrypt bool) (*template.Template, error) {
	response, err := tc.c.Client.CallContext(ctx, "one.template.info", tc.ID, extended, decrypt)
	if err != nil {
		return nil, err
	}
	template := &template.Template{}
	err = xml.Unmarshal([]byte(response.Body()), template)
	if err != nil {
		return nil, err
	}

	return template, nil
}

// Create allocates a new template. It returns the new template ID.
func (tc *TemplatesController) Create(template string) (int, error) {
	return tc.CreateContext(context.Background(), template)
}

// CreateContext allocates a new template. It returns the new template ID.
func (tc *TemplatesController) CreateContext(ctx context.Context, template string) (int, error) {
	response, err := tc.c.Client.CallContext(ctx, "one.template.allocate", template)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Update adds template content.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (tc *TemplateController) Update(tpl string, uType parameters.UpdateType) error {
	return tc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext adds template content.
//   - ctx: context for cancelation
//   - tpl: The new template contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (tc *TemplateController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := tc.c.Client.CallContext(ctx, "one.template.update", tc.ID, tpl, uType)
	return err
}

// Chown changes the owner/group of a template. If uid or gid is -1 it will not
// change
func (tc *TemplateController) Chown(uid, gid int) error {
	return tc.ChownContext(context.Background(), uid, gid)
}

// ChownContext changes the owner/group of a template. If uid or gid is -1 it will not
// change
func (tc *TemplateController) ChownContext(ctx context.Context, uid, gid int) error {
	_, err := tc.c.Client.CallContext(ctx, "one.template.chown", tc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a template. If any perm is -1 it will not
// change
func (tc *TemplateController) Chmod(perm shared.Permissions) error {
	return tc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permissions of a template. If any perm is -1 it will not
// change
func (tc *TemplateController) ChmodContext(ctx context.Context, perm shared.Permissions) error {
	args := append([]interface{}{tc.ID}, perm.ToArgs()...)
	_, err := tc.c.Client.CallContext(ctx, "one.template.chmod", args...)
	return err
}

// Rename changes the name of template
func (tc *TemplateController) Rename(newName string) error {
	return tc.RenameContext(context.Background(), newName)
}

// RenameContext changes the name of template
func (tc *TemplateController) RenameContext(ctx context.Context, newName string) error {
	_, err := tc.c.Client.CallContext(ctx, "one.template.rename", tc.ID, newName)
	return err
}

// Delete will remove the template from OpenNebula.
func (tc *TemplateController) Delete() error {
	return tc.DeleteContext(context.Background())
}

// DeleteContext will remove the template from OpenNebula.
func (tc *TemplateController) DeleteContext(ctx context.Context) error {
	_, err := tc.c.Client.CallContext(ctx, "one.template.delete", tc.ID)
	return err
}

// Instantiate will instantiate the template
func (tc *TemplateController) Instantiate(name string, pending bool, extra string, clone bool) (int, error) {
	return tc.InstantiateContext(context.Background(), name, pending, extra, clone)
}

// InstantiateContext will instantiate the template
func (tc *TemplateController) InstantiateContext(ctx context.Context, name string, pending bool, extra string, clone bool) (int, error) {
	response, err := tc.c.Client.CallContext(ctx, "one.template.instantiate", tc.ID, name, pending, extra, clone)

	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Clone an existing template. If recursive is true it will clone the template
// plus any image defined in DISK. The new IMAGE_ID is set into each DISK.
func (tc *TemplateController) Clone(name string, recursive bool) error {
	return tc.CloneContext(context.Background(), name, recursive)
}

// CloneContext an existing template. If recursive is true it will clone the template
// plus any image defined in DISK. The new IMAGE_ID is set into each DISK.
func (tc *TemplateController) CloneContext(ctx context.Context, name string, recursive bool) error {
	_, err := tc.c.Client.CallContext(ctx, "one.template.clone", tc.ID, name, recursive)
	return err
}

// Lock locks the template following block level. See levels in locks.go.
func (tc *TemplateController) Lock(level shared.LockLevel) error {
	return tc.LockContext(context.Background(), level)
}

// LockContext locks the template following block level. See levels in locks.go.
func (tc *TemplateController) LockContext(ctx context.Context, level shared.LockLevel) error {
	_, err := tc.c.Client.CallContext(ctx, "one.template.lock", tc.ID, level)
	return err
}

// Unlock unlocks the template.
func (tc *TemplateController) Unlock() error {
	return tc.UnlockContext(context.Background())
}

// UnlockContext unlocks the template.
func (tc *TemplateController) UnlockContext(ctx context.Context) error {
	_, err := tc.c.Client.CallContext(ctx, "one.template.unlock", tc.ID)
	return err
}
