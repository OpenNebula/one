/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/*--------------------------------------------------------------------------- */

package keys

// Template is a type for virtual network template keys.
type Template string

// Physical network template keys
const (
	Name            Template = "NAME"
	VNMad           Template = "VN_MAD"
	Bridge          Template = "BRIDGE"
	VlanID          Template = "VLAN_ID"
	AutomaticVlanID Template = "AUTOMATIC_VLAN_ID"
	PhyDev          Template = "PHYDEV"
)

// Quality of service template keys
const (
	InboundAvgBw   Template = "INBOUND_AVG_BW"
	InboundPeakBw  Template = "INBOUND_PEAK_BW"
	InboundPeakKb  Template = "INBOUND_PEAK_KB"
	OutboundAvgBw  Template = "OUTBOUND_AVG_BW"
	OutboundPeakBw Template = "OUTBOUND_PEAK_BW"
	OutboundPeakKb Template = "OUTBOUND_PEAK_KB"
)

// Contextualization template keys
const (
	NetworkMask    Template = "NETWORK_MASK"
	NetworkAddress Template = "NETWORK_ADDRESS"
	Gateway        Template = "GATEWAY"
	Gateway6       Template = "GATEWAY6"
	DNS            Template = "DNS"
	GuestMTU       Template = "GUEST_MTU"
	SearchDomain   Template = "SEARCH_DOMAIN"
	SecGroups      Template = "SECURITY_GROUPS"
	Method         Template = "METHOD"
	Metric         Template = "METRIC"
	IP6Method      Template = "IP6_METHOD"
	IP6Metric      Template = "IP6_METRIC"
)

// Interface creation options template keys
const (
	Conf          Template = "CONF"
	BridgeConf    Template = "BRIDGE"
	OvsBridgeConf Template = "OVS_BRIDGE_CONF"
	IPLinkConf    Template = "IP_LINK_CONF"
)
