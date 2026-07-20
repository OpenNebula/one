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

import { T } from '@ConstantsModule'
import { DriverAPI } from '@FeaturesModule'
import { createTable } from '@UtilsModule'
import { getDriverState } from '@modules/models/Driver/general'
import { Stack } from '@mui/material'
import { StatusTag } from '@ComponentsV2Module'

/* eslint-disable jsdoc/require-jsdoc */
export const DRIVER_COLUMNS = [
  {
    header: T.Name,
    accessorKey: 'name',
    id: 'name',
    truncate: true,
  },
  {
    header: T.Description,
    accessorKey: 'description',
    id: 'description',
    truncate: true,
  },
  {
    header: T.State,
    id: 'state',
    cell: ({ row }) => {
      const { color, name } = getDriverState(row?.original)

      return (
        <Stack direction="row" flexWrap="wrap" gap="0.5em">
          <StatusTag statusColor={color} statusName={name} />
        </Stack>
      )
    },
  },
]

export const driverTable = createTable(
  DRIVER_COLUMNS,
  DriverAPI.useGetDriversQuery,
  { dataCy: 'drivers' }
)
