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

// Types is a type used to enumerate image template keys
type Template string

const (
	Name           Template = "NAME"
	Persistent     Template = "PERSISTENT"
	PersistentType Template = "PERSISTENT_TYPE"
	Size           Template = "SIZE"
	DevPrefix      Template = "DEV_PREFIX"
	Cache          Template = "CACHE"
	Discard        Template = "DISCARD"
	IO             Template = "IO"
	Target         Template = "TARGET"
	Driver         Template = "DRIVER"
	Path           Template = "PATH"
	Source         Template = "SOURCE"
	DiskType       Template = "DISK_TYPE"
	ReadOnly       Template = "READONLY"
	Md5            Template = "MD5"
	Sha1           Template = "SHA1"
	Type           Template = "TYPE"
)
