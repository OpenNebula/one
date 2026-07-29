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

import {
  createTable,
  getImageTypeLabel,
  getLockIcon,
  prettyBytes,
  timeFromMilliseconds,
} from '@UtilsModule'
import { ImageAPI } from '@FeaturesModule'
import { getImageState } from '@modules/models/Image/general'
import { T } from '@ConstantsModule'
import { createLabelColumn } from '@modules/models/labels'
import { StatusTag, Tag } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import { getBackupRunningVms } from '@modules/models/Backup/general'

/* eslint-disable jsdoc/require-jsdoc */
export const IMAGE_COLUMNS = [
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
    accessorFn: (row) => getImageState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getImageState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Type,
    id: 'type',
    accessorFn: (row) => getImageTypeLabel(row),
    cell: ({ row }) => {
      const type = getImageTypeLabel(row.original)

      return type ? <Tag title={type} status="default" /> : '-'
    },
  },
  {
    header: T.Size,
    id: 'size',
    accessorFn: (row) => prettyBytes(+row?.SIZE || 0, 'MB'),
    cell: ({ row }) => prettyBytes(+row.original?.SIZE || 0, 'MB'),
  },
  {
    header: T.Persistent,
    id: 'persistent',
    accessorFn: (row) => (+row?.PERSISTENT ? T.Yes : T.No),
    cell: ({ row }) => (+row.original?.PERSISTENT ? T.Yes : T.No),
  },
  {
    header: T.VMs,
    id: 'vms',
    accessorFn: (row) => getBackupRunningVms(row),
  },
  {
    header: T.Datastore,
    id: 'datastore',
    accessorKey: 'DATASTORE',
    truncate: true,
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
    accessorKey: 'REGTIME',
    header: T.Registered,
    grow: false,
    cell: ({ row }) => timeFromMilliseconds(row.original.REGTIME).toRelative(),
  },
  createLabelColumn({ grow: false }),
]

export const imageTable = createTable(
  IMAGE_COLUMNS,
  ImageAPI.useGetImagesQuery,
  {
    dataCy: 'images',
  }
)
