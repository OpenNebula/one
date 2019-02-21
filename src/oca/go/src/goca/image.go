package goca

import (
	"encoding/xml"
	"errors"
	"fmt"
)

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

func (st ImageState) isValid() bool {
	if st >= ImageInit && st <= ImageLockUsedPers {
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

// CreateImage allocates a new image based on the template string provided. It
// returns the image ID.
func CreateImage(template string, dsid uint) (uint, error) {
	response, err := client.Call("one.image.allocate", template, dsid)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// NewImagePool returns a new image pool. It accepts the scope of the query. It
// performs an OpenNebula connection to fetch the information.
func NewImagePool(args ...int) (*ImagePool, error) {
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

	response, err := client.Call("one.imagepool.info", who, start, end)
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

// NewImage finds an image by ID returns a new Image object. At this stage no
// connection to OpenNebula is performed.
func NewImage(id uint) *Image {
	return &Image{ID: id}
}

// NewImageFromName finds an image by name and returns Image object. It connects
// to OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the image.
func NewImageFromName(name string) (*Image, error) {
	var id uint

	imagePool, err := NewImagePool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(imagePool.Images); i++ {
		if imagePool.Images[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = imagePool.Images[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewImage(id), nil
}

// Info connects to OpenNebula and fetches the information of the Image
func (image *Image) Info() error {
	response, err := client.Call("one.image.info", image.ID)
	if err != nil {
		return err
	}
	*image = Image{}
	return xml.Unmarshal([]byte(response.Body()), image)
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
func (image *Image) Clone(cloneName string, dsid int) (uint, error) {
	response, err := client.Call("one.image.clone", image.ID, cloneName, dsid)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Update will modify the image's template. If appendTemplate is 0, it will
// replace the whole template. If its 1, it will merge.
func (image *Image) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.image.update", image.ID, tpl, appendTemplate)
	return err
}

// Chtype changes the type of the Image
func (image *Image) Chtype(newType string) error {
	_, err := client.Call("one.image.chtype", image.ID, newType)
	return err
}

// Chown changes the owner/group of the image. If uid or gid is -1 it will not
// change
func (image *Image) Chown(uid, gid int) error {
	_, err := client.Call("one.image.chown", image.ID, uid, gid)
	return err
}

// Chmod changes the permissions of the image. If any perm is -1 it will not
// change
func (image *Image) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.image.chmod", image.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Rename changes the name of the image
func (image *Image) Rename(newName string) error {
	_, err := client.Call("one.image.rename", image.ID, newName)
	return err
}

// SnapshotDelete will delete a snapshot from the image
func (image *Image) SnapshotDelete(snapID int) error {
	_, err := client.Call("one.image.snapshotdelete", image.ID, snapID)
	return err
}

// SnapshotRevert reverts image state to a previous snapshot
func (image *Image) SnapshotRevert(snapID int) error {
	_, err := client.Call("one.image.snapshotrevert", image.ID, snapID)
	return err
}

// SnapshotFlatten flattens the snapshot image and discards others
func (image *Image) SnapshotFlatten(snapID int) error {
	_, err := client.Call("one.image.snapshotflatten", image.ID, snapID)
	return err
}

// Enable enables (or disables) the image
func (image *Image) Enable(enable bool) error {
	_, err := client.Call("one.image.enable", image.ID, enable)
	return err
}

// Persistent sets the image as persistent (or not)
func (image *Image) Persistent(persistent bool) error {
	_, err := client.Call("one.image.persistent", image.ID, persistent)
	return err
}

// Lock locks the image following block level.
func (image *Image) Lock(level uint) error {
	_, err := client.Call("one.image.lock", image.ID, level)
	return err
}

// Unlock unlocks the image.
func (image *Image) Unlock() error {
	_, err := client.Call("one.image.unlock", image.ID)
	return err
}

// Delete will remove the image from OpenNebula, which will remove it from the
// backend.
func (image *Image) Delete() error {
	_, err := client.Call("one.image.delete", image.ID)
	return err
}

// Lock actions

// LockUse locks USE actions for the image
func (image *Image) LockUse() error {
    return image.Lock(1)
}

// LockManage locks MANAGE actions for the image
func (image *Image) LockManage() error {
    return image.Lock(2)
}

// LockAdmin locks ADMIN actions for the image
func (image *Image) LockAdmin() error {
    return image.Lock(3)
}

// LockAll locks all actions for the image
func (image *Image) LockAll() error {
    return image.Lock(4)
}
