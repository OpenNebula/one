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

package acl

import (
	"encoding/xml"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

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

var resourceMap = map[string]Resources{
	"VM":             VM,
	"HOST":           Host,
	"NET":            Net,
	"IMAGE":          Image,
	"USER":           User,
	"TEMPLATE":       Template,
	"GROUP":          Group,
	"DATASTORE":      Datastore,
	"CLUSTER":        Cluster,
	"DOCUMENT":       Document,
	"ZONE":           Zone,
	"SECGROUP":       SecGroup,
	"VDC":            Vdc,
	"VROUTER":        VRouter,
	"MARKETPLACE":    MarketPlace,
	"MARKETPLACEAPP": MarketPlaceApp,
	"VMGROUP":        VMGroup,
	"VNTEMPLATE":     VNTemplate,
}

var rightMap = map[string]Rights{
	"USE":    Use,
	"MANAGE": Manage,
	"ADMIN":  Admin,
	"CREATE": Create,
}

// CalculateIDs Calculate hex from User selector (#0, @0, *, %0)
func CalculateIDs(idString string) (int64, error) {
	match, err := regexp.Match("^([\\#@\\%]\\d+|\\*)$", []byte(idString))
	if err != nil {
		return 0, err
	}
	if !match {
		return 0, fmt.Errorf("ID String %+v malformed", idString)
	}

	var value int64

	// Match by UID
	if strings.HasPrefix(idString, "#") {
		id, err := strconv.Atoi(strings.TrimLeft(idString, "#"))
		if err != nil {
			return 0, err
		}
		value = int64(UID) + int64(id)
	}

	// Match by GID
	if strings.HasPrefix(idString, "@") {
		id, err := strconv.Atoi(strings.TrimLeft(idString, "@"))
		if err != nil {
			return 0, err
		}
		value = int64(GID) + int64(id)
	}

	// Match all
	if strings.HasPrefix(idString, "*") {
		value = int64(All)
	}

	// Match by cluster
	if strings.HasPrefix(idString, "%") {
		id, err := strconv.Atoi(strings.TrimLeft(idString, "%"))
		if err != nil {
			return 0, err
		}
		value = int64(ClusterUsr) + int64(id)
	}

	return value, nil
}

// ParseUsers Converts a string in the form [#<id>, @<id>, *] to a hex. number
func ParseUsers(users string) (string, error) {
	value, err := CalculateIDs(users)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%X", value), err
}

// ParseResources Converts a resources string to a hex. number (e.g. NET+VROUTER/@190)
func ParseResources(resources string) (string, error) {
	var ret int64
	resourceParts := strings.Split(resources, "/")
	if len(resourceParts) != 2 {
		return "", fmt.Errorf("resource '%+v' malformed", resources)
	}

	res := strings.Split(resourceParts[0], "+")
	for _, resource := range res {
		val, ok := resourceMap[strings.ToUpper(resource)]
		if !ok {
			return "", fmt.Errorf("resource '%+v' does not exist", resource)
		}
		ret += int64(val)
	}
	ids, err := CalculateIDs(resourceParts[1])
	if err != nil {
		return "", err
	}
	ret += ids

	return fmt.Sprintf("%x", ret), nil
}

// ParseRights Converts a rights string to a hex. number (MANAGE+ADMIN)
func ParseRights(rights string) (string, error) {
	var ret int64

	rightsParts := strings.Split(rights, "+")
	for _, right := range rightsParts {
		val, ok := rightMap[strings.ToUpper(right)]
		if !ok {
			return "", fmt.Errorf("right '%+v' does not exist", right)
		}
		ret += int64(val)
	}

	return fmt.Sprintf("%x", ret), nil
}

// ParseZone Convert a zone part of the ACL String (#0)
func ParseZone(zone string) (string, error) {
	ids, err := CalculateIDs(zone)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", ids), nil
}
