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
import { createTable, getTotalOfResources } from '@UtilsModule'
import { ClusterAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { Tag } from '@ComponentsV2Module'
import { createLabelColumn } from '@modules/models/labels'

/* eslint-disable jsdoc/require-jsdoc */
export const CLUSTER_COLUMNS = [
  {
    header: T.ID,
    id: 'ID',
    accessorKey: 'ID',
    grow: false,
  },
  {
    header: T.Name,
    id: 'name',
    accessorKey: 'NAME',
    truncate: true,
  },
  {
    header: T.ProvisionType,
    id: 'provisionType',
    accessorFn: (row) => row?.TEMPLATE?.ONEFORM?.DRIVER,
    cell: ({ row }) => {
      const driver = row.original?.TEMPLATE?.ONEFORM?.DRIVER

      return driver ? <Tag title={driver} status="default" /> : '-'
    },
  },
  {
    header: T.Hosts,
    id: 'hosts',
    accessorFn: (row) => getTotalOfResources(row?.HOSTS),
  },
  {
    header: T.Datastores,
    id: 'datastores',
    accessorFn: (row) => getTotalOfResources(row?.DATASTORES),
  },
  {
    header: T.VirtualNetworks,
    id: 'vnets',
    accessorFn: (row) => getTotalOfResources(row?.VNETS),
  },
  createLabelColumn({ grow: false }),
]

export const clusterTable = createTable(
  CLUSTER_COLUMNS,
  ClusterAPI.useGetClustersQuery,
  { dataCy: 'clusters' }
)

export const clusterSelectionTable = createTable(
  CLUSTER_COLUMNS.filter(({ id }) => id !== 'labels'),
  ClusterAPI.useGetClustersQuery,
  { dataCy: 'clusters' }
)
