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

import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { VnAPI } from '@FeaturesModule'
import { getLeasesInfo, getVirtualNetworkState } from '@ModelsModule'
import { Component } from 'react'

import {
  getVdcId,
  VdcZoneResourceTab,
  vdcTabPropTypes,
} from '@modules/resources/resources/Vdc/Tabs/common'

const columns = [
  { accessorKey: 'ID', header: T.ID, width: '10%' },
  { accessorKey: 'NAME', header: T.Name },
  {
    id: 'STATE',
    header: T.State,
    accessorFn: (row) => getVirtualNetworkState(row)?.name,
  },
  { accessorKey: 'UNAME', header: T.Owner },
  { accessorKey: 'GNAME', header: T.Group },
  { accessorKey: 'VN_MAD', header: T.Driver },
  {
    id: 'USED_LEASES',
    header: T.UsedLeases,
    accessorFn: (row) => getLeasesInfo(row)?.percentLabel,
  },
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
