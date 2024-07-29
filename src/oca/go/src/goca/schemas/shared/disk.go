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
	Cache        DiskKeys = "CACHE"
	Discard      DiskKeys = "DISCARD"
	IO           DiskKeys = "IO"
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
func (d *Disk) Add(key DiskKeys, value interface{}) {
	d.AddPair(string(key), value)
}
