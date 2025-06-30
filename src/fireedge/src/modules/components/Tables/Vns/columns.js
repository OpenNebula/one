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
import { T } from '@ConstantsModule'
import {
  getVirtualNetLocked,
  getVirtualNetworkState,
  getVNManager,
} from '@ModelsModule'
import { Column } from 'opennebula-react-table'

/** @type {Column[]} Virtual Network columns */
const COLUMNS = [
  { Header: T.ID, id: 'id', accessor: 'ID', sortType: 'number' },
  { Header: T.Name, id: 'name', accessor: 'NAME' },
  {
    Header: T.State,
    id: 'state',
    accessor: (row) => getVirtualNetworkState(row)?.name,
  },
  { Header: T.Owner, id: 'owner', accessor: 'UNAME' },
  { Header: T.Group, id: 'group', accessor: 'GNAME' },
  {
    Header: T.Locked,
    id: 'locked',
    accessor: getVirtualNetLocked,
    translation: { true: T.Locked, false: T.Unlocked },
  },
  { Header: T.Driver, id: 'vn_mad', accessor: getVNManager },
  {
    Header: T.Label,
    id: 'label',
    accessor: 'TEMPLATE.LABELS',
    filter: 'inclusiveArrayMatch',
  },
  {
    Header: T.UsedLeases,
    id: 'used_leases',
    accessor: 'USED_LEASES',
    sortType: 'number',
  },
]

COLUMNS.noFilterIds = ['id', 'name', 'used_leases', 'label']

export default COLUMNS
