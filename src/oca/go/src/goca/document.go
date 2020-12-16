/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
	var id int

	documentPool, err := dc.Info(args...)
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

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}
	fArgs = append(fArgs, dc.dType)

	response, err := dc.c.Client.Call("one.documentpool.info", fArgs...)
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
	response, err := dc.c.Client.Call("one.document.info", dc.ID, decrypt)
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
	response, err := dc.c.Client.Call("one.document.allocate", tpl)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Clone clones an existing document.
// * newName: Name for the new document.
func (dc *DocumentController) Clone(newName string) error {
	_, err := dc.c.Client.Call("one.document.clone", dc.ID, newName)
	return err
}

// Delete deletes the given document from the pool.
func (dc *DocumentController) Delete() error {
	_, err := dc.c.Client.Call("one.document.delete", dc.ID)
	return err
}

// Update adds document content.
// * tpl: The new document contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (dc *DocumentController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := dc.c.Client.Call("one.document.update", dc.ID, tpl, uType)
	return err
}

// Chmod changes the permission bits of a document.
func (dc *DocumentController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{dc.ID}, perm.ToArgs()...)
	_, err := dc.c.Client.Call("one.document.chmod", args...)
	return err
}

// Chown changes the ownership of a document.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (dc *DocumentController) Chown(userID, groupID int) error {
	_, err := dc.c.Client.Call("one.document.chown", dc.ID, userID, groupID)
	return err
}

// Rename renames a document.
// * newName: The new name.
func (dc *DocumentController) Rename(newName string) error {
	_, err := dc.c.Client.Call("one.document.rename", dc.ID, newName)
	return err
}

// Lock locks the document following lock level. See levels in locks.go.
func (dc *DocumentController) Lock(level shared.LockLevel) error {
	_, err := dc.c.Client.Call("one.document.lock", dc.ID, level)
	return err
}

// Unlock unlocks the document.
func (dc *DocumentController) Unlock() error {
	_, err := dc.c.Client.Call("one.document.unlock", dc.ID)
	return err
}
