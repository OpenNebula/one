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
	"fmt"
)

// ImagesController is a controller for Images
type ImagesController entitiesController

// ImageController is a controller for Image entities
type ImageController entityController

// ImageSnapshotController is a controller for an Image snapshot
type ImageSnapshotController subEntityController

// ImagePool represents an OpenNebula Image pool
type ImagePool struct {
	Images []Image `xml:"IMAGE"`
}

// Image represents an OpenNebula Image
type Image struct {
	ID              uint          `xml:"ID"`
	UID             int           `xml:"UID"`
	GID             int           `xml:"GID"`
	UName           string        `xml:"UNAME"`
	GName           string        `xml:"GNAME"`
	Name            string        `xml:"NAME"`
	LockInfos       *Lock         `xml:"LOCK"`
	Permissions     *Permissions  `xml:"PERMISSIONS"`
	Type            int           `xml:"TYPE"`
	DiskType        int           `xml:"DISK_TYPE"`
	PersistentValue int           `xml:"PERSISTENT"`
	RegTime         int           `xml:"REGTIME"`
	Source          string        `xml:"SOURCE"`
	Path            string        `xml:"PATH"`
	FsType          string        `xml:"FSTYPE"`
	Size            int           `xml:"SIZE"`
	StateRaw        int           `xml:"STATE"`
	RunningVMs      int           `xml:"RUNNING_VMS"`
	CloningOps      int           `xml:"CLONING_OPS"`
	CloningID       int           `xml:"CLONING_ID"`
	TargetSnapshot  int           `xml:"TARGET_SNAPSHOT"`
	DatastoreID     int           `xml:"DATASTORE_ID"`
	Datastore       string        `xml:"DATASTORE"`
	VMsID           []int         `xml:"VMS>ID"`
	ClonesID        []int         `xml:"CLONES>ID"`
	AppClonesID     []int         `xml:"APP_CLONES>ID"`
	Snapshots       ImageSnapshot `xml:"SNAPSHOTS"`
	Template        imageTemplate `xml:"TEMPLATE"`
}

type imageTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// ImageState is the state of the Image
type ImageState int

const (
	// ImageInit image is being initialized
	ImageInit ImageState = iota

	// ImageReady image is ready to be used
	ImageReady

	// ImageUsed image is in use
	ImageUsed

	// ImageDisabled image is in disabled
	ImageDisabled

	// ImageLocked image is locked
	ImageLocked

	// ImageError image is in error state
	ImageError

	// ImageClone image is in clone state
	ImageClone

	// ImageDelete image is in delete state
	ImageDelete

	// ImageUsedPers image is in use and persistent
	ImageUsedPers

	// ImageLockUsed image is in locked state (non-persistent)
	ImageLockUsed

	// ImageLockUsedPers image is in locked state (persistent)
	ImageLockUsedPers
)

func (s ImageState) isValid() bool {
	if s >= ImageInit && s <= ImageLockUsedPers {
		return true
	}
	return false
}

// String returns the string version of the ImageState
func (s ImageState) String() string {
	return [...]string{
		"INIT",
		"READY",
		"USED",
		"DISABLED",
		"LOCKED",
		"ERROR",
		"CLONE",
		"DELETE",
		"USED_PERS",
		"LOCKED_USED",
		"LOCKED_USED_PERS",
	}[s]
}

// Images returns an Images controller
func (c *Controller) Images() *ImagesController {
	return &ImagesController{c}
}

// Image returns an Image controller
func (c *Controller) Image(id uint) *ImageController {
	return &ImageController{c, id}
}

// Snapshot returns an Image snapshot controller
func (ic *ImageController) Snapshot(id uint) *ImageSnapshotController {
	return &ImageSnapshotController{ic.c, ic.ID, id}
}

// ByName returns an Image ID from name
func (c *ImagesController) ByName(name string, args ...int) (uint, error) {
	var id uint

	imagePool, err := c.Info(args...)
	if err != nil {
		return 0, err
	}

	match := false
	for i := 0; i < len(imagePool.Images); i++ {
		if imagePool.Images[i].Name != name {
			continue
		}
		if match {
			return 0, errors.New("multiple resources with that name")
		}
		id = imagePool.Images[i].ID
		match = true
	}
	if !match {
		return 0, errors.New("resource not found")
	}

	return id, nil
}

// Info returns a new image pool. It accepts the scope of the query.
func (ic *ImagesController) Info(args ...int) (*ImagePool, error) {
	var who, start, end int

	switch len(args) {
	case 0:
		who = PoolWhoMine
		start = -1
		end = -1
	case 3:
		who = args[0]
		start = args[1]
		end = args[2]
	default:
		return nil, errors.New("Wrong number of arguments")
	}

	response, err := ic.c.Client.Call("one.imagepool.info", who, start, end)
	if err != nil {
		return nil, err
	}

	imagePool := &ImagePool{}
	err = xml.Unmarshal([]byte(response.Body()), imagePool)
	if err != nil {
		return nil, err
	}

	return imagePool, nil
}

// Info connects to OpenNebula and fetches the information of the Image
func (ic *ImageController) Info() (*Image, error) {
	response, err := ic.c.Client.Call("one.image.info", ic.ID)
	if err != nil {
		return nil, err
	}
	image := &Image{}
	err = xml.Unmarshal([]byte(response.Body()), image)
	if err != nil {
		return nil, err
	}
	return image, nil
}

// Create allocates a new image based on the template string provided. It
// returns the image ID.
func (ic *ImagesController) Create(template string, dsid uint) (uint, error) {
	response, err := ic.c.Client.Call("one.image.allocate", template, dsid)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// State looks up the state of the image and returns the ImageState
func (image *Image) State() (ImageState, error) {
	state := ImageState(image.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Image State: this state value is not currently handled: %d\n", image.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (image *Image) StateString() (string, error) {
	state := ImageState(image.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Image State: this state value is not currently handled: %d\n", image.StateRaw)
	}
	return state.String(), nil
}

// Clone clones an existing image. It returns the clone ID
func (ic *ImageController) Clone(cloneName string, dsid int) (uint, error) {
	response, err := ic.c.Client.Call("one.image.clone", ic.ID, cloneName, dsid)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Update will modify the image's template. If appendTemplate is 0, it will
// replace the whole template. If its 1, it will merge.
func (ic *ImageController) Update(tpl string, appendTemplate int) error {
	_, err := ic.c.Client.Call("one.image.update", ic.ID, tpl, appendTemplate)
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
func (ic *ImageController) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := ic.c.Client.Call("one.image.chmod", ic.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
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

// Lock locks the image following block level.
func (ic *ImageController) Lock(level uint) error {
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

// Lock actions

// LockUse locks USE actions for the image
func (ic *ImageController) LockUse() error {
	return ic.Lock(1)
}

// LockManage locks MANAGE actions for the image
func (ic *ImageController) LockManage() error {
	return ic.Lock(2)
}

// LockAdmin locks ADMIN actions for the image
func (ic *ImageController) LockAdmin() error {
	return ic.Lock(3)
}

// LockAll locks all actions for the image
func (ic *ImageController) LockAll() error {
	return ic.Lock(4)
}
