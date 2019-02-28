package goca

import (
	"encoding/xml"
	"errors"
	"fmt"
)

// ZonesController is a controller for a pool of Zones
type ZonesController entitiesController

// ZoneController is a controller for Zone entities
type ZoneController entityController

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

// Zones returns a Zones controller.
func (c *Controller) Zones() *ZonesController {
	return &ZonesController{c}
}

// Zone returns a Zone controller
func (c *Controller) Zone(id uint) *ZoneController {
	return &ZoneController{c, id}
}

// ZoneByName returns a zone id from name
func (c *Controller) ZoneByName(name string) (uint, error) {
	zonePool, err := (&ZonesController{c}).Info()
	if err != nil {
		return 0, err
	}

	if zonePool.Name != name {
		return 0, errors.New("resource not found")
	}

	return zonePool.ID, nil
}

// ZonePool returns a zone pool. A connection to OpenNebula is
// performed.
func (zc *ZonesController) Info() (*ZonePool, error) {
	response, err := zc.c.Client.Call("one.zonepool.info")
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

// Info retrieves information for the zone.
func (zc *ZoneController) Info() (*Zone, error) {
	response, err := zc.c.Client.Call("one.zone.info", zc.ID)
	if err != nil {
		return nil, err
	}
	zone := &Zone{}
	err = xml.Unmarshal([]byte(response.Body()), zone)
	if err != nil {
		return nil, err
	}
	return zone, nil
}

// Create allocates a new zone. It returns the new zc.ID.
// * tpl:	A string containing the template of the ZONE. Syntax can be the usual
//     attribute=value or XML.
// * clusterID: The id of the cluster. If -1, the default one will be used
func (zc *ZoneController) Create(tpl string, clusterID int) (uint, error) {
	response, err := zc.c.Client.Call("one.zone.allocate", tpl, clusterID)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given zone from the pool.
func (zc *ZoneController) Delete() error {
	_, err := zc.c.Client.Call("one.zone.delete", zc.ID)
	return err
}

// Update replaces the zone template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (zc *ZoneController) Update(tpl string, appendTemplate int) error {
	_, err := zc.c.Client.Call("one.zone.update", zc.ID, tpl, appendTemplate)
	return err
}

// Rename renames a zone.
// * newName: The new name.
func (zc *ZoneController) Rename(newName string) error {
	_, err := zc.c.Client.Call("one.zone.rename", zc.ID, newName)
	return err
}

//GetRaftStatus give the raft status of the server behind the current RPC endpoint. To get endpoints make an info call.
func (zc *ZonesController) ServerRaftStatus() (*ZoneServerRaftStatus, error) {
	response, err := zc.c.Client.Call("one.zone.raftstatus")
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
