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

import { createTable } from '@UtilsModule'
import { UserAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { ProgressBar, Tag } from '@ComponentsV2Module'

import { getUserQuotaUsage } from '@modules/models/User/general'

/* eslint-disable jsdoc/require-jsdoc */
export const USER_COLUMNS = [
  { header: 'ID', accessorKey: 'ID', grow: false },
  { header: 'Name', accessorKey: 'NAME', truncate: true },
  {
    header: 'Auth driver',
    id: 'authDriver',
    accessorKey: 'AUTH_DRIVER',
    grow: false,
    cell: ({ row }) =>
      row.original?.AUTH_DRIVER ? (
        <Tag title={row.original.AUTH_DRIVER} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: T.DatastoreSize,
    id: 'DATASTORE_QUOTA_SIZE',
    accessorFn: (row) =>
      getUserQuotaUsage('DATASTORE', row?.DATASTORE_QUOTA ?? {})?.size
        ?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getUserQuotaUsage('DATASTORE', row.original?.DATASTORE_QUOTA ?? {})
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
      getUserQuotaUsage('VM', row?.VM_QUOTA ?? {})?.vms?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getUserQuotaUsage('VM', row.original?.VM_QUOTA ?? {})?.vms ?? {}

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
      getUserQuotaUsage('NETWORK', row?.NETWORK_QUOTA ?? {})?.leases
        ?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getUserQuotaUsage('NETWORK', row.original?.NETWORK_QUOTA ?? {})
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
      getUserQuotaUsage('IMAGE', row?.IMAGE_QUOTA ?? {})?.rvms?.percentLabel ??
      '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getUserQuotaUsage('IMAGE', row.original?.IMAGE_QUOTA ?? {})?.rvms ?? {}

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
        />
      )
    },
  },
  { header: 'Group', accessorKey: 'GNAME', grow: false },
  { header: 'GroupAdmin', accessorKey: 'IS_ADMIN_GROUP' },
  { header: 'Enabled', accessorKey: 'ENABLED' },
  { header: 'VM quota', accessorKey: 'VM_QUOTA' },
  { header: 'Datastore quota', accessorKey: 'DATASTORE_QUOTA' },
  { header: 'Network quota', accessorKey: 'NETWORK_QUOTA' },
  { header: 'Image quota', accessorKey: 'IMAGE_QUOTA' },
]

export const USER_LIST_COLUMNS = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  {
    accessorKey: 'AUTH_DRIVER',
    header: T.AuthDriver,
    id: 'authDriver',
    grow: false,
    cell: ({ row }) =>
      row.original?.AUTH_DRIVER ? (
        <Tag title={row.original.AUTH_DRIVER} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: T.DatastoreSize,
    id: 'DATASTORE_QUOTA_SIZE',
    accessorFn: (row) =>
      getUserQuotaUsage('DATASTORE', row?.DATASTORE_QUOTA ?? {})?.size
        ?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getUserQuotaUsage('DATASTORE', row.original?.DATASTORE_QUOTA ?? {})
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
      getUserQuotaUsage('VM', row?.VM_QUOTA ?? {})?.vms?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getUserQuotaUsage('VM', row.original?.VM_QUOTA ?? {})?.vms ?? {}

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
      getUserQuotaUsage('NETWORK', row?.NETWORK_QUOTA ?? {})?.leases
        ?.percentLabel ?? '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getUserQuotaUsage('NETWORK', row.original?.NETWORK_QUOTA ?? {})
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
      getUserQuotaUsage('IMAGE', row?.IMAGE_QUOTA ?? {})?.rvms?.percentLabel ??
      '-',
    cell: ({ row }) => {
      const { percentOfUsed = 0, percentLabel = '-' } =
        getUserQuotaUsage('IMAGE', row.original?.IMAGE_QUOTA ?? {})?.rvms ?? {}

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
        />
      )
    },
  },
  { accessorKey: 'GNAME', header: T.Group, grow: false },
]

export const userTable = createTable(USER_COLUMNS, UserAPI.useGetUsersQuery, {
  dataCy: 'users',
})
