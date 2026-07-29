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
import { getMarketplaceAppState } from '@modules/models/MarketplaceApp/general'
import {
  createTable,
  getLockIcon,
  prettyBytes,
  timeFromMilliseconds,
} from '@UtilsModule'
import { MarketplaceAppAPI } from '@FeaturesModule'
import { T, UNITS } from '@ConstantsModule'
import { StatusTag, Tag } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import { createLabelColumn } from '@modules/models/labels'

/* eslint-disable jsdoc/require-jsdoc */
const stringifyValue = (value) => {
  if (value == null) return ''
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)

  return value
}

export const MARKETPLACEAPP_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
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
    accessorFn: (row) => getMarketplaceAppState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getMarketplaceAppState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Hypervisor,
    id: 'hypervisor',
    accessorFn: (row) => stringifyValue(row?.TEMPLATE?.HYPERVISOR),
    cell: ({ row }) => {
      const hypervisor = stringifyValue(row.original?.TEMPLATE?.HYPERVISOR)

      return hypervisor ? (
        <Tag title={hypervisor} status="miscellaneous" />
      ) : (
        '-'
      )
    },
  },
  {
    header: T.Architecture,
    id: 'architecture',
    accessorFn: (row) => stringifyValue(row?.TEMPLATE?.ARCHITECTURE),
    cell: ({ row }) => {
      const architecture = stringifyValue(row.original?.TEMPLATE?.ARCHITECTURE)

      return architecture ? (
        <Tag title={architecture} status="miscellaneous2" />
      ) : (
        '-'
      )
    },
  },
  {
    header: T.Version,
    id: 'version',
    accessorKey: 'VERSION',
    cell: ({ row }) =>
      row.original?.VERSION ? (
        <Tag title={row.original.VERSION} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: T.Size,
    id: 'size',
    accessorKey: 'SIZE',
    cell: ({ row }) => prettyBytes(row.original?.SIZE, UNITS.MB),
  },
  { header: T.Owner, id: 'owner', accessorKey: 'UNAME', grow: false },
  { header: T.Group, id: 'group', accessorKey: 'GNAME', grow: false },
  {
    header: T.Registered,
    id: 'time',
    accessorKey: 'REGTIME',
    grow: false,
    cell: ({ row }) =>
      row.original?.REGTIME
        ? timeFromMilliseconds(+row.original.REGTIME).toRelative()
        : '-',
  },
  createLabelColumn({ grow: false }),
]

export const marketplaceAppTable = createTable(
  MARKETPLACEAPP_COLUMNS,
  MarketplaceAppAPI.useGetMarketplaceAppsQuery,
  { dataCy: 'marketplace-apps' }
)
