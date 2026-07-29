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
import {
  getDatastoreState,
  getDatastoreType,
  getDatastoreCapacityInfo,
} from '@modules/models/Datastore/general'
import { createTable } from '@UtilsModule'
import { DatastoreAPI } from '@FeaturesModule'
import { createLabelColumn } from '@modules/models/labels'
import { ProgressBar, StatusTag, Tag } from '@ComponentsV2Module'

/* eslint-disable jsdoc/require-jsdoc */
export const DATASTORE_COLUMNS = [
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
  },
  {
    header: T.State,
    id: 'state',
    accessorFn: (row) => getDatastoreState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getDatastoreState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Type,
    id: 'type',
    accessorFn: (row) => getDatastoreType(row),
    cell: ({ row }) => {
      const type = getDatastoreType(row.original)

      return type ? <Tag title={type} status="default" /> : '-'
    },
  },
  {
    header: T.Capacity,
    id: 'capacity',
    accessorFn: (row) => {
      const capacity = getDatastoreCapacityInfo(row)

      return capacity.percentLabel
    },
    cell: ({ row }) => {
      const { percentOfUsed, percentLabel } = getDatastoreCapacityInfo(
        row.original
      )

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
    header: T.Clusters,
    id: 'clusters',
    accessorFn: (row) => [row?.CLUSTERS?.ID ?? []].flat(),
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
  createLabelColumn({ grow: false }),
]

export const datastoreTable = createTable(
  DATASTORE_COLUMNS,
  DatastoreAPI.useGetDatastoresQuery,
  { dataCy: 'datastores' }
)
