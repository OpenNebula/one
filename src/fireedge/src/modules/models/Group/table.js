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
/* eslint-disable jsdoc/require-jsdoc */

import { createTable, getTotalOfResources } from '@UtilsModule'
import { GroupAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { ProgressBar } from '@ComponentsV2Module'

import { getGroupQuotaUsage } from '@modules/models/Group/general'

export const GROUP_LIST_COLUMNS = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  {
    header: T.DatastoreSize,
    id: 'DATASTORE_QUOTA_SIZE',
    accessorFn: (row) =>
      getGroupQuotaUsage('DATASTORE', row?.DATASTORE_QUOTA ?? {})?.size
        ?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getGroupQuotaUsage('DATASTORE', row.original?.DATASTORE_QUOTA ?? {})
          ?.size ?? {}

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
        />
      )
    },
  },
  {
    header: T.VMCount,
    id: 'VM_QUOTA_COUNT',
    accessorFn: (row) =>
      getGroupQuotaUsage('VM', row?.VM_QUOTA ?? {})?.vms?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getGroupQuotaUsage('VM', row.original?.VM_QUOTA ?? {})?.vms ?? {}

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
        />
      )
    },
  },
  {
    header: T.NetworkLeases,
    id: 'NETWORK_QUOTA_LEASES',
    accessorFn: (row) =>
      getGroupQuotaUsage('NETWORK', row?.NETWORK_QUOTA ?? {})?.leases
        ?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getGroupQuotaUsage('NETWORK', row.original?.NETWORK_QUOTA ?? {})
          ?.leases ?? {}

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
        />
      )
    },
  },
  {
    header: T.ImageRVMS,
    id: 'IMAGE_QUOTA_RVMS',
    accessorFn: (row) =>
      getGroupQuotaUsage('IMAGE', row?.IMAGE_QUOTA ?? {})?.rvms?.percentLabel ??
      '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getGroupQuotaUsage('IMAGE', row.original?.IMAGE_QUOTA ?? {})?.rvms ?? {}

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
        />
      )
    },
  },
  {
    header: `${T.Total} ${T.Users}`,
    id: 'TOTAL_USERS',
    accessorFn: (row) => getTotalOfResources(row?.USERS),
    grow: false,
  },
]
export const GROUP_COLUMNS = [
  ...GROUP_LIST_COLUMNS,
  { header: 'VM quota', accessorKey: 'VM_QUOTA' },
  { header: 'Datastore quota', accessorKey: 'DATASTORE_QUOTA' },
  { header: 'Network quota', accessorKey: 'NETWORK_QUOTA' },
  { header: 'Image quota', accessorKey: 'IMAGE_QUOTA' },
]

export const groupTable = createTable(
  GROUP_COLUMNS,
  GroupAPI.useGetGroupsQuery,
  {
    dataCy: 'groups',
  }
)
