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
import {
  createTable,
  isoDateToMilliseconds,
  timeFromMilliseconds,
} from '@UtilsModule'
import { SupportAPI } from '@FeaturesModule'
import { T } from '@ConstantsModule'
import { getSupportState } from '@modules/models/Support/general'
import { StatusTag } from '@ComponentsV2Module'

/* eslint-disable jsdoc/require-jsdoc */
export const SUPPORT_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'id', grow: false },
  { header: T.Subject, id: 'subject', accessorKey: 'subject', truncate: true },
  {
    header: T.State,
    id: 'state',
    accessorFn: (row) => getSupportState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getSupportState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.RegistrationTime,
    id: 'time',
    grow: false,
    accessorFn: (row) =>
      row?.created_at
        ? timeFromMilliseconds(
            isoDateToMilliseconds(row.created_at)
          ).toRelative()
        : '-',
  },
]

export const supportTable = createTable(
  SUPPORT_COLUMNS,
  SupportAPI.useGetTicketsQuery,
  { dataCy: 'support-tickets' }
)
