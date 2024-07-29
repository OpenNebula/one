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

import { getState } from 'client/models/Support'
import { T } from 'client/constants'

/** @type {Column[]} VM columns */
const COLUMNS = [
  { Header: T.ID, id: 'id', accessor: 'id', sortType: 'number' },
  { Header: T.Subject, id: 'subject', accessor: 'subject' },
  {
    Header: T.State,
    id: 'state',
    accessor: (row) => getState(row)?.name,
  },
]

COLUMNS.noFilterIds = ['id', 'name']

export default COLUMNS
