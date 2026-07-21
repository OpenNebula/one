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
import { TablePanel, TagList } from '@ComponentsV2Module'
import { T } from '@ConstantsModule'
import { getVirtualRouterNics } from '@ModelsModule'

const NIC_COLUMNS = [
  { header: T.ID, id: 'id', accessorKey: 'NIC_ID', grow: false },
  { header: T.Name, id: 'name', accessorKey: 'NAME', truncate: true },
  { header: T.Network, id: 'network', accessorKey: 'NETWORK', truncate: true },
  {
    header: `${T.Network} ${T.ID}`,
    id: 'network-id',
    accessorKey: 'NETWORK_ID',
    grow: false,
  },
  {
    header: `${T.AddressRange} ${T.ID}`,
    id: 'ar-id',
    accessorKey: 'AR_ID',
    grow: false,
  },
  {
    header: T.ip,
    id: 'ip',
    accessorKey: 'IP',
    meta: { disableCellTooltip: true },
    cell: ({ row }) =>
      row.original?.IP ? <TagList tags={[{ title: row.original.IP }]} /> : '-',
  },
  {
    header: 'IPv6',
    id: 'ip6',
    accessorKey: 'IP6',
    meta: { disableCellTooltip: true },
    cell: ({ row }) =>
      row.original?.IP6 ? (
        <TagList tags={[{ title: row.original.IP6 }]} />
      ) : (
        '-'
      ),
  },
  { header: T.MAC, id: 'mac', accessorKey: 'MAC' },
  {
    header: T.VirtualRouterNICFloatingIP,
    id: 'floating',
    accessorKey: 'FLOATING_IP',
  },
  {
    header: T['nic.card.management'],
    id: 'management',
    accessorKey: 'VROUTER_MANAGEMENT',
  },
]

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} - Virtual Router NICs tab
 */
export const Nics = ({ data }) => {
  const { vrouter = {} } = data || {}
  const nics = useMemo(() => getVirtualRouterNics(vrouter), [vrouter])

  return (
    <TablePanel
      title={T.NicDevices}
      columns={NIC_COLUMNS}
      data={nics}
      isFullHeight
    />
  )
}

Nics.propTypes = {
  data: PropTypes.object,
}

Nics.id = 'nics'
Nics.title = T.NicDevices
