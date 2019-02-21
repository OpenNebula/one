package goca

import (
	"encoding/xml"
	"errors"
)

// ClusterPool represents an OpenNebula ClusterPool
type ClusterPool struct {
	Clusters []Cluster `xml:"CLUSTER"`
}

// Cluster represents an OpenNebula Cluster
type Cluster struct {
	ID           uint            `xml:"ID"`
	Name         string          `xml:"NAME"`
	HostsID      []int           `xml:"HOSTS>ID"`
	DatastoresID []int           `xml:"DATASTORES>ID"`
	VnetsID      []int           `xml:"VNETS>ID"`
	Template     clusterTemplate `xml:"TEMPLATE"`
}

type clusterTemplate struct {
	// Example of reservation: https://github.com/OpenNebula/addon-storpool/blob/ba9dd3462b369440cf618c4396c266f02e50f36f/misc/reserved.sh
	ReservedMem string             `xml:"RESERVED_MEM"`
	ReservedCpu string             `xml:"RESERVED_CPU"`
	Dynamic     unmatchedTagsSlice `xml:",any"`
}

// NewClusterPool returns a cluster pool. A connection to OpenNebula is
// performed.
func NewClusterPool() (*ClusterPool, error) {
	response, err := client.Call("one.clusterpool.info")
	if err != nil {
		return nil, err
	}

	clusterPool := &ClusterPool{}
	err = xml.Unmarshal([]byte(response.Body()), clusterPool)
	if err != nil {
		return nil, err
	}

	return clusterPool, nil

}

// NewCluster finds a cluster object by ID. No connection to OpenNebula.
func NewCluster(id uint) *Cluster {
	return &Cluster{ID: id}
}

// NewClusterFromName finds a cluster object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the cluster.
func NewClusterFromName(name string) (*Cluster, error) {
	var id uint

	clusterPool, err := NewClusterPool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(clusterPool.Clusters); i++ {
		if clusterPool.Clusters[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = clusterPool.Clusters[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
	}

	return NewCluster(id), nil
}

// CreateCluster allocates a new cluster. It returns the new cluster ID.
func CreateCluster(name string) (uint, error) {
	response, err := client.Call("one.cluster.allocate", name)
	if err != nil {
		return 0, err
	}

	return uint(response.BodyInt()), nil
}

// Delete deletes the given cluster from the pool.
func (cluster *Cluster) Delete() error {
	_, err := client.Call("one.cluster.delete", cluster.ID)
	return err
}

// Update replaces the cluster cluster contents.
// * tpl: The new cluster contents. Syntax can be the usual attribute=value or
//   	XML.
// * appendCluster: Update type: 0: Replace the whole cluster. 1: Merge new
//   	cluster with the existing one.
func (cluster *Cluster) Update(tpl string, appendCluster int) error {
	_, err := client.Call("one.cluster.update", cluster.ID, tpl, appendCluster)
	return err
}

// AddHost adds a host to the given cluster.
// * hostID: The host ID.
func (cluster *Cluster) AddHost(hostID uint) error {
	_, err := client.Call("one.cluster.addhost", cluster.ID, int(hostID))
	return err
}

// DelHost removes a host from the given cluster.
// * hostID: The host ID.
func (cluster *Cluster) DelHost(hostID uint) error {
	_, err := client.Call("one.cluster.delhost", cluster.ID, int(hostID))
	return err
}

// AddDatastore adds a datastore to the given cluster.
// * dsID: The datastore ID.
func (cluster *Cluster) AddDatastore(dsID uint) error {
	_, err := client.Call("one.cluster.adddatastore", cluster.ID, int(dsID))
	return err
}

// DelDatastore removes a datastore from the given cluster.
// * dsID: The datastore ID.
func (cluster *Cluster) DelDatastore(dsID uint) error {
	_, err := client.Call("one.cluster.deldatastore", cluster.ID, int(dsID))
	return err
}

// AddVnet adds a vnet to the given cluster.
// * vnetID: The vnet ID.
func (cluster *Cluster) AddVnet(vnetID uint) error {
	_, err := client.Call("one.cluster.addvnet", cluster.ID, int(vnetID))
	return err
}

// DelVnet removes a vnet from the given cluster.
// * vnetID: The vnet ID.
func (cluster *Cluster) DelVnet(vnetID uint) error {
	_, err := client.Call("one.cluster.delvnet", cluster.ID, int(vnetID))
	return err
}

// Rename renames a cluster.
// * newName: The new name.
func (cluster *Cluster) Rename(newName string) error {
	_, err := client.Call("one.cluster.rename", cluster.ID, newName)
	return err
}

// Info retrieves information for the cluster.
func (cluster *Cluster) Info() error {
	response, err := client.Call("one.cluster.info", cluster.ID)
	if err != nil {
		return err
	}
	*cluster = Cluster{}
	return xml.Unmarshal([]byte(response.Body()), cluster)
}
