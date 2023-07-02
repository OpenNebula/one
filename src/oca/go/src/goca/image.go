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

import (
	"encoding/xml"
	"errors"

	"github.com/OpenNebula/one/src/oca/go/src/goca/parameters"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/image"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// ImagesController is a controller for Images
type ImagesController entitiesController

// ImageController is a controller for Image entities
type ImageController entityController

// ImageSnapshotController is a controller for an Image snapshot
type ImageSnapshotController subEntityController

// Images returns an Images controller
func (c *Controller) Images() *ImagesController {
	return &ImagesController{c}
}

// Image returns an Image controller
func (c *Controller) Image(id int) *ImageController {
	return &ImageController{c, id}
}

// Snapshot returns an Image snapshot controller
func (ic *ImageController) Snapshot(id int) *ImageSnapshotController {
	return &ImageSnapshotController{ic.c, ic.ID, id}
}

// ByName returns an Image ID from name
func (c *ImagesController) ByName(name string, args ...int) (int, error) {
	var id int

	imagePool, err := c.Info(args...)
	if err != nil {
		return -1, err
	}

	match := false
	for i := 0; i < len(imagePool.Images); i++ {
		if imagePool.Images[i].Name != name {
			continue
		}
		if match {
			return -1, errors.New("multiple resources with that name")
		}
		id = imagePool.Images[i].ID
		match = true
	}
	if !match {
		return -1, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a new image pool. It accepts the scope of the query.
func (ic *ImagesController) Info(args ...int) (*image.Pool, error) {

	fArgs, err := handleArgs(args)
	if err != nil {
		return nil, err
	}

	response, err := ic.c.Client.Call("one.imagepool.info", fArgs...)
	if err != nil {
		return nil, err
	}

	imagePool := &image.Pool{}
	err = xml.Unmarshal([]byte(response.Body()), imagePool)
	if err != nil {
		return nil, err
	}

	return imagePool, nil
}

// Info connects to OpenNebula and fetches the information of the Image
func (ic *ImageController) Info(decrypt bool) (*image.Image, error) {
	response, err := ic.c.Client.Call("one.image.info", ic.ID, decrypt)
	if err != nil {
		return nil, err
	}
	image := &image.Image{}
	err = xml.Unmarshal([]byte(response.Body()), image)
	if err != nil {
		return nil, err
	}
	return image, nil
}

// Create allocates a new image based on the template string provided. It
// returns the image ID.
func (ic *ImagesController) Create(template string, dsid uint) (int, error) {
	response, err := ic.c.Client.Call("one.image.allocate", template, dsid)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Clone clones an existing image. It returns the clone ID
func (ic *ImageController) Clone(cloneName string, dsid int) (int, error) {
	response, err := ic.c.Client.Call("one.image.clone", ic.ID, cloneName, dsid)
	if err != nil {
		return -1, err
	}

	return response.BodyInt(), nil
}

// Update adds image content.
// * tpl: The new image contents. Syntax can be the usual attribute=value or XML.
// * uType: Update type: Replace: Replace the whole template.
//   Merge: Merge new template with the existing one.
func (ic *ImageController) Update(tpl string, uType parameters.UpdateType) error {
	_, err := ic.c.Client.Call("one.image.update", ic.ID, tpl, uType)
	return err
}

// Chtype changes the type of the Image
func (ic *ImageController) Chtype(newType string) error {
	_, err := ic.c.Client.Call("one.image.chtype", ic.ID, newType)
	return err
}

// Chown changes the owner/group of the image. If uid or gid is -1 it will not
// change
func (ic *ImageController) Chown(uid, gid int) error {
	_, err := ic.c.Client.Call("one.image.chown", ic.ID, uid, gid)
	return err
}

// Chmod changes the permissions of the image. If any perm is -1 it will not
// change
func (ic *ImageController) Chmod(perm shared.Permissions) error {
	args := append([]interface{}{ic.ID}, perm.ToArgs()...)

	_, err := ic.c.Client.Call("one.image.chmod", args...)
	return err
}

// Rename changes the name of the image
func (ic *ImageController) Rename(newName string) error {
	_, err := ic.c.Client.Call("one.image.rename", ic.ID, newName)
	return err
}

// Delete will delete a snapshot from the image
func (ic *ImageSnapshotController) Delete() error {
	_, err := ic.c.Client.Call("one.image.snapshotdelete", ic.entityID, ic.ID)
	return err
}

// Revert reverts image state to a previous snapshot
func (ic *ImageSnapshotController) Revert() error {
	_, err := ic.c.Client.Call("one.image.snapshotrevert", ic.entityID, ic.ID)
	return err
}

// Flatten flattens the snapshot image and discards others
func (ic *ImageSnapshotController) Flatten() error {
	_, err := ic.c.Client.Call("one.image.snapshotflatten", ic.entityID, ic.ID)
	return err
}

// Enable enables (or disables) the image
func (ic *ImageController) Enable(enable bool) error {
	_, err := ic.c.Client.Call("one.image.enable", ic.ID, enable)
	return err
}

// Persistent sets the image as persistent (or not)
func (ic *ImageController) Persistent(persistent bool) error {
	_, err := ic.c.Client.Call("one.image.persistent", ic.ID, persistent)
	return err
}

// Lock locks the image following lock level. See levels in locks.go.
func (ic *ImageController) Lock(level shared.LockLevel) error {
	_, err := ic.c.Client.Call("one.image.lock", ic.ID, level)
	return err
}

// Unlock unlocks the image.
func (ic *ImageController) Unlock() error {
	_, err := ic.c.Client.Call("one.image.unlock", ic.ID)
	return err
}

// Delete will remove the image from OpenNebula, which will remove it from the
// backend.
func (ic *ImageController) Delete() error {
	_, err := ic.c.Client.Call("one.image.delete", ic.ID)
	return err
}
