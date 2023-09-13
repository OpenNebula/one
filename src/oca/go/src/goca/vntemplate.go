/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

// Since version 5.8 of OpenNebula

import (
	"context"
	"encoding/xml"
	"errors"

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/vntemplate"
)

// VNTemplatesController is a controller for a pool of VNTemplate
type VNTemplatesController entitiesController

// VNTemplateController is a controller for VNTemplate entities
type VNTemplateController entityController

// VNTemplates returns a VNTemplates controller.
func (c *Controller) VNTemplates() *VNTemplatesController {
	return &VNTemplatesController{c}
}

// VNTemplate return an VNTemplate controller.
func (c *Controller) VNTemplate(id int) *VNTemplateController {
	return &VNTemplateController{c, id}
}

// ByName returns a VNTemplate id from name
func (c *VNTemplatesController) ByName(name string) (int, error) {
	return c.ByNameContext(context.Background(), name)
}

// ByNameContext returns a VNTemplate id from name
func (c *VNTemplatesController) ByNameContext(ctx context.Context, name string) (int, error) {
	var id int

	vnTemplatePool, err := c.InfoContext(ctx)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(vnTemplatePool.VNTemplates); i++ {
		if vnTemplatePool.VNTemplates[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = vnTemplatePool.VNTemplates[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a vntemplate pool. A connection to OpenNebula is
// performed.
func (vc *VNTemplatesController) Info(args ...int) (*vntemplate.Pool, error) {
	return vc.InfoContext(context.Background(), args...)
}

// InfoContext returns a vntemplate pool. A connection to OpenNebula is
// performed.
func (vc *VNTemplatesController) InfoContext(ctx context.Context, args ...int) (*vntemplate.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := vc.c.Client.CallContext(ctx, "one.vntemplatepool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	vnTemplatePool := &vntemplate.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), vnTemplatePool)
	if err != nil {
		return nil, err
	}

	return vnTemplatePool, nil

}

// Info connects to OpenNebula and fetches the information of the VNTemplate
func (vc *VNTemplateController) Info(decrypt bool) (*vntemplate.VNTemplate, error) {
	return vc.InfoContext(context.Background(), decrypt)
}

// InfoContext connects to OpenNebula and fetches the information of the VNTemplate
func (vc *VNTemplateController) InfoContext(ctx context.Context, decrypt bool) (*vntemplate.VNTemplate, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vntemplate.info", vc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	vntemplate := &vntemplate.VNTemplate{}
	err = xml.Unmarshal([]byte(response.Body()), vntemplate)
	if err != nil {
		return nil, err
	}

	return vntemplate, nil
}

// Create allocates a new vntemplate. It returns the new vntemplate ID.
func (vc *VNTemplateController) Create(vntemplate string) (int, error) {
	return vc.CreateContext(context.Background(), vntemplate)
}

// CreateContext allocates a new vntemplate. It returns the new vntemplate ID.
func (vc *VNTemplateController) CreateContext(ctx context.Context, vntemplate string) (int, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vntemplate.allocate", vntemplate)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Update adds vntemplate content.
// * tpl: The new vntemplate contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (vc *VNTemplateController) Update(tpl string, uType parameters.UpdateType) error {
	return vc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext adds vntemplate content.
//   - ctx: context for cancelation
//   - tpl: The new vntemplate contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (vc *VNTemplateController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vntemplate.update", vc.ID, tpl, uType)
	return err
}

// Chown changes the owner/group of a vntemplate. If uid or gid is -1 it will not
// change
func (vc *VNTemplateController) Chown(uid, gid int) error {
	return vc.ChownContext(context.Background(), uid, gid)
}

// ChownContext changes the owner/group of a vntemplate. If uid or gid is -1 it will not
// change
func (vc *VNTemplateController) ChownContext(ctx context.Context, uid, gid int) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vntemplate.chown", vc.ID, uid, gid)
	return err
}

// Chmod changes the permissions of a vntemplate. If any perm is -1 it will not
// change
func (vc *VNTemplateController) Chmod(perm shared.Permissions) error {
	return vc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permissions of a vntemplate. If any perm is -1 it will not
// change
func (vc *VNTemplateController) ChmodContext(ctx context.Context, perm shared.Permissions) error {
	args := append([]interface{}{vc.ID}, perm.ToArgs()...)
	_, err := vc.c.Client.CallContext(ctx, "one.vntemplate.chmod", args...)
	return err
}

// Rename changes the name of vntemplate
func (vc *VNTemplateController) Rename(newName string) error {
	return vc.RenameContext(context.Background(), newName)
}

// RenameContext changes the name of vntemplate
func (vc *VNTemplateController) RenameContext(ctx context.Context, newName string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vntemplate.rename", vc.ID, newName)
	return err
}

// Delete will remove the vntemplate from OpenNebula.
func (vc *VNTemplateController) Delete() error {
	return vc.DeleteContext(context.Background())
}

// DeleteContext will remove the vntemplate from OpenNebula.
func (vc *VNTemplateController) DeleteContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vntemplate.delete", vc.ID)
	return err
}

// Instantiate will instantiate the template
func (vc *VNTemplateController) Instantiate(name string, extra string) (int, error) {
	return vc.InstantiateContext(context.Background(), name, extra)
}

// InstantiateContext will instantiate the template
func (vc *VNTemplateController) InstantiateContext(ctx context.Context, name string, extra string) (int, error) {
	response, err := vc.c.Client.CallContext(ctx, "one.vntemplate.instantiate", vc.ID, name, extra)

	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Clone an existing vntemplate.
func (vc *VNTemplateController) Clone(name string) error {
	return vc.CloneContext(context.Background(), name)
}

// CloneContext an existing vntemplate.
func (vc *VNTemplateController) CloneContext(ctx context.Context, name string) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vntemplate.clone", vc.ID, name)
	return err
}

// Lock an existing vntemplate. See levels in locks.go.
func (vc *VNTemplateController) Lock(level shared.LockLevel) error {
	return vc.LockContext(context.Background(), level)
}

// LockContext an existing vntemplate. See levels in locks.go.
func (vc *VNTemplateController) LockContext(ctx context.Context, level shared.LockLevel) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vntemplate.lock", vc.ID, level)
	return err
}

// Unlock an existing vntemplate
func (vc *VNTemplateController) Unlock() error {
	return vc.UnlockContext(context.Background())
}

// UnlockContext an existing vntemplate
func (vc *VNTemplateController) UnlockContext(ctx context.Context) error {
	_, err := vc.c.Client.CallContext(ctx, "one.vntemplate.unlock", vc.ID)
	return err
}
