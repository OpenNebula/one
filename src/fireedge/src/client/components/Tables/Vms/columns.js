/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { Column } from 'react-table'

import {
  getState,
  getIps,
  getType,
  getLastHistory,
} from 'client/models/VirtualMachine'
import { T } from 'client/constants'

/** @type {Column[]} VM columns */
const COLUMNS = [
  { Header: T.ID, id: 'id', accessor: 'ID', sortType: 'number' },
  { Header: T.Name, id: 'name', accessor: 'NAME' },
  {
    Header: T.State,
    id: 'state',
    accessor: (row) => getState(row)?.name,
  },
  { Header: T.Owner, id: 'owner', accessor: 'UNAME' },
  { Header: T.Group, id: 'group', accessor: 'GNAME' },
  { Header: T.StartTime, id: 'time', accessor: 'STIME' },
  { Header: T.Locked, id: 'locked', accessor: 'LOCK' },
  { Header: T.Type, id: 'type', accessor: getType },
  {
    Header: T.IP,
    id: 'ips',
    accessor: (row) => getIps(row).join(),
    sortType: 'length',
  },
  {
    Header: T.Hostname,
    id: 'hostname',
    accessor: (row) => getLastHistory(row)?.HOSTNAME,
  },
]

COLUMNS.noFilterIds = ['id', 'name', 'ips', 'time']

export default COLUMNS
