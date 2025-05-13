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
import { Column } from 'opennebula-react-table'

import { T } from '@ConstantsModule'
import {
  getIps,
  getLastHistory,
  getVMLocked,
  getVirtualMachineState,
  getVirtualMachineType,
  getVmHostname,
} from '@ModelsModule'

/** @type {Column[]} VM columns */
const COLUMNS = [
  { Header: T.ID, id: 'id', accessor: 'ID', sortType: 'number' },
  { Header: T.Name, id: 'name', accessor: 'NAME' },
  {
    Header: T.State,
    id: 'state',
    accessor: (row) => getVirtualMachineState(row)?.name,
  },
  { Header: T.Owner, id: 'owner', accessor: 'UNAME' },
  { Header: T.Group, id: 'group', accessor: 'GNAME' },
  { Header: T.StartTime, id: 'time', accessor: 'STIME' },
  {
    Header: T.Locked,
    id: 'locked',
    accessor: getVMLocked,
    translation: { true: T.Locked, false: T.Unlocked },
  },
  {
    Header: T.Label,
    id: 'label',
    accessor: 'TEMPLATE.LABELS',
    filter: 'inclusiveArrayMatch',
  },
  { Header: T.Type, id: 'type', accessor: getVirtualMachineType },
  {
    Header: T.IP,
    id: 'ips',
    accessor: (row) => getIps(row).join(),
    sortType: 'length',
  },
  {
    Header: T.Hostname,
    id: 'vmhostname',
    accessor: (row) => getVmHostname(row)?.pop() ?? '',
  },
  {
    Header: T.Host,
    id: 'hostname',
    accessor: (row) => getLastHistory(row)?.HOSTNAME,
  },
]

COLUMNS.noFilterIds = ['id', 'name', 'ips', 'time', 'label']

export default COLUMNS
