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
import { createTable, getLockIcon } from '@UtilsModule'
import { Box } from '@mui/material'
import { VnAPI } from '@FeaturesModule'
import {
  getLeasesInfo,
  getVirtualNetworkState,
  getVNManager,
} from '@modules/models/VirtualNetwork/general'
import { T, VNET_THRESHOLD } from '@ConstantsModule'
import { ProgressBar, StatusTag, Tag } from '@ComponentsV2Module'
import { createLabelColumn } from '@modules/models/labels'

/* eslint-disable jsdoc/require-jsdoc */
const getCluster = ({ CLUSTERS } = {}) =>
  [CLUSTERS?.ID ?? []].flat().filter(Boolean)[0] ?? '-'

export const VN_COLUMNS = [
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
    accessorFn: (row) => getVirtualNetworkState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getVirtualNetworkState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Driver,
    id: 'vn_mad',
    accessorFn: getVNManager,
    cell: ({ row }) =>
      row.original?.VN_MAD ? (
        <Tag title={row.original.VN_MAD} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: T.UsedLeases,
    id: 'used_leases',
    accessorKey: 'USED_LEASES',
    cell: ({ row }) => {
      const { percentOfUsed, percentLabel } = getLeasesInfo(row.original)

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
          thresholds={[VNET_THRESHOLD.LEASES.low, VNET_THRESHOLD.LEASES.high]}
        />
      )
    },
  },
  {
    header: T.Cluster,
    id: 'cluster',
    accessorFn: getCluster,
  },
  { header: T.Owner, id: 'owner', accessorKey: 'UNAME', grow: false },
  { header: T.Group, id: 'group', accessorKey: 'GNAME', grow: false },
  createLabelColumn({ grow: false }),
]

export const vnTable = createTable(VN_COLUMNS, VnAPI.useGetVNetworksQuery, {
  dataCy: 'vnets',
})
