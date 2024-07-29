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

package shared

// Permissions is associated to OpenNebula resources
// * uu: USER USE bit.
// * um: USER MANAGE bit.
// * ua: USER ADMIN bit.
// * gu: GROUP USE bit.
// * gm: GROUP MANAGE bit.
// * ga: GROUP ADMIN bit.
// * ou: OTHER USE bit.
// * om: OTHER MANAGE bit.
// * oa: OTHER ADMIN bit.
type Permissions struct {
	OwnerU int8 `xml:"OWNER_U" json:"OWNER_U,string"`
	OwnerM int8 `xml:"OWNER_M" json:"OWNER_M,string"`
	OwnerA int8 `xml:"OWNER_A" json:"OWNER_A,string"`
	GroupU int8 `xml:"GROUP_U" json:"GROUP_U,string"`
	GroupM int8 `xml:"GROUP_M" json:"GROUP_M,string"`
	GroupA int8 `xml:"GROUP_A" json:"GROUP_A,string"`
	OtherU int8 `xml:"OTHER_U" json:"OTHER_U,string"`
	OtherM int8 `xml:"OTHER_M" json:"OTHER_M,string"`
	OtherA int8 `xml:"OTHER_A" json:"OTHER_A,string"`
}

var permStr = [8]string{"---", "--a", "-m-", "-ma", "u--", "u-a", "um-", "uma"}

func NewDefaultPermission() Permissions {
	return Permissions{-1, -1, -1, -1, -1, -1, -1, -1, -1}
}

// If a bit is set to -1, it will not change when calling Chmod
func (p Permissions) ToArgs() []interface{} {
	return []interface{}{
		p.OwnerU, p.OwnerM, p.OwnerA,
		p.GroupU, p.GroupM, p.GroupA,
		p.OtherU, p.OtherM, p.OtherA,
	}
}

func (p Permissions) String() string {
	owner := permStr[p.OwnerU<<2|p.OwnerM<<1|p.OwnerA]
	group := permStr[p.GroupU<<2|p.GroupM<<1|p.GroupA]
	other := permStr[p.OtherU<<2|p.OtherM<<1|p.OtherA]
	return owner + group + other
}

func (p Permissions) Octet() int {
	owner := int(p.OwnerU<<2|p.OwnerM<<1|p.OwnerA)
	group := int(p.GroupU<<2|p.GroupM<<1|p.GroupA)
	other := int(p.OtherU<<2|p.OtherM<<1|p.OtherA)

	return owner * 100 + group * 10 + other
}
