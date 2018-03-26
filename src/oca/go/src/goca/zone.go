package goca

// Zone represents an OpenNebula Zone
type Zone struct {
	XMLResource
	ID   uint
	Name string
}

// ZonePool represents an OpenNebula ZonePool
type ZonePool struct {
	XMLResource
}

// NewZonePool returns a zone pool. A connection to OpenNebula is
// performed.
func NewZonePool() (*ZonePool, error) {
	response, err := client.Call("one.zonepool.info")
	if err != nil {
		return nil, err
	}

	zonepool := &ZonePool{XMLResource{body: response.Body()}}

	return zonepool, err
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

	id, err := zonePool.GetIDFromName(name, "/ZONE_POOL/ZONE")
	if err != nil {
		return nil, err
	}

	return NewZone(id), nil
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
	_, err := client.Call("one.zone.info", zone.ID)
	return err
}
