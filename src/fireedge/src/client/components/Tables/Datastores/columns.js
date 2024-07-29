/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { CategoryFilter } from 'client/components/Tables/Enhanced/Utils'
import * as DatastoreModel from 'client/models/Datastore'
import { Column } from 'react-table'
import { T } from 'client/constants'

/** @type {Column[]} Datastore columns */
const COLUMNS = [
  { Header: T.ID, id: 'id', accessor: 'ID', sortType: 'number' },
  { Header: T.Name, id: 'name', accessor: 'NAME' },
  { Header: T.Owner, id: 'owner', accessor: 'UNAME' },
  { Header: T.Group, id: 'group', accessor: 'GNAME' },
  {
    Header: T.Label,
    id: 'label',
    accessor: 'TEMPLATE.LABELS',
    filter: 'includesSome',
  },
  {
    Header: T.State,
    id: 'state',
    accessor: (row) => DatastoreModel.getState(row)?.name,
    disableFilters: false,
    Filter: ({ column }) =>
      CategoryFilter({
        column,
        multiple: true,
        title: 'State',
      }),
    filter: 'includesValue',
  },
  {
    Header: T.Type,
    id: 'type',
    accessor: (row) => DatastoreModel.getType(row),
    Filter: ({ column }) =>
      CategoryFilter({
        column,
        multiple: true,
        title: 'Type',
      }),
    filter: 'includesValue',
  },
  {
    Header: 'Clusters IDs',
    id: 'clusters',
    accessor: (row) => [row?.CLUSTERS?.ID ?? []].flat(),
    sortType: 'length',
  },
  {
    Header: 'Allocated CPU',
    id: 'allocated-cpu',
    accessor: 'ALLOCATED_CPU',
    sortType: 'number',
  },
  {
    Header: 'Total Capacity',
    id: 'total-capacity',
    accessor: 'TOTAL_MB',
    sortType: 'number',
  },
  {
    Header: 'Free Capacity',
    id: 'free-capacity',
    accessor: 'USED_MB',
    sortType: 'number',
  },
  {
    Header: 'Provision ID',
    id: 'provision-id',
    accessor: 'PROVISION.ID',
  },
]

COLUMNS.noFilterIds = ['id', 'name', 'type', 'label']

export default COLUMNS
