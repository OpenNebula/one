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

package goca

//import "fmt"

type Permissions struct {
	OwnerU int `xml:"OWNER_U"`
	OwnerM int `xml:"OWNER_M"`
	OwnerA int `xml:"OWNER_A"`
	GroupU int `xml:"GROUP_U"`
	GroupM int `xml:"GROUP_M"`
	GroupA int `xml:"GROUP_A"`
	OtherU int `xml:"OTHER_U"`
	OtherM int `xml:"OTHER_M"`
	OtherA int `xml:"OTHER_A"`
}

func (p *Permissions) String() string {
	permStr := [8]string{"---", "--a", "-m-", "-ma", "u--", "u-a", "um-", "uma"}
	owner := permStr[p.OwnerU<<2|p.OwnerM<<1|p.OwnerA]
	group := permStr[p.GroupU<<2|p.GroupM<<1|p.GroupA]
	other := permStr[p.OtherU<<2|p.OtherM<<1|p.OtherA]
	return owner + group + other
}
