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

// Lock actions on a resources
type Lock struct {
	Locked int `xml:"LOCKED"`
	Owner  int `xml:"OWNER"`
	Time   int `xml:"TIME"`
	ReqID  int `xml:"REQ_ID"`
}

// LockLevel is the level of locking of an OpenNebula entity
type LockLevel int

const (
	// LockUse locks all possible actions
	LockUse LockLevel = 1

	// LockManage locks manage and admin actions
	LockManage LockLevel = 2

	// LockAdmin locks admin actions
	LockAdmin LockLevel = 3

	// LockAll locks all actions. Deprecated use LockUse
	LockAll LockLevel = 4
)
