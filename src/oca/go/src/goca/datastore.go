package goca

import (
	"encoding/xml"
	"errors"
	"fmt"
)

// DatastorePool represents an OpenNebula DatastorePool
type DatastorePool struct {
	Datastores []Datastore `xml:"DATASTORE"`
}

// Datastore represents an OpenNebula Datastore
type Datastore struct {
	ID          uint              `xml:"ID"`
	UID         int               `xml:"UID"`
	GID         int               `xml:"GID"`
	UName       string            `xml:"UNAME"`
	GName       string            `xml:"GNAME"`
	Name        string            `xml:"NAME"`
	Permissions *Permissions      `xml:"PERMISSIONS"`
	DSMad       string            `xml:"DS_MAD"`
	TMMad       string            `xml:"TM_MAD"`
	BasePath    string            `xml:"BASE_PATH"`
	Type        string            `xml:"TYPE"`
	DiskType    string            `xml:"DISK_TYPE"`
	StateRaw    int               `xml:"STATE"`
	ClustersID  []int             `xml:"CLUSTERS>ID"`
	TotalMB     int               `xml:"TOTAL_MB"`
	FreeMB      int               `xml:"FREE_MB"`
	UsedMB      int               `xml:"USED_MB"`
	ImagesID    []int             `xml:"IMAGES>ID"`
	Template    datastoreTemplate `xml:"TEMPLATE"`
}

type datastoreTemplate struct {
	Dynamic unmatchedTagsSlice `xml:",any"`
}

// DatastoreState is the state of an OpenNebula datastore
type DatastoreState int

const (
	// DatastoreReady datastore is ready
	DatastoreReady = iota

	// DatastoreDisable datastore is disabled
	DatastoreDisable
)

func (st DatastoreState) isValid() bool {
	if st >= DatastoreReady && st <= DatastoreDisable {
		return true
	}
	return false
}

func (st DatastoreState) String() string {
	return [...]string{
		"READY",
		"DISABLE",
	}[st]
}

// NewDatastorePool returns a datastore pool. A connection to OpenNebula is
// performed.
func NewDatastorePool() (*DatastorePool, error) {
	response, err := client.Call("one.datastorepool.info")
	if err != nil {
		return nil, err
	}

	datastorePool := &DatastorePool{}
	err = xml.Unmarshal([]byte(response.Body()), datastorePool)
	if err != nil {
		return nil, err
	}

	return datastorePool, nil
}

// NewDatastore finds a datastore object by ID. No connection to OpenNebula.
func NewDatastore(id uint) *Datastore {
	return &Datastore{ID: id}
}

// NewDatastoreFromName finds a datastore object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the datastore.
func NewDatastoreFromName(name string) (*Datastore, error) {
	var id uint

	datastorePool, err := NewDatastorePool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(datastorePool.Datastores); i++ {
		if datastorePool.Datastores[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = datastorePool.Datastores[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewDatastore(id), nil
}

// CreateDatastore allocates a new datastore. It returns the new datastore ID.
// * tpl: template of the datastore
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func CreateDatastore(tpl string, clusterID int) (uint, error) {
	response, err := client.Call("one.datastore.allocate", tpl, clusterID)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given datastore from the pool.
func (datastore *Datastore) Delete() error {
	_, err := client.Call("one.datastore.delete", datastore.ID)
	return err
}

// Update replaces the datastore template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (datastore *Datastore) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.datastore.update", datastore.ID, tpl, appendTemplate)
	return err
}

// Chmod changes the permission bits of a datastore.
// * uu: USER USE bit. If set to -1, it will not change.
// * um: USER MANAGE bit. If set to -1, it will not change.
// * ua: USER ADMIN bit. If set to -1, it will not change.
// * gu: GROUP USE bit. If set to -1, it will not change.
// * gm: GROUP MANAGE bit. If set to -1, it will not change.
// * ga: GROUP ADMIN bit. If set to -1, it will not change.
// * ou: OTHER USE bit. If set to -1, it will not change.
// * om: OTHER MANAGE bit. If set to -1, it will not change.
// * oa: OTHER ADMIN bit. If set to -1, it will not change.
func (datastore *Datastore) Chmod(uu, um, ua, gu, gm, ga, ou, om, oa int) error {
	_, err := client.Call("one.datastore.chmod", datastore.ID, uu, um, ua, gu, gm, ga, ou, om, oa)
	return err
}

// Chown changes the ownership of a datastore.
// * userID: The User ID of the new owner. If set to -1, it will not change.
// * groupID: The Group ID of the new group. If set to -1, it will not change.
func (datastore *Datastore) Chown(userID, groupID int) error {
	_, err := client.Call("one.datastore.chown", datastore.ID, userID, groupID)
	return err
}

// Rename renames a datastore.
// * newName: The new name.
func (datastore *Datastore) Rename(newName string) error {
	_, err := client.Call("one.datastore.rename", datastore.ID, newName)
	return err
}

// Enable enables or disables a datastore.
// * enable: True for enabling
func (datastore *Datastore) Enable(enable bool) error {
	_, err := client.Call("one.datastore.enable", datastore.ID, enable)
	return err
}

// Info retrieves information for the datastore.
func (datastore *Datastore) Info() error {
	response, err := client.Call("one.datastore.info", datastore.ID)
	if err != nil {
		return err
	}
	*datastore = Datastore{}
	return xml.Unmarshal([]byte(response.Body()), datastore)
}

// State looks up the state of the image and returns the DatastoreState
func (datastore *Datastore) State() (DatastoreState, error) {
	state := DatastoreState(datastore.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Datastore State: this state value is not currently handled: %d\n", datastore.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (datastore *Datastore) StateString() (string, error) {
	state := DatastoreState(datastore.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Datastore StateString: this state value is not currently handled: %d\n", datastore.StateRaw)
	}
	return state.String(), nil
}
