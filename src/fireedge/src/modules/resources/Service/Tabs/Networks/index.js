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

import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { ProgressBar, Table } from '@ComponentsV2Module'
import { VnAPI } from '@FeaturesModule'
import { RESOURCE_NAMES, T, VNET_THRESHOLD } from '@ConstantsModule'
import { getLeasesInfo, getServiceNetworks } from '@ModelsModule'

const NETWORK_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'ID', grow: false },
  { header: T.Name, id: 'name', accessorKey: 'NAME', truncate: true },
  { header: T.Roles, id: 'roles', accessorKey: 'ROLES' },
  {
    header: T.UsedLeases,
    id: 'used_leases',
    accessorFn: ({ VNET: vnet }) =>
      vnet ? getLeasesInfo(vnet)?.percentLabel : '-',
    cell: ({ row }) => {
      const vnet = row.original?.VNET
      if (!vnet) return '-'

      const { percentOfUsed, percentLabel } = getLeasesInfo(vnet)

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
]

/**
 * Displays the virtual networks defined by a Service.
 *
 * @param {object} props - Component properties
 * @param {object} props.data - Tab specific data
 * @returns {Component} Service networks tab
 */
export const Networks = ({ data }) => {
  const service = [].concat(data?.selected ?? []).filter(Boolean)[0] ?? {}
  const { data: vnets = [], isLoading } = VnAPI.useGetVNetworksQuery()
  const networks = useMemo(() => {
    const vnetsById = new Map(vnets.map((vnet) => [String(vnet.ID), vnet]))

    return getServiceNetworks(service).map((network) => ({
      ...network,
      VNET: vnetsById.get(String(network.ID)),
    }))
  }, [service, vnets])

  return (
    <Table
      columns={NETWORK_COLUMNS}
      data={networks}
      isLoading={isLoading}
      getRowId={(row) => String(row.NAME)}
      isRowsSelectable={false}
      size="medium"
      openRowDetailsOnClick
      rowDetailsResourceId={RESOURCE_NAMES.VNET}
      emptyContentProps={{
        title: T.NoNetworksYet,
        subtitle: T.NoNetworksInService,
      }}
    />
  )
}

Networks.propTypes = {
  data: PropTypes.object,
}

Networks.id = 'networks'
Networks.title = T.Networks
