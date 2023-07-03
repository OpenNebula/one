/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

package backupjob

import (
	"encoding/xml"

	"github.com/OpenNebula/one/src/oca/go/src/goca/schemas/shared"
)

// Pool represents an OpenNebula Backup Job pool
type Pool struct {
	XMLName xml.Name `xml:"BACKUPJOB_POOL"`
	BackupJobs []BackupJob `xml:"BACKUPJOB"`
}

// BackupJob represents an OpenNebula Backup Job
type BackupJob struct {
	XMLName            xml.Name            `xml:"BACKUPJOB"`
	ID                 int                 `xml:"ID,omitempty"`
	UID                int                 `xml:"UID,omitempty"`
	GID                int                 `xml:"GID,omitempty"`
	UName              string              `xml:"UNAME,omitempty"`
	GName              string              `xml:"GNAME,omitempty"`
	Name               string              `xml:"NAME"`
	LockInfos          *shared.Lock        `xml:"LOCK,omitempty"`
	Permissions        *shared.Permissions `xml:"PERMISSIONS,omitempty"`
	Priority           int                 `xml:"PRIORITY,omitempty"`
	LastBackupTime     int                 `xml:"LAST_BACKUP_TIME,omitempty"`
	LastBackupDuration int                 `xml:"LAST_BACKUP_DURATION,omitempty"`
	UpdatedVMs         shared.EntitiesID   `xml:"UPDATED_VMS,omitempty"`
	OutdatedVMs        shared.EntitiesID   `xml:"OUTDATED_VMS,omitempty"`
	BackingUpVMs       shared.EntitiesID   `xml:"BACKING_UP_VMS,omitempty"`
	ErrorVMs           shared.EntitiesID   `xml:"ERROR_VMS,omitempty"`
	Template           Template            `xml:"TEMPLATE"`
}
