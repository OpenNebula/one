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
  getMarketplaceCapacityInfo,
  getMarketplaceState,
} from '@modules/models/Marketplace/general'
import { createTable, getTotalOfResources } from '@UtilsModule'
import { MarketplaceAPI } from '@FeaturesModule'
import { ProgressBar, StatusTag, Tag } from '@ComponentsV2Module'
import { MARKET_THRESHOLD, T } from '@ConstantsModule'
import { createLabelColumn } from '@modules/models/labels'

/* eslint-disable jsdoc/require-jsdoc */
export const MARKETPLACE_COLUMNS = [
  { header: T.ID, accessorKey: 'ID', grow: false },
  { header: T.Name, accessorKey: 'NAME', truncate: true },
  {
    header: T.State,
    id: 'STATE',
    accessorFn: (row) => getMarketplaceState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getMarketplaceState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  {
    header: T.Driver,
    id: 'driver',
    accessorKey: 'MARKET_MAD',
    cell: ({ row }) =>
      row.original?.MARKET_MAD ? (
        <Tag title={row.original.MARKET_MAD} status="default" />
      ) : (
        '-'
      ),
  },
  {
    header: T.Apps,
    id: 'TOTAL_APPS',
    accessorFn: (row) => getTotalOfResources(row?.MARKETPLACEAPPS),
  },
  {
    header: T.Capacity,
    id: 'capacity',
    accessorFn: (row) => getMarketplaceCapacityInfo(row)?.percentLabel,
    cell: ({ row }) => {
      const { percentOfUsed, percentLabel } = getMarketplaceCapacityInfo(
        row.original
      )

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
          thresholds={[
            MARKET_THRESHOLD.CAPACITY.low,
            MARKET_THRESHOLD.CAPACITY.high,
          ]}
        />
      )
    },
  },
  { header: T.Zone, accessorKey: 'ZONE_ID' },
  { header: T.Owner, accessorKey: 'UNAME', grow: false },
  { header: T.Group, accessorKey: 'GNAME', grow: false },
  createLabelColumn({ grow: false }),
]

export const marketplaceTable = createTable(
  MARKETPLACE_COLUMNS,
  MarketplaceAPI.useGetMarketplacesQuery,
  { dataCy: 'marketplaces' }
)
