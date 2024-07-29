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
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/document"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// DocumentsController is a controller for documents entities
type DocumentsController struct {
	entitiesController
	dType int
}

// DocumentController is a controller for document entity
type DocumentController entityController

// Documents returns a Documents controller
func (c *Controller) Documents(dType int) *DocumentsController {
	return &DocumentsController{entitiesController{c}, dType}
}

// Document returns a Document controller
func (c *Controller) Document(id int) *DocumentController {
	return &DocumentController{c, id}
}

// ByName returns a Document ID from name
func (dc *DocumentsController) ByName(name string, args ...int) (int, error) {
	return dc.ByNameContext(context.Background(), name, args...)
}

// ByNameContext returns a Document ID from name
func (dc *DocumentsController) ByNameContext(ctx context.Context, name string, args ...int) (int, error) {
	var id int

	documentPool, err := dc.InfoContext(ctx, args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(documentPool.Documents); i++ {
		if documentPool.Documents[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = documentPool.Documents[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a document pool. A connection to OpenNebula is
// performed.
func (dc *DocumentsController) Info(args ...int) (*document.Pool, error) {
	return dc.InfoContext(context.Background(), args...)
}

// InfoContext returns a document pool. A connection to OpenNebula is
// performed.
func (dc *DocumentsController) InfoContext(ctx context.Context, args ...int) (*document.Pool, error) {
	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}
	fArgs = append(fArgs, dc.dType)

	response, err := dc.c.Client.CallContext(ctx, "one.documentpool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	documentPool := &document.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), documentPool)
	if err != nil {
		return nil, err
	}

	return documentPool, nil
}

// Info retrieves information for the document.
func (dc *DocumentController) Info(decrypt bool) (*document.Document, error) {
	return dc.InfoContext(context.Background(), decrypt)
}

// InfoContext retrieves information for the document.
func (dc *DocumentController) InfoContext(ctx context.Context, decrypt bool) (*document.Document, error) {
	response, err := dc.c.Client.CallContext(ctx, "one.document.info", dc.ID, decrypt)
	if err != nil {
		return nil, err
	}
	document := &document.Document{}
	err = xml.Unmarshal([]byte(response.Body()), document)
	if err != nil {
		return nil, err
	}

	return document, nil
}

// Create allocates a new document. It returns the new document ID.
func (dc *DocumentsController) Create(tpl string) (int, error) {
	return dc.CreateContext(context.Background(), tpl)
}

// CreateContext allocates a new document. It returns the new document ID.
func (dc *DocumentsController) CreateContext(ctx context.Context, tpl string) (int, error) {
	response, err := dc.c.Client.CallContext(ctx, "one.document.allocate", tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Clone clones an existing document.
// * newName: Name for the new document.
func (dc *DocumentController) Clone(newName string) error {
	return dc.CloneContext(context.Background(), newName)
}

// CloneContext clones an existing document.
// * ctx: context for cancelation
// * newName: Name for the new document.
func (dc *DocumentController) CloneContext(ctx context.Context, newName string) error {
	_, err := dc.c.Client.CallContext(ctx, "one.document.clone", dc.ID, newName)
	return err
}

// Delete deletes the given document from the pool.
func (dc *DocumentController) Delete() error {
	return dc.DeleteContext(context.Background())
}

// DeleteContext deletes the given document from the pool.
func (dc *DocumentController) DeleteContext(ctx context.Context) error {
	_, err := dc.c.Client.CallContext(ctx, "one.document.delete", dc.ID)
	return err
}

// Update adds document content.
// * tpl: The new document contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (dc *DocumentController) Update(tpl string, uType parameters.UpdateType) error {
	return dc.UpdateContext(context.Background(), tpl, uType)
}

// UpdateContext adds document content.
//   - ctx: context for cancelation
//   - tpl: The new document contents. Syntax can be the usual attribute=value or XML.
//   - uType: Update type: Replace: Replace the whole template.
//     Merge: Merge new template with the existing one.
func (dc *DocumentController) UpdateContext(ctx context.Context, tpl string, uType parameters.UpdateType) error {
	_, err := dc.c.Client.CallContext(ctx, "one.document.update", dc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a document.
func (dc *DocumentController) Chmod(perm shared.Permissions) error {
	return dc.ChmodContext(context.Background(), perm)
}

// ChmodContext changes the permission bits of a document.
func (dc *DocumentController) ChmodContext(ctx context.Context, perm shared.Permissions) error {
	args := append([]interface{}{dc.ID}, perm.ToArgs()...)
	_, err := dc.c.Client.CallContext(ctx, "one.document.chmod", args...)
	return err
}

// Chown changes the ownership of a document.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (dc *DocumentController) Chown(userID, groupID int) error {
	return dc.ChownContext(context.Background(), userID, groupID)
}

// ChownContext changes the ownership of a document.
// * ctx: context for cancelation
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (dc *DocumentController) ChownContext(ctx context.Context, userID, groupID int) error {
	_, err := dc.c.Client.CallContext(ctx, "one.document.chown", dc.ID, userID, groupID)
	return err
}

// Rename renames a document.
// * newName: The new name.
func (dc *DocumentController) Rename(newName string) error {
	return dc.RenameContext(context.Background(), newName)
}

// RenameContext renames a document.
// * ctx: context for cancelation
// * newName: The new name.
func (dc *DocumentController) RenameContext(ctx context.Context, newName string) error {
	_, err := dc.c.Client.CallContext(ctx, "one.document.rename", dc.ID, newName)
	return err
}

// Lock locks the document following lock level. See levels in locks.go.
func (dc *DocumentController) Lock(level shared.LockLevel) error {
	return dc.LockContext(context.Background(), level)
}

// LockContext locks the document following lock level. See levels in locks.go.
func (dc *DocumentController) LockContext(ctx context.Context, level shared.LockLevel) error {
	_, err := dc.c.Client.CallContext(ctx, "one.document.lock", dc.ID, level)
	return err
}

// Unlock unlocks the document.
func (dc *DocumentController) Unlock() error {
	return dc.UnlockContext(context.Background())
}

func (dc *DocumentController) UnlockContext(ctx context.Context) error {
	_, err := dc.c.Client.CallContext(ctx, "one.document.unlock", dc.ID)
	return err
}
