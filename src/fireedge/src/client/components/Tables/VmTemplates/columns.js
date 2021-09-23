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
import * as Helper from 'client/models/Helper'
import { } from 'client/constants'

export default [
  { Header: 'ID', accessor: 'ID', sortType: 'number' },
  { Header: 'Name', accessor: 'NAME' },
  { Header: 'Owner', accessor: 'UNAME' },
  { Header: 'Group', accessor: 'GNAME' },
  { Header: 'Start Time', accessor: 'REGTIME' },
  { Header: 'Locked', accessor: 'LOCK' },
  {
    Header: 'Logo',
    id: 'LOGO',
    accessor: row => row?.TEMPLATE?.LOGO
  },
  {
    Header: 'Virtual Router',
    id: 'VROUTER',
    accessor: row =>
      Helper.stringToBoolean(row?.TEMPLATE?.VROUTER) && 'VROUTER',
    disableFilters: false,
    Filter: ({ column }) => CategoryFilter({
      column,
      title: 'Virtual Router'
    }),
    filter: 'exact'
  }
]
