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

package image

import (
	"encoding/xml"
	"fmt"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Image pool
type Pool struct {
	XMLName xml.Name `xml:"IMAGE_POOL"`
	Images  []Image  `xml:"IMAGE"`
}

// Image represents an OpenNebula Image
type Image struct {
	XMLName        xml.Name            `xml:"IMAGE"`
	ID             int                 `xml:"ID,omitempty"`
	UID            int                 `xml:"UID,omitempty"`
	GID            int                 `xml:"GID,omitempty"`
	UName          string              `xml:"UNAME,omitempty"`
	GName          string              `xml:"GNAME,omitempty"`
	Name           string              `xml:"NAME"`
	LockInfos      *shared.Lock        `xml:"LOCK,omitempty"`
	Permissions    *shared.Permissions `xml:"PERMISSIONS,omitempty"`
	Type           string              `xml:"TYPE,omitempty"`
	DiskType       *int                `xml:"DISK_TYPE,omitempty"`
	Persistent     *int                `xml:"PERSISTENT,omitempty"`
	RegTime        int                 `xml:"REGTIME,omitempty"`
	Source         string              `xml:"SOURCE,omitempty"`
	Path           string              `xml:"PATH,omitempty"`
	Fs             string              `xml:"FS,omitempty"`
	Driver         string              `xml:"DRIVER,omitempty"`
	Format         string              `xml:"FORMAT,omitempty"`
	Size           int                 `xml:"SIZE,omitempty"`
	StateRaw       int                 `xml:"STATE,omitempty"`
	RunningVMs     int                 `xml:"RUNNING_VMS,omitempty"`
	CloningOps     int                 `xml:"CLONING_OPS,omitempty"`
	CloningID      int                 `xml:"CLONING_ID,omitempty"`
	TargetSnapshot int                 `xml:"TARGET_SNAPSHOT,omitempty"`
	DatastoreID    *int                `xml:"DATASTORE_ID,omitempty"`
	Datastore      string              `xml:"DATASTORE,omitempty"`
	VMs            shared.EntitiesID   `xml:"VMS,omitempty"`
	Clones         shared.EntitiesID   `xml:"CLONES,omitempty"`
	AppClones      shared.EntitiesID   `xml:"APP_CLONES,omitempty"`
	Snapshots      shared.DiskSnapshot `xml:"SNAPSHOTS,omitempty"`
	Template       Template            `xml:"TEMPLATE"`
}

// State is the state of the Image
type State int

const (
	// Init image is being initialized
	Init State = iota

	// Ready image is ready to be used
	Ready

	// Used image is in use
	Used

	// Disabled image is in disabled
	Disabled

	// Locked image is locked
	Locked

	// Error image is in error state
	Error

	// Clone image is in clone state
	Clone

	// Delete image is in delete state
	Delete

	// UsedPers image is in use and persistent
	UsedPers

	// LockUsed image is in locked state (non-persistent)
	LockUsed

	// LockUsedPers image is in locked state (persistent)
	LockUsedPers
)

func (s State) isValid() bool {
	if s >= Init && s <= LockUsedPers {
		return true
	}
	return false
}

// String returns the string version of the State
func (s State) String() string {
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

// State looks up the state of the image and returns the State
func (image *Image) State() (State, error) {
	state := State(image.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Image State: this state value is not currently handled: %d\n", image.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (image *Image) StateString() (string, error) {
	state := State(image.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Image State: this state value is not currently handled: %d\n", image.StateRaw)
	}
	return state.String(), nil
}
