package shared

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
)

// Disk is a structure allowing to parse disk templates
type Disk struct {
	dyn.Vector
}

// DiskKeys is here to help the user to keep track of XML tags defined in Disk
type DiskKeys string

// Some keys are specific to VM some others to VRouter
const (
	DiskVec      string   = "DISK"
	DevPrefix    DiskKeys = "DEV_PREFIX"
	DiskID       DiskKeys = "DISK_ID"
	Datastore    DiskKeys = "DATASTORE"
	DatastoreID  DiskKeys = "DATASTORE_ID"
	DiskType     DiskKeys = "DISK_TYPE"
	Driver       DiskKeys = "DRIVER"
	Image        DiskKeys = "IMAGE"
	ImageID      DiskKeys = "IMAGE_ID"
	ImageUname   DiskKeys = "IMAGE_UNAME"
	OriginalSize DiskKeys = "ORIGINAL_SIZE"
	Size         DiskKeys = "SIZE"
	TargetDisk   DiskKeys = "TARGET"
)

// NewDisk returns a structure disk entity to build
func NewDisk() *Disk {
	return &Disk{
		dyn.Vector{XMLName: xml.Name{Local: DiskVec}},
	}
}

// ID returns the disk ID as an integer
func (d *Disk) ID() (int, error) {
	return d.GetInt(string(DiskID))
}

// Get return the string value for a disk key
func (d *Disk) Get(key DiskKeys) (string, error) {
	return d.GetStr(string(key))
}

// GetI returns the integer value for a disk key
func (d *Disk) GetI(key DiskKeys) (int, error) {
	return d.GetInt(string(key))
}

// Add adds a disk key, value pair
func (d *Disk) Add(key DiskKeys, value string) {
	d.AddPair(string(key), value)
}
