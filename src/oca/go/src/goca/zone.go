package goca

import (
	"encoding/xml"
	"errors"
	"fmt"
)

// ZonePool represents an OpenNebula ZonePool
type ZonePool struct {
	ID         uint         `xml:"ZONE>ID"`
	Name       string       `xml:"ZONE>NAME"`
	Template   zoneTemplate `xml:"ZONE>TEMPLATE"`
	ServerPool []zoneServer `xml:"ZONE>SERVER_POOL>SERVER"`
}

// Zone represents an OpenNebula Zone
type Zone struct {
	ID         uint         `xml:"ID"`
	Name       string       `xml:"NAME"`
	Template   zoneTemplate `xml:"TEMPLATE"`
	ServerPool []zoneServer `xml:"SERVER_POOL>SERVER"`
}

type zoneServer struct {
	ID       int    `xml:"ID"`
	Name     string `xml:"NAME"`
	Endpoint string `xml:"ENDPOINT"`
}

type zoneTemplate struct {
	Endpoint string `xml:"ENDPOINT"`
}

// ZoneServerRaftStatus contains the raft status datas of a server
type ZoneServerRaftStatus struct {
	ID          int `xml:"SERVER_ID"`
	StateRaw    int `xml:"STATE"`
	Term        int `xml:"TERM"`
	Votedfor    int `xml:"VOTEDFOR"`
	Commit      int `xml:"COMMIT"`
	LogIndex    int `xml:"LOG_INDEX"`
	FedlogIndex int `xml:"FEDLOG_INDEX"`
}

// ZoneServerRaftState is the state of an OpenNebula server from a zone (See HA and Raft)
type ZoneServerRaftState int

const (
	// ZoneServerRaftSolo is the initial leader
	ZoneServerRaftSolo ZoneServerRaftState = 0

	// ZoneServerRaftCandidate when the server is candidate to election
	ZoneServerRaftCandidate = 1

	// ZoneServerRaftFollower when the server is a follower
	ZoneServerRaftFollower = 2

	// ZoneServerRaftLeader when the server is the leader
	ZoneServerRaftLeader = 3
)

func (st ZoneServerRaftState) isValid() bool {
	if st >= ZoneServerRaftSolo && st <= ZoneServerRaftLeader {
		return true
	}
	return false
}

func (st ZoneServerRaftState) String() string {
	return [...]string{
		"SOLO",
		"CANDIDATE",
		"FOLLOWER",
		"LEADER",
	}[st]
}

// NewZonePool returns a zone pool. A connection to OpenNebula is

// NewZonePool returns a zone pool. A connection to OpenNebula is
// performed.
func NewZonePool() (*ZonePool, error) {
	response, err := client.Call("one.zonepool.info")
	if err != nil {
		return nil, err
	}

	zonePool := &ZonePool{}
	err = xml.Unmarshal([]byte(response.Body()), zonePool)
	if err != nil {
		return nil, err
	}

	return zonePool, err
}

// NewZone finds a zone object by ID. No connection to OpenNebula.
func NewZone(id uint) *Zone {
	return &Zone{ID: id}
}

// NewZoneFromName finds a zone object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the zone.
func NewZoneFromName(name string) (*Zone, error) {
	zonePool, err := NewZonePool()
	if err != nil {
		return nil, err
	}

	if zonePool.Name != name {
		return nil, errors.New("resource not found")
	}

	return NewZone(zonePool.ID), nil
}

// CreateZone allocates a new zone. It returns the new zone ID.
// * tpl:	A string containing the template of the ZONE. Syntax can be the usual
//     attribute=value or XML.
// * clusterID: The id of the cluster. If -1, the default one will be used
func CreateZone(tpl string, clusterID int) (uint, error) {
	response, err := client.Call("one.zone.allocate", tpl, clusterID)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given zone from the pool.
func (zone *Zone) Delete() error {
	_, err := client.Call("one.zone.delete", zone.ID)
	return err
}

// Update replaces the zone template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (zone *Zone) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.zone.update", zone.ID, tpl, appendTemplate)
	return err
}

// Rename renames a zone.
// * newName: The new name.
func (zone *Zone) Rename(newName string) error {
	_, err := client.Call("one.zone.rename", zone.ID, newName)
	return err
}

// Info retrieves information for the zone.
func (zone *Zone) Info() error {
	response, err := client.Call("one.zone.info", zone.ID)
	if err != nil {
		return err
	}
	*zone = Zone{}
	return xml.Unmarshal([]byte(response.Body()), zone)
}

//GetRaftStatus give the raft status of the server behind the current RPC endpoint. To get endpoints make an info call.
func GetRaftStatus(serverUrl string) (*ZoneServerRaftStatus, error) {
	response, err := client.endpointCall(serverUrl, "one.zone.raftstatus")
	if err != nil {
		return nil, err
	}
	s := &ZoneServerRaftStatus{}
	err = xml.Unmarshal([]byte(response.Body()), s)
	if err != nil {
		return nil, err
	}
	return s, nil
}

// State looks up the state of the zone server and returns the ZoneServerRaftState
func (server *ZoneServerRaftStatus) State() (ZoneServerRaftState, error) {
	state := ZoneServerRaftState(server.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Zone server State: this state value is not currently handled: %d\n", server.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (server *ZoneServerRaftStatus) StateString() (string, error) {
	state := ZoneServerRaftState(server.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Zone server StateString: this state value is not currently handled: %d\n", server.StateRaw)
	}
	return state.String(), nil
}
