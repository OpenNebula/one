/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => DatastoreModel.getState(row)?.name,
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'State'
    }),
    filter: 'includesValue'
  },
  {
    Header: 'Type',
    id: 'TYPE',
    accessor: row => DatastoreModel.getType(row)
  },
  {
    Header: 'Clusters IDs',
    id: 'CLUSTERS',
    accessor: row => [row?.CLUSTERS?.ID ?? []].flat(),
    sortType: 'length'
  },
  {
    Header: 'Allocated CPU',
    accessor: 'ALLOCATED_CPU',
    sortType: 'number'
  },
  {
    Header: 'Total Capacity',
    accessor: 'TOTAL_MB',
    sortType: 'number'
  },
  {
    Header: 'Free Capacity',
    accessor: 'USED_MB',
    sortType: 'number'
  },
  {
    Header: 'Provision ID',
    id: 'PROVISION_ID',
    accessor: 'PROVISION.ID'
  }
]
