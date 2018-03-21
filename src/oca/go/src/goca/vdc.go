package goca

// Vdc represents an OpenNebula Vdc
type Vdc struct {
	XMLResource
	ID   uint
	Name string
}

// VdcPool represents an OpenNebula VdcPool
type VdcPool struct {
	XMLResource
}

// NewVdcPool returns a vdc pool. A connection to OpenNebula is
// performed.
func NewVdcPool() (*VdcPool, error) {
	response, err := client.Call("one.vdcpool.info")
	if err != nil {
		return nil, err
	}

	vdcpool := &VdcPool{XMLResource{body: response.Body()}}

	return vdcpool, err
}

// NewVdc finds a vdc object by ID. No connection to OpenNebula.
func NewVdc(id uint) *Vdc {
	return &Vdc{ID: id}
}

// NewVdcFromName finds a vdc object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the vdc.
func NewVdcFromName(name string) (*Vdc, error) {
	vdcPool, err := NewVdcPool()
	if err != nil {
		return nil, err
	}

	id, err := vdcPool.GetIDFromName(name, "/VDC_POOL/VDC")
	if err != nil {
		return nil, err
	}

	return NewVdc(id), nil
}

// CreateVdc allocates a new vdc. It returns the new vdc ID.
// * tpl:	A string containing the template of the VDC. Syntax can be the usual
//     attribute=value or XML.
// * clusterID: The cluster ID. If it is -1, this virtual network won’t be added
//     to any cluster
func CreateVdc(tpl string, clusterID int) (uint, error) {
	response, err := client.Call("one.vdc.allocate", tpl, clusterID)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given VDC from the pool.
func (vdc *Vdc) Delete() error {
	_, err := client.Call("one.vdc.delete", vdc.ID)
	return err
}

// Update replaces the VDC template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (vdc *Vdc) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.vdc.update", vdc.ID, tpl, appendTemplate)
	return err
}

// Rename renames a VDC.
// * newName: The new name.
func (vdc *Vdc) Rename(newName string) error {
	_, err := client.Call("one.vdc.rename", vdc.ID, newName)
	return err
}

// Info retrieves information for the VDC.
func (vdc *Vdc) Info() error {
	_, err := client.Call("one.vdc.info", vdc.ID)
	return err
}

// AddGroup adds a group to the VDC
// * groupID: The group ID.
func (vdc *Vdc) AddGroup(groupID uint) error {
	_, err := client.Call("one.vdc.addgroup", vdc.ID, int(groupID))
	return err
}

// DelGroup deletes a group from the VDC
// * groupID: The group ID.
func (vdc *Vdc) DelGroup(groupID uint) error {
	_, err := client.Call("one.vdc.delgroup", vdc.ID, int(groupID))
	return err
}

// AddCluster adds a cluster to the VDC
// * zoneID: The Zone ID.
// * clusterID: The Cluster ID.
func (vdc *Vdc) AddCluster(zoneID, clusterID uint) error {
	_, err := client.Call("one.vdc.addcluster", vdc.ID, int(zoneID), int(clusterID))
	return err
}

// DelCluster deletes a cluster from the VDC
// * zoneID: The Zone ID.
// * clusterID: The Cluster ID.
func (vdc *Vdc) DelCluster(zoneID, clusterID uint) error {
	_, err := client.Call("one.vdc.delcluster", vdc.ID, int(zoneID), int(clusterID))
	return err
}

// AddHost adds a host to the VDC
// * zoneID: The Zone ID.
// * hostID: The Host ID.
func (vdc *Vdc) AddHost(zoneID, hostID uint) error {
	_, err := client.Call("one.vdc.addhost", vdc.ID, int(zoneID), int(hostID))
	return err
}

// DelHost deletes a host from the VDC
// * zoneID: The Zone ID.
// * hostID: The Host ID.
func (vdc *Vdc) DelHost(zoneID, hostID uint) error {
	_, err := client.Call("one.vdc.delhost", vdc.ID, int(zoneID), int(hostID))
	return err
}

// AddDatastore adds a datastore to the VDC
// * zoneID: The Zone ID.
// * dsID: The Datastore ID.
func (vdc *Vdc) AddDatastore(zoneID, dsID uint) error {
	_, err := client.Call("one.vdc.adddatastore", vdc.ID, int(zoneID), int(dsID))
	return err
}

// DelDatastore deletes a datastore from the VDC
// * zoneID: The Zone ID.
// * dsID: The Datastore ID.
func (vdc *Vdc) DelDatastore(zoneID, dsID uint) error {
	_, err := client.Call("one.vdc.deldatastore", vdc.ID, int(zoneID), int(dsID))
	return err
}

// AddVnet adds a vnet to the VDC
// * zoneID: The Zone ID.
// * vnetID: The Vnet ID.
func (vdc *Vdc) AddVnet(zoneID, vnetID uint) error {
	_, err := client.Call("one.vdc.addvnet", vdc.ID, int(zoneID), int(vnetID))
	return err
}

// DelVnet deletes a vnet from the VDC
// * zoneID: The Zone ID.
// * vnetID: The Vnet ID.
func (vdc *Vdc) DelVnet(zoneID, vnetID uint) error {
	_, err := client.Call("one.vdc.delvnet", vdc.ID, int(zoneID), int(vnetID))
	return err
}
