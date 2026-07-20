/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

import { T } from '@ConstantsModule'
import { BackupJobAPI } from '@FeaturesModule'
import { createTable, getLockIcon } from '@UtilsModule'
import {
  getBackupJobRelativeLastBackupTime,
  getBackupJobStatus,
  getBackupJobState,
} from '@modules/models/BackupJob/general'
import { StatusTag } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import { createLabelColumn } from '@modules/models/labels'

/* eslint-disable jsdoc/require-jsdoc */
export const BACKUPJOB_COLUMNS = [
  {
    header: T.ID,
    id: 'id',
    accessorKey: 'ID',
    grow: false,
  },
  {
    header: T.Name,
    id: 'name',
    accessorKey: 'NAME',
    truncate: true,
    cell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{row.original?.NAME}</span>
        {getLockIcon(row.original)}
      </Box>
    ),
  },
  {
    header: T.State,
    id: 'state',
    accessorFn: (row) => getBackupJobState(row),
    cell: ({ row }) => {
      const { color, name } = getBackupJobStatus(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Priority,
    id: 'priority',
    accessorKey: 'PRIORITY',
  },
  {
    header: T.Owner,
    id: 'owner',
    accessorKey: 'UNAME',
    grow: false,
  },
  {
    header: T.Group,
    id: 'group',
    accessorKey: 'GNAME',
    grow: false,
  },
  {
    header: T.LastBackupTimeInfo,
    id: 'lastBackupTime',
    grow: false,
    accessorFn: (row) =>
      getBackupJobRelativeLastBackupTime(row?.LAST_BACKUP_TIME),
  },
  createLabelColumn({ grow: false }),
]

export const backupJobTable = createTable(
  BACKUPJOB_COLUMNS,
  BackupJobAPI.useGetBackupJobsQuery,
  { dataCy: 'backup-jobs' }
)
