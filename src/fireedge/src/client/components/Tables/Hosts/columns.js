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
import * as HostModel from 'client/models/Host'

const getTotalOfResources = resources => [resources?.ID ?? []].flat().length || 0

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  {
    Header: 'Name',
    id: 'NAME',
    accessor: row => row?.TEMPLATE?.NAME ?? row.NAME
  },
  {
    Header: 'State',
    id: 'STATE',
    accessor: row => HostModel.getState(row)?.name,
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'State'
    }),
    filter: 'includesValue'
  },
  { Header: 'Cluster', accessor: 'CLUSTER' },
  {
    Header: 'IM MAD',
    accessor: 'IM_MAD',
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'IM Mad'
    }),
    filter: 'includesValue'
  },
  {
    Header: 'VM MAD',
    accessor: 'VM_MAD',
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      multiple: true,
      title: 'VM Mad'
    }),
    filter: 'includesValue'
  },
  {
    Header: 'Running VMs',
    id: 'RUNNING_VMS',
    accessor: 'HOST_SHARE.RUNNING_VMS',
    sortType: 'number'
  },
  {
    Header: 'Total VMs',
    id: 'TOTAL_VMS',
    accessor: row => getTotalOfResources(row?.VMS),
    sortType: 'number'
  },
  {
    Header: 'Host Share',
    accessor: 'HOST_SHARE',
    disableSortBy: true
  }
]
