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
import { getMarketplaceAppState, getMarketplaceAppType } from '@ModelsModule'

/** @type {Column[]} Marketplace Apps columns */
const COLUMNS = [
  { Header: T.ID, id: 'id', accessor: 'ID', sortType: 'number' },
  { Header: T.Name, id: 'name', accessor: 'NAME' },
  { Header: T.Owner, id: 'owner', accessor: 'UNAME' },
  { Header: T.Group, id: 'group', accessor: 'GNAME' },
  {
    Header: T.State,
    id: 'state',
    accessor: (row) => getMarketplaceAppState(row)?.name,
  },
  { Header: T.Type, id: 'type', accessor: getMarketplaceAppType },
  { Header: T.Size, id: 'size', accessor: 'SIZE' },
  {
    Header: T.Hypervisor,
    id: 'hypervisor',
    accessor: 'TEMPLATE.HYPERVISOR',
  },
  {
    Header: T.Architecture,
    id: 'architecture',
    accessor: 'TEMPLATE.ARCHITECTURE',
  },
  {
    Header: T.Label,
    id: 'label',
    accessor: 'TEMPLATE.LABELS',
    filter: 'inclusiveArrayMatch',
  },
  { Header: T.Version, id: 'version', accessor: 'VERSION' },
  { Header: T.Marketplace, id: 'marketplace', accessor: 'MARKETPLACE' },
  { Header: T.Zone, id: 'zone', accessor: 'ZONE_ID' },
]

COLUMNS.noFilterIds = ['id', 'name', 'time', 'size', 'label']

export default COLUMNS
