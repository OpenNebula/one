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

import { RESOURCE_NAMES, T, VNET_THRESHOLD } from '@ConstantsModule'
import { VnAPI } from '@FeaturesModule'
import { getLeasesInfo, getVirtualNetworkState } from '@ModelsModule'
import { ProgressBar, StatusTag } from '@ComponentsV2Module'
import { Component } from 'react'

import {
  getVdcId,
  VdcZoneResourceTab,
  vdcTabPropTypes,
} from '@modules/resources/resources/Vdc/Tabs/common'

const columns = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  { accessorKey: 'NAME', header: T.Name, truncate: true },
  {
    id: 'STATE',
    header: T.State,
    accessorFn: (row) => getVirtualNetworkState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getVirtualNetworkState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  { accessorKey: 'VN_MAD', header: T.Driver },
  {
    id: 'USED_LEASES',
    header: T.UsedLeases,
    accessorFn: (row) => getLeasesInfo(row)?.percentLabel,
    cell: ({ row }) => {
      const { percentOfUsed, percentLabel } = getLeasesInfo(row.original)

      return (
        <ProgressBar
          value={percentOfUsed}
          label={percentLabel}
          isLabelVisible
          thresholds={[VNET_THRESHOLD.LEASES.low, VNET_THRESHOLD.LEASES.high]}
        />
      )
    },
  },
  { accessorKey: 'UNAME', header: T.Owner, grow: false },
  { accessorKey: 'GNAME', header: T.Group, grow: false },
]

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @returns {Component} VDC virtual networks tab
 */
export const Vnets = ({ data }) => (
  <VdcZoneResourceTab
    vdcId={getVdcId(data)}
    title={T.Vnets}
    poolKey="VNETS"
    resourceKey="VNET"
    idKey="VNET_ID"
    columns={columns}
    rowDetailsResourceId={RESOURCE_NAMES.VNET}
    dataCy="vdc-vnets"
    useQuery={VnAPI.useGetVNetworksQuery}
  />
)

Vnets.propTypes = vdcTabPropTypes

Vnets.id = 'vnets'
Vnets.title = T.Vnets
