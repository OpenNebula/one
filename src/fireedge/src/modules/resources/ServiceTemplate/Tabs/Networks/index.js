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
import { Component } from 'react'
import { TablePanel, TagList } from '@ComponentsV2Module'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useResourceSingleViewContext } from '@ProvidersModule'

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const getIdentifier = (value) => {
  if (!['string', 'number'].includes(typeof value)) return undefined

  const identifier = String(value).trim()

  return identifier || undefined
}

const normalizeNetworkReference = (reference) =>
  getIdentifier(reference)?.replace(/^\$/, '')

const getNetworkSource = (definition) => {
  if (!isObject(definition)) return { label: '-' }

  const templateId = getIdentifier(definition.template_id)
  if (templateId) {
    return {
      id: templateId,
      label: `Create from Virtual Network Template #${templateId}`,
      resource: RESOURCE_NAMES.VN_TEMPLATE,
    }
  }

  const reserveFrom = getIdentifier(definition.reserve_from)
  if (reserveFrom) {
    return {
      id: reserveFrom,
      label: `Reserve from Virtual Network #${reserveFrom}`,
      resource: RESOURCE_NAMES.VNET,
    }
  }

  const id = getIdentifier(definition.id)

  return id
    ? {
        id,
        label: `Use existing Virtual Network #${id}`,
        resource: RESOURCE_NAMES.VNET,
      }
    : { label: '-' }
}

const getRoleNetworkReferences = (role) =>
  []
    .concat(role?.template_contents?.NIC ?? [])
    .flat()
    .filter(isObject)
    .flatMap(({ NETWORK_ID: networkId, NETWORK: network }) => [
      networkId,
      network,
    ])
    .map(normalizeNetworkReference)
    .filter(Boolean)

const getNetworks = (serviceTemplate) => {
  const body = serviceTemplate?.TEMPLATE?.BODY ?? {}
  const roles = []
    .concat(body?.roles ?? [])
    .flat()
    .filter(isObject)

  return []
    .concat(body?.networks_values ?? [])
    .flat()
    .filter(isObject)
    .flatMap((networkValues) => Object.entries(networkValues))
    .map(([name, definition], index) => {
      const normalizedName = normalizeNetworkReference(name)
      const assignedRoles = [
        ...new Set(
          roles
            .filter((role) =>
              getRoleNetworkReferences(role).includes(normalizedName)
            )
            .map(({ name: roleName }) => getIdentifier(roleName))
            .filter(Boolean)
        ),
      ]

      const source = getNetworkSource(definition)

      return {
        key: `${index}-${name}`,
        ID: source?.id,
        name,
        assignedRoles,
        source,
      }
    })
}

const NETWORK_COLUMNS = [
  {
    header: `${T.Network} ${T.Name}`,
    id: 'name',
    accessorKey: 'name',
    truncate: true,
  },
  {
    header: `Assigned ${T.Roles}`,
    id: 'assigned_roles',
    accessorKey: 'assignedRoles',
    meta: { disableCellTooltip: true },
    cell: ({ row }) =>
      row.original.assignedRoles.length ? (
        <TagList
          max={row.original.assignedRoles.length}
          tags={row.original.assignedRoles.map((title) => ({ title }))}
        />
      ) : (
        '-'
      ),
  },
  {
    header: 'Create From',
    id: 'source',
    accessorFn: ({ source }) => source?.label,
  },
]

/**
 * Displays the networks defined by a Service Template.
 *
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @returns {Component} Service Template networks tab
 */
export const Networks = ({ data }) => {
  const { openResourceSingleView } = useResourceSingleViewContext()
  const serviceTemplate = [].concat(data?.selected ?? []).filter(Boolean)[0]
  const networks = getNetworks(serviceTemplate)

  const handleOpenNetwork = (network) => {
    const resource = network?.source?.resource

    if (resource && network?.ID) {
      openResourceSingleView(resource, network)
    }
  }

  return (
    <TablePanel
      title={T.Networks}
      columns={NETWORK_COLUMNS}
      data={networks}
      getRowId={({ key }) => key}
      isRowsSelectable
      onRowClick={handleOpenNetwork}
      emptyContentProps={{
        title: T.NoNetworksYet,
        subtitle: 'This service template does not define any networks',
      }}
    />
  )
}

Networks.propTypes = {
  data: PropTypes.object,
}

Networks.id = 'networks'
Networks.title = T.Networks
