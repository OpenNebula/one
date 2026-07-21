/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { createTable, getLockIcon } from '@UtilsModule'
import { VrAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import {
  getVirtualRouterTotalNics,
  getVirtualRouterTotalVms,
} from '@modules/models/VirtualRouter/general'
import { createLabelColumn } from '@modules/models/labels'
import { Box } from '@mui/material'

/* eslint-disable jsdoc/require-jsdoc */
export const VR_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
  {
    header: T.Name,
    id: 'name',
    accessorKey: 'NAME',
    truncate: true,
    cell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{row.original?.NAME}</span>
        {getLockIcon(row.original)}
      </Box>
    ),
  },
  {
    header: T.TotalVms,
    id: 'vms',
    accessorFn: getVirtualRouterTotalVms,
  },
  {
    header: T.NICs,
    id: 'nics',
    accessorFn: getVirtualRouterTotalNics,
  },
  { header: T.Owner, id: 'owner', accessorKey: 'UNAME', grow: false },
  { header: T.Group, id: 'group', accessorKey: 'GNAME', grow: false },
  createLabelColumn({ grow: false }),
]

export const vrTable = createTable(VR_COLUMNS, VrAPI.useGetVrsQuery, {
  dataCy: 'vrs',
})
