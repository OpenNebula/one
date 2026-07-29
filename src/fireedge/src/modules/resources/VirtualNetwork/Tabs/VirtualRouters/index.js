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
import { TablePanel } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { VrAPI } from '@FeaturesModule'
import { getTotalOfResources } from '@UtilsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Virtual Network virtual routers tab
 */
export const VirtualRouters = ({ data }) => {
  const { vnet = {} } = data || {}

  // API
  const { data: virtualRouters = [], isFetching } = VrAPI.useGetVrsQuery()

  // State
  const virtualRouterIds = useMemo(
    () => [vnet?.VROUTERS?.ID ?? []].flat().map((id) => +id),
    [vnet]
  )
  const vnetVirtualRouters = useMemo(
    () =>
      virtualRouters.filter((virtualRouter) =>
        virtualRouterIds.includes(+virtualRouter.ID)
      ),
    [virtualRouters, virtualRouterIds]
  )

  // Table
  const columns = [
    { accessorKey: 'ID', header: T.ID, grow: false },
    { accessorKey: 'NAME', header: T.Name, truncate: true },
    {
      id: 'vms',
      header: T.VirtualMachines,
      cell: ({ row }) => getTotalOfResources(row.original?.VMS),
    },
    { accessorKey: 'UNAME', header: T.Owner, grow: false },
    { accessorKey: 'GNAME', header: T.Group, grow: false },
  ]

  return (
    <TablePanel
      key="virtual-network-virtual-routers-table"
      columns={columns}
      data={vnetVirtualRouters}
      isLoading={isFetching}
    />
  )
}

VirtualRouters.propTypes = {
  data: PropTypes.object,
}

VirtualRouters.id = 'virtual_router'
VirtualRouters.title = T.VirtualRouters
