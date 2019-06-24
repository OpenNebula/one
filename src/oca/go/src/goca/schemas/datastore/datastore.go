package datastore

import (
	"fmt"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Datastore pool
type Pool struct {
	Datastores []Datastore `xml:"DATASTORE"`
}

// Datastore represents an OpenNebula Datastore
type Datastore struct {
	ID          int                 `xml:"ID"`
	UID         int                 `xml:"UID"`
	GID         int                 `xml:"GID"`
	UName       string              `xml:"UNAME"`
	GName       string              `xml:"GNAME"`
	Name        string              `xml:"NAME"`
	Permissions *shared.Permissions `xml:"PERMISSIONS"`
	DSMad       string              `xml:"DS_MAD"`
	TMMad       string              `xml:"TM_MAD"`
	BasePath    string              `xml:"BASE_PATH"`
	Type        string              `xml:"TYPE"`
	DiskType    string              `xml:"DISK_TYPE"`
	StateRaw    int                 `xml:"STATE"`
	ClustersID  []int               `xml:"CLUSTERS>ID"`
	TotalMB     int                 `xml:"TOTAL_MB"`
	FreeMB      int                 `xml:"FREE_MB"`
	UsedMB      int                 `xml:"USED_MB"`
	ImagesID    []int               `xml:"IMAGES>ID"`
	Template    Template            `xml:"TEMPLATE"`
}

type Template struct {
	Dynamic dyn.UnmatchedTagsSlice `xml:",any"`
}

// State is the state of an OpenNebula datastore
type State int

const (
	// Ready datastore is ready
	Ready = iota

	// Disable datastore is disabled
	Disable
)

func (s State) isValid() bool {
	if s >= Ready && s <= Disable {
		return true
	}
	return false
}

func (s State) String() string {
	return [...]string{
		"READY",
		"DISABLE",
	}[s]
}

// State looks up the state of the image and returns the DatastoreState
func (datastore *Datastore) State() (State, error) {
	state := State(datastore.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Datastore State: this state value is not currently handled: %d\n", datastore.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (datastore *Datastore) StateString() (string, error) {
	state := State(datastore.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Datastore StateString: this state value is not currently handled: %d\n", datastore.StateRaw)
	}
	return state.String(), nil
}
