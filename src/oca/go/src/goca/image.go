package goca

import (
	"errors"
	"strconv"
)

// Image represents an OpenNebula Image
type Image struct {
	XMLResource
	ID   uint
	Name string
}

// ImagePool represents an OpenNebula Image pool
type ImagePool struct {
	XMLResource
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

	// ImageLockUsed image is in locked state (non-persistent)
	ImageLockUsed

	// ImageLockUsedPers image is in locked state (persistent)
	ImageLockUsedPers
)

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
// performs an OpenNebula connectio to fetch the information.
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

	imagepool := &ImagePool{XMLResource{body: response.Body()}}

	return imagepool, err

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
	imagePool, err := NewImagePool()
	if err != nil {
		return nil, err
	}

	id, err := imagePool.GetIDFromName(name, "/IMAGE_POOL/IMAGE")
	if err != nil {
		return nil, err
	}

	return NewImage(id), nil
}

// Info connects to OpenNebula and fetches the information of the Image
func (image *Image) Info() error {
	response, err := client.Call("one.image.info", image.ID)
	image.body = response.Body()
	return err
}

// State looks up the state of the image and returns the ImageState
func (image *Image) State() (ImageState, error) {
	stateString, ok := image.XPath("/IMAGE/STATE")
	if ok != true {
		return -1, errors.New("Unable to parse Image State")
	}

	state, _ := strconv.Atoi(stateString)

	return ImageState(state), nil
}

// StateString returns the state in string format
func (image *Image) StateString() (string, error) {
	state, err := image.State()
	if err != nil {
		return "", err
	}
	return ImageState(state).String(), nil
}

// Delete will remove the image from OpenNebula, which will remove it from the
// backend.
func (image *Image) Delete() error {
	_, err := client.Call("one.image.delete", image.ID)
	return err
}
