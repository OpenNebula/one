package goca

// Datastore represents an OpenNebula Datastore
type Datastore struct {
	XMLResource
	ID   uint
	Name string
}

// DatastorePool represents an OpenNebula DatastorePool
type DatastorePool struct {
	XMLResource
}

// NewDatastorePool returns a datastore pool. A connection to OpenNebula is
// performed.
func NewDatastorePool() (*DatastorePool, error) {
	response, err := client.Call("one.datastorepool.info")
	if err != nil {
		return nil, err
	}

	datastorepool := &DatastorePool{XMLResource{body: response.Body()}}

	return datastorepool, err
}

// NewDatastore finds a datastore object by ID. No connection to OpenNebula.
func NewDatastore(id uint) *Datastore {
	return &Datastore{ID: id}
}

// NewDatastoreFromName finds a datastore object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the datastore.
func NewDatastoreFromName(name string) (*Datastore, error) {
	datastorePool, err := NewDatastorePool()
	if err != nil {
		return nil, err
	}

	id, err := datastorePool.GetIDFromName(name, "/DATASTORE_POOL/DATASTORE")
	if err != nil {
		return nil, err
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
func (datastore *Datastore) Chown(userID, groupID uint) error {
	_, err := client.Call("one.datastore.chown", datastore.ID, int(userID), int(groupID))
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
	_, err := client.Call("one.datastore.info", datastore.ID)
	return err
}
