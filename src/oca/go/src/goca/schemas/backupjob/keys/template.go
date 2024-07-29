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

// Template is a type used to enumerate Backup Job template keys
type Template string

const (
	Name           Template = "NAME"
	KeepLast       Template = "KEEP_LAST"
	BackupVolatile Template = "BACKUP_VOLATILE"
	FsFreeze       Template = "FS_FREEZE"
	Mode           Template = "MODE"
	BackupVMs      Template = "BACKUP_VMS"
	DatastoreId    Template = "DATASTORE_ID"
	Execution      Template = "EXECUTION"
)

// SchedAction define keys for scheduled action
type SchedAction string

const (
	SchedActionVec string = "SCHED_ACTION"

	Time     SchedAction = "TIME"
	Repeat   SchedAction = "REPEAT"
	Days     SchedAction = "DAYS"
	Action   SchedAction = "ACTION"
	EndType  SchedAction = "END_TYPE"
	EndValue SchedAction = "END_VALUE"
	ActionID SchedAction = "ID"
	ParentID SchedAction = "PARENT_ID"
)
