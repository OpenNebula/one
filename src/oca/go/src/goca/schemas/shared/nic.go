package shared

import (
	"encoding/xml"

	dyn "github.com/OpenNebula/one/src/oca/go/src/goca/dynamic"
)

// NIC is a structure allowing to parse NIC templates. Common to VM and VRouter.
type NIC struct {
	dyn.Vector
}

// NICKeys is here to help the user to keep track of XML tags defined in NIC
type NICKeys string

// Some keys are specific to VM some others to VRouter
// For VM values: https://docs.opennebula.io/5.8/operation/references/template.html#network-section
const (
	NICVec            string  = "NIC"
	NICID             NICKeys = "NIC_ID"
	Bridge            NICKeys = "BRIDGE"
	Filter            NICKeys = "FILTER"
	IP                NICKeys = "IP"
	MAC               NICKeys = "MAC"
	Network           NICKeys = "NETWORK"
	NetworkMask       NICKeys = "NETWORK_MASK"
	NetworkID         NICKeys = "NETWORK_ID"
	NetworkUID        NICKeys = "NETWORK_UID"
	NetworkUName      NICKeys = "NETWORK_UNAME"
	NetworkAddress    NICKeys = "NETWORK_ADDRESS"
	SecurityGroups    NICKeys = "SECURITY_GROUPS"
	Target            NICKeys = "TARGET"
	VlanID            NICKeys = "VLAN_ID"
	Script            NICKeys = "SCRIPT"
	Model             NICKeys = "MODEL"
	InboundAvgBw      NICKeys = "INBOUND_AVG_BW"
	InboundPeakBw     NICKeys = "INBOUND_PEAK_BW"
	InboundPeakK      NICKeys = "INBOUND_PEAK_KB"
	OutboundAvgBw     NICKeys = "OUTBOUND_AVG_BW"
	OutboundPeakBw    NICKeys = "OUTBOUND_PEAK_BW"
	OutboundPeakKb    NICKeys = "OUTBOUND_PEAK_KB"
	NetworkMode       NICKeys = "NETWORK_MODE"
	SchedRequirements NICKeys = "SCHED_REQUIREMENTS"
	SchedRank         NICKeys = "SCHED_RANK"
	Name              NICKeys = "NAME"
	Parent            NICKeys = "PARENT"
	External          NICKeys = "EXTERNAL"
)

// NewNIC returns a structure disk entity to build
func NewNIC() *NIC {
	return &NIC{
		dyn.Vector{XMLName: xml.Name{Local: NICVec}},
	}
}

// ID returns the NIC ID as an integer
func (n *NIC) ID() (int, error) {
	return n.GetInt(string(NICID))
}

// Get returns the string value for a NIC key
func (n *NIC) Get(key NICKeys) (string, error) {
	return n.GetStr(string(key))
}

// GetI returns the integer value for a NIC key
func (n *NIC) GetI(key NICKeys) (int, error) {
	return n.GetInt(string(key))
}

// Add adds a NIC key, value pair
func (n *NIC) Add(key NICKeys, value interface{}) {
	n.AddPair(string(key), value)
}
