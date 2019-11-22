/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

package acl

import "encoding/xml"

// Pool represents an OpenNebula ACL pool
type Pool struct {
	XMLName xml.Name `xml:"ACL_POOL"`
	ACLs    []ACL    `xml:"ACL"`
}

// ACL represents an OpenNebula ACL
type ACL struct {
	XMLName  xml.Name `xml:"ACL"`
	ID       int      `xml:"ID,omitempty"`
	User     string   `xml:"USER,omitempty"`
	Resource string   `xml:"RESOURCE,omitempty"`
	Rights   string   `xml:"RIGHTS,omitempty"`
	Zone     string   `xml:"ZONE,omitempty"`
	String   string   `xml:"STRING,omitempty"`
}

type Users uint64

const (
	UID        Users = 0x100000000
	GID        Users = 0x200000000
	All        Users = 0x400000000
	ClusterUsr Users = 0x800000000
)

type Resources uint64

const (
	VM             Resources = 0x1000000000
	Host           Resources = 0x2000000000
	Net            Resources = 0x4000000000
	Image          Resources = 0x8000000000
	User           Resources = 0x10000000000
	Template       Resources = 0x20000000000
	Group          Resources = 0x40000000000
	Datastore      Resources = 0x100000000000
	Cluster        Resources = 0x200000000000
	Document       Resources = 0x400000000000
	Zone           Resources = 0x800000000000
	SecGroup       Resources = 0x1000000000000
	Vdc            Resources = 0x2000000000000
	VRouter        Resources = 0x4000000000000
	MarketPlace    Resources = 0x8000000000000
	MarketPlaceApp Resources = 0x10000000000000
	VMGroup        Resources = 0x20000000000000
	VNTemplate     Resources = 0x40000000000000
)

type Rights uint64

const (
	Use    Rights = 0x1 // Auth. to use an object
	Manage Rights = 0x2 // Auth. to perform management actions
	Admin  Rights = 0x4 // Auth. to perform administrative actions
	Create Rights = 0x8 // Auth. to create an object
)
