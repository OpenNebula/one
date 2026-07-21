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
import { Image } from '@ComponentsV2Module'
import { ProviderAPI } from '@FeaturesModule'
import { createTable, timeFromMilliseconds } from '@UtilsModule'
import { getLogoSource } from '@modules/models/Provider/general'
import { Box } from '@mui/material'
import { createLabelColumn } from '@modules/models/labels'
import { scale } from '@StylesModule'

/* eslint-disable jsdoc/require-jsdoc */
export const PROVIDER_COLUMNS = [
  {
    header: T.ID,
    accessorKey: 'ID',
    id: 'id',
    grow: false,
  },
  {
    header: T.Name,
    accessorKey: 'NAME',
    id: 'name',
    truncate: true,
    cell: ({ row }) => {
      const src = getLogoSource(
        row?.original?.TEMPLATE?.PROVIDER_BODY?.fireedge
      )

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Image
            src={src}
            width={scale[600]}
            height={scale[600]}
            alt={'list-image-identifier'}
          />
          <span>{row.original?.NAME}</span>
        </Box>
      )
    },
  },
  {
    header: T.Provisions,
    id: 'number_provisions',
    accessorFn: (row) =>
      String(row?.TEMPLATE?.PROVIDER_BODY?.provision_ids?.length ?? 0),
  },
  {
    header: T.Owner,
    accessorKey: 'UNAME',
    id: 'owner',
    grow: false,
  },
  {
    header: T.Group,
    accessorKey: 'GNAME',
    id: 'group',
    grow: false,
  },
  {
    header: T.Registered,
    id: 'time',
    grow: false,
    cell: ({ row }) => {
      const registrationTime =
        row?.original?.TEMPLATE?.PROVIDER_BODY?.registration_time

      return registrationTime
        ? timeFromMilliseconds(+registrationTime).toRelative()
        : '-'
    },
  },
  createLabelColumn({ grow: false }),
]

export const providerTable = createTable(
  PROVIDER_COLUMNS,
  ProviderAPI.useGetProvidersQuery,
  { dataCy: 'providers' }
)
