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

package image

import (
	"fmt"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Image pool
type Pool struct {
	Images []Image `xml:"IMAGE"`
}

// Image represents an OpenNebula Image
type Image struct {
	ID              int                 `xml:"ID"`
	UID             int                 `xml:"UID"`
	GID             int                 `xml:"GID"`
	UName           string              `xml:"UNAME"`
	GName           string              `xml:"GNAME"`
	Name            string              `xml:"NAME"`
	LockInfos       *shared.Lock        `xml:"LOCK"`
	Permissions     *shared.Permissions `xml:"PERMISSIONS"`
	Type            string              `xml:"TYPE"`
	DiskType        int                 `xml:"DISK_TYPE"`
	PersistentValue int                 `xml:"PERSISTENT"`
	RegTime         int                 `xml:"REGTIME"`
	Source          string              `xml:"SOURCE"`
	Path            string              `xml:"PATH"`
	FsType          string              `xml:"FSTYPE"`
	Size            int                 `xml:"SIZE"`
	StateRaw        int                 `xml:"STATE"`
	RunningVMs      int                 `xml:"RUNNING_VMS"`
	CloningOps      int                 `xml:"CLONING_OPS"`
	CloningID       int                 `xml:"CLONING_ID"`
	TargetSnapshot  int                 `xml:"TARGET_SNAPSHOT"`
	DatastoreID     int                 `xml:"DATASTORE_ID"`
	Datastore       string              `xml:"DATASTORE"`
	VMsID           []int               `xml:"VMS>ID"`
	ClonesID        []int               `xml:"CLONES>ID"`
	AppClonesID     []int               `xml:"APP_CLONES>ID"`
	Snapshots       Snapshot            `xml:"SNAPSHOTS"`
	Template        Template            `xml:"TEMPLATE"`
}

// Snapshot entity related
type Snapshot struct {
	AllowOrphans string            `xml:"ALLOW_ORPHANS"`
	CurrentBase  int               `xml:"CURRENT_BASE"`
	NextSnapshot int               `xml:"NEXT_SNAPSHOT"`
	Snapshots    []shared.Snapshot `xml:"SNAPSHOT"`
}

type Template struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
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
