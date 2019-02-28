/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
)

// DocumentsController is a controller for documents entities
type DocumentsController struct {
	entitiesController
	dType int
}

// DocumentController is a controller for document entity
type DocumentController entityController

// DocumentPool represents an OpenNebula DocumentPool
type DocumentPool struct {
	Documents []Document `xml:"DOCUMENT"`
}

// Document represents an OpenNebula Document
type Document struct {
	ID          uint             `xml:"ID"`
	UID         int              `xml:"UID"`
	GID         int              `xml:"GID"`
	UName       string           `xml:"UNAME"`
	GName       string           `xml:"GNAME"`
	Name        string           `xml:"NAME"`
	Type        string           `xml:"TYPE"`
	Permissions *Permissions     `xml:"PERMISSIONS"`
	LockInfos   *Lock            `xml:"LOCK"`
	Template    documentTemplate `xml:"TEMPLATE"`
}

type documentTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// Documents returns a Documents controller
func (c *Controller) Documents(dType int) *DocumentsController {
	return &DocumentsController{entitiesController{c}, dType}
}

// Document returns a Document controller
func (c *Controller) Document(id uint) *DocumentController {
	return &DocumentController{c, id}
}

// ByName returns a Document ID from name
func (dc *DocumentsController) ByName(name string, args ...int) (uint, error) {
	var id uint

	documentPool, err := dc.Info(args...)
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(documentPool.Documents); i++ {
		if documentPool.Documents[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = documentPool.Documents[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a document pool. A connection to OpenNebula is
// performed.
func (dc *DocumentsController) Info(args ...int) (*DocumentPool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
	case 1:
		who = args[0]
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := dc.c.Client.Call("one.documentpool.info", who, start, end, dc.dType)
	if err != nil {
		return nil, err
	}

	documentPool := &DocumentPool{}
	err = xml.Unmarshal([]byte(response.Body()), documentPool)
	if err != nil {
		return nil, err
	}

	return documentPool, nil
}

// Info retrieves information for the document.
func (dc *DocumentController) Info() (*Document, error) {
	response, err := dc.c.Client.Call("one.document.info", dc.ID)
	if err != nil {
		return nil, err
	}
	document := &Document{}
	err = xml.Unmarshal([]byte(response.Body()), document)
	if err != nil {
		return nil, err
	}

	return document, nil
}

// Create allocates a new document. It returns the new document ID.
func (dc *DocumentsController) Create(tpl string) (uint, error) {
	response, err := dc.c.Client.Call("one.document.allocate", tpl)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
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

// Update replaces the document template contents.
// * tpl: The new document template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (dc *DocumentController) Update(tpl string, appendTemplate int) error {
	_, err := dc.c.Client.Call("one.document.update", dc.ID, tpl, appendTemplate)
	return err
}

// Chmod changes the permission bits of a document.
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (dc *DocumentController) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := dc.c.Client.Call("one.document.chmod", dc.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
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

// Lock locks the document at the api level. The lock automatically expires after 2 minutes.
// * applicationName: String to identify the application requesting the lock.
func (dc *DocumentController) Lock(applicationName string) error {
	_, err := dc.c.Client.Call("one.document.lock", dc.ID, applicationName)
	return err
}

// Unlock unlocks the document at the api level.
// * applicationName: String to identify the application requesting the lock.
func (dc *DocumentController) Unlock(applicationName string) error {
	_, err := dc.c.Client.Call("one.document.unlock", dc.ID, applicationName)
	return err
}
