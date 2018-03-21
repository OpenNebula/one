package goca

// Host represents an OpenNebula Host
type Host struct {
	XMLResource
	ID   uint
	Name string
}

// HostPool represents an OpenNebula HostPool
type HostPool struct {
	XMLResource
}

// NewHostPool returns a host pool. A connection to OpenNebula is
// performed.
func NewHostPool() (*HostPool, error) {
	response, err := client.Call("one.hostpool.info")
	if err != nil {
		return nil, err
	}

	hostpool := &HostPool{XMLResource{body: response.Body()}}

	return hostpool, err
}

// NewHost finds a host object by ID. No connection to OpenNebula.
func NewHost(id uint) *Host {
	return &Host{ID: id}
}

// NewHostFromName finds a host object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the host.
func NewHostFromName(name string) (*Host, error) {
	hostPool, err := NewHostPool()
	if err != nil {
		return nil, err
	}

	id, err := hostPool.GetIDFromName(name, "/HOST_POOL/HOST")
	if err != nil {
		return nil, err
	}

	return NewHost(id), nil
}

// CreateHost allocates a new host. It returns the new host ID.
// * name: name of the host
// * im: information driver for the host
// * vm: virtualization driver for the host
// * clusterID: The cluster ID. If it is -1, the default one will be used.
func CreateHost(name, im, vm string, clusterID int) (uint, error) {
	response, err := client.Call("one.host.allocate", name, im, vm, clusterID)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given host from the pool
func (host *Host) Delete() error {
	_, err := client.Call("one.host.delete", host.ID)
	return err
}

// Status sets the status of the host
// * status: 0: ENABLED, 1: DISABLED, 2: OFFLINE
func (host *Host) Status(status int) error {
	_, err := client.Call("one.host.status", host.ID, status)
	return err
}

// Update replaces the host’s template contents.
// * tpl: The new template contents. Syntax can be the usual attribute=value or XML.
// * appendTemplate: Update type: 0: Replace the whole template. 1: Merge new template with the existing one.
func (host *Host) Update(tpl string, appendTemplate int) error {
	_, err := client.Call("one.host.update", host.ID, tpl, appendTemplate)
	return err
}

// Rename renames a host.
// * newName: The new name.
func (host *Host) Rename(newName string) error {
	_, err := client.Call("one.host.rename", host.ID, newName)
	return err
}

// Info retrieves information for the host.
func (host *Host) Info() error {
	_, err := client.Call("one.host.info", host.ID)
	return err
}

// Monitoring returns the host monitoring records.
func (host *Host) Monitoring() error {
	_, err := client.Call("one.host.monitoring", host.ID)
	return err
}
