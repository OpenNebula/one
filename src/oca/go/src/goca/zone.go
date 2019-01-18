package goca

import (
	"encoding/xml"
	"errors"
)

// ZonePool represents an OpenNebula ZonePool
type ZonePool struct {
	zoneBase
	ServerPool []zoneServer `xml:"ZONE>SERVER_POOL>SERVER"`
}

// Zone represents an OpenNebula Zone
type Zone struct {
	zoneBase
	ServerPool []zoneServer `xml:"SERVER_POOL>SERVER"`
}

type zoneBase struct {
	ID       uint   `xml:"ID","ZONE>ID"`
	Name     string `xml:"NAME","ZONE>ID"`
	Template string `xml:"TEMPLATE>ENDPOINT","ZONE>TEMPLATE>ENDPOINT"`
}

type zoneServer struct {
	ID       int    `xml:"ID"`
	Name     string `xml:"NAME"`
	Endpoint string `xml:"ENDPOINT"`
}

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
	return &Zone{zoneBase: zoneBase{ID: id}}
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
	return xml.Unmarshal([]byte(response.Body()), zone)
}
