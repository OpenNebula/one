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

import { CategoryFilter } from 'client/components/Tables/Enhanced/Utils'

import { T } from 'client/constants'

const COLUMNS = [
  { Header: T.Identifier, id: 'ID', accessor: 'ID', sortType: 'number' },
  {
    Header: T['acls.table.filter.string'],
    id: 'STRING',
    accessor: 'STRING',
    sortType: 'number',
  },
  {
    Header: T['acls.table.filter.user.name'],
    id: 'idUserName',
    accessor: 'USER.name',
    sortType: 'number',
  },
  {
    Header: T['acls.table.filter.user.type'],
    id: 'idUserType',
    accessor: 'USER.type',
    sortType: 'number',
  },
  {
    Header: T['acls.table.filter.user.id'],
    id: 'idUserId',
    accessor: 'USER.id',
    sortType: 'number',
  },
  {
    Header: T.Resources,
    id: 'resources',
    accessor: 'RESOURCE.resources',
    sortType: 'string',
    disableFilters: false,
    Filter: ({ column }) =>
      CategoryFilter({
        column,
        multiple: true,
        title: 'Test',
      }),
    filter: 'arrIncludes',
  },
  {
    Header: T['acls.table.filter.resources.user.name'],
    id: 'idResourceName',
    accessor: 'RESOURCE.identifier.name',
    sortType: 'number',
  },
  {
    Header: T['acls.table.filter.resources.user.type'],
    id: 'idResourceType',
    accessor: 'RESOURCE.identifier.type',
    sortType: 'number',
  },
  {
    Header: T['acls.table.filter.resources.user.id'],
    id: 'idResourceId',
    accessor: 'RESOURCE.identifier.id',
    sortType: 'number',
  },
  {
    Header: T.Rights,
    id: 'rights',
    accessor: 'RIGHTS.rights',
    sortType: 'string',
    disableFilters: false,
    Filter: ({ column }) =>
      CategoryFilter({
        column,
        multiple: true,
        title: 'Test',
      }),
    filter: 'arrIncludes',
  },

  {
    Header: T['acls.table.filter.zone.name'],
    id: 'zoneName',
    accessor: 'ZONE.name',
    sortType: 'number',
  },
  {
    Header: T['acls.table.filter.zone.type'],
    id: 'zoneType',
    accessor: 'ZONE.type',
    sortType: 'number',
  },
  {
    Header: T['acls.table.filter.zone.id'],
    id: 'zoneId',
    accessor: 'ZONE.id',
    sortType: 'number',
  },
]

export default COLUMNS
