/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { CategoryFilter } from '@modules/components/Tables/Enhanced/Utils'
import { T } from '@ConstantsModule'
import { getImageState, getImageType, getDiskType } from '@ModelsModule'

const getTotalOfResources = (resources) =>
  [resources?.ID ?? []].flat().length || 0

const COLUMNS = [
  { Header: 'ID', accessor: 'ID', id: 'id', sortType: 'number' },
  { Header: 'Name', id: 'NAME', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Locked', id: 'locked', accessor: 'LOCK' },
  {
    Header: 'State',
    id: 'STATE',
    accessor: (row) => getImageState(row)?.name,
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
    Header: 'Type',
    id: 'TYPE',
    accessor: (row) => getImageType(row),
  },
  {
    Header: 'Disk Type',
    id: 'DISK_TYPE',
    accessor: (row) => getDiskType(row),
  },
  {
    Header: T.Label,
    id: 'label',
    accessor: 'TEMPLATE.LABELS',
    filter: 'inclusiveArrayMatch',
  },
  { Header: 'Registration Time', accessor: 'REGTIME' },
  { Header: 'Datastore', accessor: 'DATASTORE' },
  { Header: 'Persistent', accessor: 'PERSISTENT' },
  {
    Header: 'Running VMs',
    accessor: 'RUNNING_VMS',
    sortType: 'number',
  },
  {
    Header: 'Total VMs',
    id: 'TOTAL_VMS',
    accessor: (row) => getTotalOfResources(row?.VMS),
    sortType: 'number',
  },
]

COLUMNS.noFilterIds = ['id', 'name', 'label']

export default COLUMNS
