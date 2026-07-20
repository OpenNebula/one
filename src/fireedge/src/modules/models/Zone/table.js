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
import { createTable } from '@UtilsModule'
import { ZoneAPI } from '@FeaturesModule'
import { getZoneState } from '@modules/models/Zone/general'
import { T } from '@ConstantsModule'
import { StatusTag } from '@ComponentsV2Module'
import { createLabelColumn } from '@modules/models/labels'

/* eslint-disable jsdoc/require-jsdoc */
export const ZONE_COLUMNS = [
  { header: T.ID, accessorKey: 'ID', grow: false },
  { header: T.Name, accessorKey: 'NAME', truncate: true },
  {
    header: T.State,
    id: 'STATE',
    accessorFn: (row) => getZoneState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getZoneState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Endpoint,
    id: 'ENDPOINT',
    accessorFn: (row) => row?.TEMPLATE?.ENDPOINT,
    truncate: true,
  },
  {
    header: T.EndpointGRPC,
    id: 'ENDPOINTGRPC',
    accessorFn: (row) => row?.TEMPLATE?.ENDPOINT_GRPC,
    truncate: true,
  },
  createLabelColumn({ grow: false }),
]

export const zoneTable = createTable(ZONE_COLUMNS, ZoneAPI.useGetZonesQuery, {
  dataCy: 'zones',
})
