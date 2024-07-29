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
import { Column } from 'react-table'

import { T } from 'client/constants'

/** @type {Column[]} VM Disk columns */
const COLUMNS = [
  { Header: T.ID, id: 'id', accessor: 'DISK_ID', sortType: 'number' },
  { Header: T.Datastore, id: 'datastore', accessor: 'DATASTORE' },
  {
    Header: T.Cluster,
    id: 'cluster',
    accessor: 'CLUSTER_ID',
    sortType: 'number',
  },
  { Header: T.Size, id: 'size', accessor: 'SIZE', sortType: 'number' },
  { Header: T.TargetDevice, id: 'target', accessor: 'TARGET' },
]

COLUMNS.noFilterIds = ['id', 'target', 'size']

export default COLUMNS
