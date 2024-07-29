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

package datastore

import (
	"encoding/xml"
	"fmt"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Datastore pool
type Pool struct {
	XMLName    xml.Name    `xml:"DATASTORE_POOL"`
	Datastores []Datastore `xml:"DATASTORE"`
}

// Datastore represents an OpenNebula Datastore
type Datastore struct {
	XMLName     xml.Name            `xml:"DATASTORE"`
	ID          int                 `xml:"ID,omitempty"`
	UID         int                 `xml:"UID,omitempty"`
	GID         int                 `xml:"GID,omitempty"`
	UName       string              `xml:"UNAME,omitempty"`
	GName       string              `xml:"GNAME,omitempty"`
	Name        string              `xml:"NAME"`
	Permissions *shared.Permissions `xml:"PERMISSIONS,omitempty"`
	DSMad       string              `xml:"DS_MAD,omitempty"`
	TMMad       string              `xml:"TM_MAD,omitempty"`
	BasePath    string              `xml:"BASE_PATH,omitempty"`
	Type        string              `xml:"TYPE,omitempty"`
	DiskType    string              `xml:"DISK_TYPE,omitempty"`
	StateRaw    int                 `xml:"STATE,omitempty"`
	Clusters    shared.EntitiesID   `xml:"CLUSTERS,omitempty"`
	TotalMB     int                 `xml:"TOTAL_MB,omitempty"`
	FreeMB      int                 `xml:"FREE_MB,omitempty"`
	UsedMB      int                 `xml:"USED_MB,omitempty"`
	Images      shared.EntitiesID   `xml:"IMAGES,omitempty"`
	Template    Template            `xml:"TEMPLATE,omitempty"`
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
