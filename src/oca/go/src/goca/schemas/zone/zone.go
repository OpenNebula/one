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

package zone

import (
	"encoding/xml"
	"fmt"
)

// Pool represents an OpenNebula Zone pool
type Pool struct {
	XMLName xml.Name `xml:"ZONE_POOL"`
	Zones   []Zone   `xml:"ZONE"`
}

// Zone represents an OpenNebula Zone
type Zone struct {
	XMLName    xml.Name `xml:"ZONE"`
	ID         int      `xml:"ID,omitempty"`
	Name       string   `xml:"NAME"`
	Template   Template `xml:"TEMPLATE"`
	ServerPool []Server `xml:"SERVER_POOL>SERVER,omitempty"`
}

type Server struct {
	ID       int    `xml:"ID"`
	Name     string `xml:"NAME"`
	Endpoint string `xml:"ENDPOINT"`
}

type Template struct {
	Endpoint string `xml:"ENDPOINT"`
}

// ServerRaftStatus contains the raft status datas of a server
type ServerRaftStatus struct {
	ID          int `xml:"SERVER_ID"`
	StateRaw    int `xml:"STATE"`
	Term        int `xml:"TERM"`
	Votedfor    int `xml:"VOTEDFOR"`
	Commit      int `xml:"COMMIT"`
	LogIndex    int `xml:"LOG_INDEX"`
	FedlogIndex int `xml:"FEDLOG_INDEX"`
}

// ServerRaftState is the state of an OpenNebula server from a zone (See HA and Raft)
type ServerRaftState int

const (
	// ServerRaftSolo is the initial leader
	ServerRaftSolo ServerRaftState = 0

	// ServerRaftCandidate when the server is candidate to election
	ServerRaftCandidate = 1

	// ServerRaftFollower when the server is a follower
	ServerRaftFollower = 2

	// ServerRaftLeader when the server is the leader
	ServerRaftLeader = 3
)

func (s ServerRaftState) isValid() bool {
	if s >= ServerRaftSolo && s <= ServerRaftLeader {
		return true
	}
	return false
}

func (s ServerRaftState) String() string {
	return [...]string{
		"SOLO",
		"CANDIDATE",
		"FOLLOWER",
		"LEADER",
	}[s]
}

// State looks up the state of the zone server and returns the ZoneServerRaftState
func (server *ServerRaftStatus) State() (ServerRaftState, error) {
	state := ServerRaftState(server.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Zone server State: this state value is not currently handled: %d\n", server.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (server *ServerRaftStatus) StateString() (string, error) {
	state := ServerRaftState(server.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Zone server StateString: this state value is not currently handled: %d\n", server.StateRaw)
	}
	return state.String(), nil
}
