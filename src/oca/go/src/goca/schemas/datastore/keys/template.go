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

// Template is a type for datastore template keys.
type Template string

const (
	Name                   Template = "NAME"
	Type                   Template = "TYPE"
	DSMAD                  Template = "DS_MAD"
	TMMAD                  Template = "TM_MAD"
	RestrictedDirs         Template = "RESTRICTED_DIRS"
	SafeDirs               Template = "SAFE_DIRS"
	NoDecompress           Template = "NO_DECOMPRESS"
	LimitTransferBW        Template = "LIMIT_TRANSFER_BW"
	DatastoreCapacityCheck Template = "DATASTORE_CAPACITY_CHECK"
	LimitMB                Template = "LIMIT_MB"
	BridgeList             Template = "BRIDGE_LIST"
	StagingDir             Template = "STAGING_DIR"
	Driver                 Template = "DRIVER"
	CompatibleSysDs        Template = "COMPATIBLE_SYS_DS"
)
