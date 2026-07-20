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
import { createTable, timeFromMilliseconds } from '@UtilsModule'
import { OneKsAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { StatusTag, Tag } from '@ComponentsV2Module'
import { getVirtualOneKsState } from '@modules/models/OneKs/general'
import { createLabelColumn } from '@modules/models/labels'

/* eslint-disable jsdoc/require-jsdoc */
export const ONEKS_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
  { header: T.Name, id: 'name', accessorKey: 'NAME', truncate: true },
  {
    header: T.State,
    id: 'state',
    accessorFn: (row) => getVirtualOneKsState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getVirtualOneKsState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.KubernetesVersion,
    id: 'version',
    accessorFn: (row) => row?.TEMPLATE?.CLUSTER_BODY?.kubernetes_version ?? '',
    cell: ({ row }) => {
      const version = row.original?.TEMPLATE?.CLUSTER_BODY?.kubernetes_version

      return version ? <Tag title={version} status="default" /> : '-'
    },
  },
  {
    header: T.NodeGroups,
    id: 'node_groups',
    accessorFn: (row) => row?.TEMPLATE?.CLUSTER_BODY?.node_groups?.length ?? 0,
  },
  {
    header: T.RegistrationTime,
    id: 'registration_time',
    grow: false,
    accessorFn: (row) => {
      const registrationTime = row?.TEMPLATE?.CLUSTER_BODY?.registration_time

      return registrationTime
        ? timeFromMilliseconds(+registrationTime).toRelative()
        : '-'
    },
  },
  createLabelColumn({ grow: false }),
]
export const oneksTable = createTable(
  ONEKS_COLUMNS,
  OneKsAPI.useGetOneKsClustersQuery,
  { dataCy: 'oneks' }
)
