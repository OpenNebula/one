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
import { HostAPI } from '@FeaturesModule'
import { getAllocatedInfo, getHostState } from '@ModelsModule'
import { ProgressBar, StatusTag } from '@ComponentsV2Module'
import { Component } from 'react'

import {
  getVdcId,
  VdcZoneResourceTab,
  vdcTabPropTypes,
} from '@modules/resources/resources/Vdc/Tabs/common'

const columns = [
  { accessorKey: 'ID', header: T.ID, grow: false },
  {
    id: 'NAME',
    header: T.Name,
    accessorFn: (row) => row?.TEMPLATE?.NAME ?? row?.NAME,
    truncate: true,
  },
  {
    id: 'STATE',
    header: T.State,
    accessorFn: (row) => getHostState(row)?.name,
    cell: ({ row }) => {
      const { color, name } = getHostState(row.original) ?? {}

      return <StatusTag statusColor={color} statusName={name} />
    },
  },
  { accessorKey: 'CLUSTER', header: T.Cluster, truncate: true },
  { accessorKey: 'HOST_SHARE.RUNNING_VMS', header: T.RunningVMs },
  {
    id: 'CPU',
    header: T.CPU,
    accessorFn: (row) => getAllocatedInfo(row)?.percentCpuLabel,
    cell: ({ row }) => {
      const { percentCpuUsed, percentCpuLabel } = getAllocatedInfo(row.original)

      return (
        <ProgressBar
          value={percentCpuUsed}
          label={percentCpuLabel}
          isLabelVisible
        />
      )
    },
  },
  {
    id: 'MEMORY',
    header: T.Memory,
    accessorFn: (row) => getAllocatedInfo(row)?.percentMemLabel,
    cell: ({ row }) => {
      const { percentMemUsed, percentMemLabel } = getAllocatedInfo(row.original)

      return (
        <ProgressBar
          value={percentMemUsed}
          label={percentMemLabel}
          isLabelVisible
        />
      )
    },
  },
]

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab slot data payload
 * @returns {Component} VDC hosts tab
 */
export const Hosts = ({ data }) => (
  <VdcZoneResourceTab
    vdcId={getVdcId(data)}
    title={T.Hosts}
    poolKey="HOSTS"
    resourceKey="HOST"
    idKey="HOST_ID"
    columns={columns}
    rowDetailsResourceId={RESOURCE_NAMES.HOST}
    dataCy="vdc-hosts"
    useQuery={HostAPI.useGetHostsQuery}
  />
)

Hosts.propTypes = vdcTabPropTypes

Hosts.id = 'hosts'
Hosts.title = T.Hosts
