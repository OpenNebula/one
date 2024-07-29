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

/** @type {Column[]} Service columns */
const COLUMNS = [
  { Header: T.ID, id: 'id', accessor: 'ID', sortType: 'number' },
  { Header: T.Name, id: 'name', accessor: 'NAME' },
  { Header: T.Owner, id: 'owner', accessor: 'UNAME' },
  { Header: T.Group, id: 'group', accessor: 'GNAME' },
  { Header: T.State, id: 'state', accessor: 'TEMPLATE.BODY.state' },
  {
    Header: T.Description,
    id: 'description',
    accessor: 'TEMPLATE.BODY.description',
  },
  {
    Header: T.StartTime,
    id: 'time',
    accessor: 'TEMPLATE.BODY.start_time',
  },
]

COLUMNS.noFilterIds = ['id', 'name', 'description', 'time']

export default COLUMNS
