package goca

import (
	"encoding/xml"
	"errors"
	"fmt"
)

// HostPool represents an OpenNebula HostPool
type HostPool struct {
	Hosts []Host `xml:"HOST"`
}

// Host represents an OpenNebula Host
type Host struct {
	ID          uint         `xml:"ID"`
	Name        string       `xml:"NAME"`
	StateRaw    int          `xml:"STATE"`
	IMMAD       string       `xml:"IM_MAD"`
	VMMAD       string       `xml:"VM_MAD"`
	LastMonTime int          `xml:"LAST_MON_TIME"`
	ClusterID   int          `xml:"CLUSTER_ID"`
	Cluster     string       `xml:"CLUSTER"`
	Share       hostShare    `xml:"HOST_SHARE"`
	VMsID       []int        `xml:"VMS>ID"`
	Template    hostTemplate `xml:"TEMPLATE"`
}

type hostShare struct {
	DiskUsage int `xml:"DISK_USAGE"`
	MemUsage  int `xml:"MEM_USAGE"`
	CPUUsage  int `xml:"CPU_USAGE"`
	TotalMem  int `xml:"TOTAL_MEM"`
	TotalCPU  int `xml:"TOTAL_CPU"`

	MaxDisk int `xml:"MAX_DISK"`
	MaxMem  int `xml:"MAX_MEM"`
	MaxCPU  int `xml:"MAX_CPU"`

	FreeDisk int `xml:"FREE_DISK"`
	FreeMem  int `xml:"FREE_MEM"`
	FreeCPU  int `xml:"FREE_CPU"`

	UsedDisk int `xml:"USED_DISK"`
	UsedMem  int `xml:"USED_MEM"`
	UsedCPU  int `xml:"USED_CPU"`

	RunningVMs int            `xml:"RUNNING_VMS"`
	Stores     hostDataStores `xml:"DATASTORES"`
	PCIDevices interface{}    `xml:"PCI_DEVICES>PCI"`
}

type hostDataStores struct {
	DSs []hostDS `xml:"DS"`
}

type hostDS struct {
	ID      int `xml:"ID"`
	UsedMB  int `xml:"USED_MB"`
	FreeMB  int `xml:"FREE_MB"`
	TotalMB int `xml:"TOTAL_MB"`
}

type hostTemplate struct {
	// Example of reservation: https://github.com/OpenNebula/addon-storpool/blob/ba9dd3462b369440cf618c4396c266f02e50f36f/misc/reserved.sh
	ReservedMem int                `xml:"RESERVED_MEM"`
	ReservedCpu int                `xml:"RESERVED_CPU"`
	Dynamic     unmatchedTagsSlice `xml:",any"`
}

// HostState is the state of an OpenNebula Host
type HostState int

const (
	// HostInit host is in the initial state when enabled
	HostInit = iota

	// HostMonitoringMonitored host is being monitored (from monitored state)
	HostMonitoringMonitored

	// HostMonitored host has been successfully monitored
	HostMonitored

	// HostError host has encountered an error ocurred while monitoring
	HostError

	// HostDisabled host is disabled
	HostDisabled

	// HostMonitoringError host is being monitored (from error state)
	HostMonitoringError

	// HostMonitoringInit host is being monitored (from init state)
	HostMonitoringInit

	// HostMonitoringDisabled host is being monitored (from disabled state)
	HostMonitoringDisabled

	// HostOffline host is totally offline
	HostOffline
)

func (st HostState) isValid() bool {
	if st >= HostInit && st <= HostOffline {
		return true
	}
	return false
}

func (st HostState) String() string {
	return [...]string{
		"INIT",
		"MONITORING_MONITORED",
		"MONITORED",
		"ERROR",
		"DISABLED",
		"MONITORING_ERROR",
		"MONITORING_INIT",
		"MONITORING_DISABLED",
		"OFFLINE",
	}[st]
}

// NewHostPool returns a host pool. A connection to OpenNebula is
// performed.
func NewHostPool() (*HostPool, error) {
	response, err := client.Call("one.hostpool.info")
	if err != nil {
		return nil, err
	}

	hostPool := &HostPool{}
	err = xml.Unmarshal([]byte(response.Body()), &hostPool)
	if err != nil {
		return nil, err
	}
	return hostPool, nil
}

// NewHost finds a host object by ID. No connection to OpenNebula.
func NewHost(id uint) *Host {
	return &Host{ID: id}
}

// NewHostFromName finds a host object by name. It connects to
// OpenNebula to retrieve the pool, but doesn't perform the Info() call to
// retrieve the attributes of the host.
func NewHostFromName(name string) (*Host, error) {
	var id uint

	hostPool, err := NewHostPool()
	if err != nil {
		return nil, err
	}

	match := false
	for i := 0; i < len(hostPool.Hosts); i++ {
		if hostPool.Hosts[i].Name != name {
			continue
		}
		if match {
			return nil, errors.New("multiple resources with that name")
		}
		id = hostPool.Hosts[i].ID
		match = true
	}
	if !match {
		return nil, errors.New("resource not found")
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
	response, err := client.Call("one.host.info", host.ID)
	if err != nil {
		return err
	}
	*host = Host{}
	return xml.Unmarshal([]byte(response.Body()), host)
}

// Monitoring returns the host monitoring records.
func (host *Host) Monitoring() error {
	_, err := client.Call("one.host.monitoring", host.ID)
	return err
}

// State looks up the state of the image and returns the ImageState
func (host *Host) State() (HostState, error) {
	state := HostState(host.StateRaw)
	if !state.isValid() {
		return -1, fmt.Errorf("Host State: this state value is not currently handled: %d\n", host.StateRaw)
	}
	return state, nil
}

// StateString returns the state in string format
func (host *Host) StateString() (string, error) {
	state := HostState(host.StateRaw)
	if !state.isValid() {
		return "", fmt.Errorf("Host StateString: this state value is not currently handled: %d\n", host.StateRaw)
	}
	return state.String(), nil
}
