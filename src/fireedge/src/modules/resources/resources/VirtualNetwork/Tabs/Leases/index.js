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
import { Box } from '@mui/material'
import { Button, StatusTag, TablePanel } from '@ComponentsV2Module'
import {
  STYLE_BUTTONS,
  T,
  VN_ACTIONS,
  LEASES_STATES_STR,
} from '@ConstantsModule'
import { useHoldIPFormModal } from '@modules/resources/resources/VirtualNetwork/Forms'
import { VnAPI, useGeneralApi } from '@FeaturesModule'
import { getAddressType, getLeaseState } from '@ModelsModule'

const LEASE_TYPES = { VM: 'VM', NET: 'NET', VR: 'VR' }
const { HOLD_LEASE, RELEASE_LEASE } = VN_ACTIONS
const HOLD_LABEL = T.HOLD ?? T.Hold ?? 'Hold'

const getStateIds = (vnet, nameState = '') => {
  const ids = vnet?.[nameState]?.ID

  return [ids ? (Array.isArray(ids) ? ids : [ids]) : []].flat()
}

const getLeaseStates = (vnet) => {
  const states = { '-1': LEASES_STATES_STR.HOLD }
  const fillState = (stateIds, stateName) =>
    stateIds.forEach((id) => {
      states[id] = stateName
    })

  fillState(getStateIds(vnet, 'ERROR_VMS'), LEASES_STATES_STR.ERROR)
  fillState(getStateIds(vnet, 'OUTDATED_VMS'), LEASES_STATES_STR.OUTDATED)
  fillState(getStateIds(vnet, 'UPDATING_VMS'), LEASES_STATES_STR.UPDATING)
  fillState(getStateIds(vnet, 'UPDATED_VMS'), LEASES_STATES_STR.UPDATED)

  return states
}

const getLeaseResource = ({ VM: vmId, VNET: vnetId, VROUTER: vrId } = {}) => {
  if (+vmId >= 0) return { id: vmId, type: LEASE_TYPES.VM }
  if (+vnetId >= 0) return { id: vnetId, type: LEASE_TYPES.NET }
  if (+vrId >= 0) return { id: vrId, type: LEASE_TYPES.VR }

  return {}
}

const isHeldLease = (lease = {}) =>
  +lease?.VM === -1 || getLeaseResource(lease).id === undefined

const getLeaseStatusColor = (state, type) => {
  const leaseState =
    state ||
    (type === LEASE_TYPES.NET
      ? LEASES_STATES_STR.RESERVED
      : LEASES_STATES_STR.VROUTER)

  return {
    [LEASES_STATES_STR.ERROR]: 'error',
    [LEASES_STATES_STR.OUTDATED]: 'warning',
    [LEASES_STATES_STR.UPDATING]: 'information',
    [LEASES_STATES_STR.UPDATED]: 'success',
    [LEASES_STATES_STR.HOLD]: 'default',
    [LEASES_STATES_STR.RESERVED]: 'information',
    [LEASES_STATES_STR.VROUTER]: 'information',
  }[leaseState]
}

const getLeases = (vnet) =>
  [vnet?.AR_POOL?.AR ?? []]
    .flat()
    .flatMap(({ LEASES }) => [LEASES?.LEASE ?? []].flat())
    .filter(Boolean)

const fieldOrFallback = (value) => value || '-'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - Virtual Network leases tab
 */
export const Leases = ({ data, config }) => {
  const {
    vnet = {},
    handleRefresh,
    isLoadingVNet,
    isActionsDisabled,
    isLocked,
  } = data || {}

  // API
  const { enqueueError } = useGeneralApi()
  const [releaseLease, { isLoading: isReleasing }] =
    VnAPI.useReleaseLeaseMutation()
  const [holdLease, { isLoading: isHolding }] = VnAPI.useHoldLeaseMutation()
  const openHoldIPForm = useHoldIPFormModal()

  // State
  const actions = config?.actions ?? {}
  const canHoldLease = actions[HOLD_LEASE] === true
  const canReleaseLease = actions[RELEASE_LEASE] === true
  const areActionsDisabled =
    isActionsDisabled || isLocked || isReleasing || isHolding

  const leases = useMemo(() => getLeases(vnet), [vnet])
  const states = useMemo(() => getLeaseStates(vnet), [vnet])

  // Actions
  const handleRelease = async (lease) => {
    const addr = lease?.IP || lease?.MAC
    const addrName = getAddressType(addr)

    if (!addrName) return enqueueError(T.SomethingWrong)

    await releaseLease({
      id: vnet?.ID,
      template: `LEASES = [ ${addrName} = ${addr} ]`,
    }).unwrap()
    await handleRefresh?.()
  }

  const handleHold = async (template) => {
    await holdLease({
      id: vnet?.ID,
      template,
    }).unwrap()
    await handleRefresh?.()
  }

  // Modals
  const handleHoldForm = () =>
    openHoldIPForm({
      title: T.HoldIP,
      onSubmit: handleHold,
    })

  // Table
  const columns = [
    {
      id: 'resource',
      header: T.Resource,
      cell: ({ row }) => {
        const { id, type } = getLeaseResource(row.original)

        return isHeldLease(row.original) ? HOLD_LABEL : `${type}: ${id}`
      },
    },
    {
      id: 'state',
      header: T.State,
      cell: ({ row }) => {
        const { id, type } = getLeaseResource(row.original)
        const state = states[id]
        const leaseState = isHeldLease(row.original)
          ? LEASES_STATES_STR.HOLD
          : state ||
            (type === LEASE_TYPES.NET
              ? LEASES_STATES_STR.RESERVED
              : LEASES_STATES_STR.VROUTER)
        const { name } = getLeaseState(leaseState) ?? {}

        return (
          <StatusTag
            statusColor={getLeaseStatusColor(leaseState, type)}
            statusName={
              name ?? (leaseState === LEASES_STATES_STR.HOLD ? HOLD_LABEL : '-')
            }
          />
        )
      },
    },
    {
      accessorKey: 'IP',
      header: T.IP,
      cell: ({ row }) => fieldOrFallback(row.original?.IP),
    },
    {
      accessorKey: 'IP6',
      header: 'IP6',
      cell: ({ row }) => fieldOrFallback(row.original?.IP6),
    },
    {
      accessorKey: 'MAC',
      header: T.MAC,
      cell: ({ row }) => fieldOrFallback(row.original?.MAC),
    },
    {
      accessorKey: 'IP6_GLOBAL',
      header: 'IP6 GLOBAL',
      cell: ({ row }) => fieldOrFallback(row.original?.IP6_GLOBAL),
    },
    {
      accessorKey: 'IP6_LINK',
      header: 'IP6 LINK',
      cell: ({ row }) => fieldOrFallback(row.original?.IP6_LINK),
    },
    {
      accessorKey: 'IP6_ULA',
      header: 'IP6 ULA',
      cell: ({ row }) => fieldOrFallback(row.original?.IP6_ULA),
    },
    canReleaseLease && {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (!isHeldLease(row.original)) return null

        return (
          <Button
            type={STYLE_BUTTONS.TYPE.OUTLINE}
            size="small"
            onClick={() => handleRelease(row.original)}
            isDisabled={areActionsDisabled}
          >
            {T.ReleaseIp}
          </Button>
        )
      },
    },
  ].filter(Boolean)

  return (
    <Box display="flex" flexDirection="column" gap="1em">
      {canHoldLease && (
        <Box display="flex" justifyContent="flex-start">
          <Button
            type={STYLE_BUTTONS.TYPE.SECONDARY}
            size="small"
            onClick={handleHoldForm}
            isDisabled={areActionsDisabled}
          >
            {T.HoldIP}
          </Button>
        </Box>
      )}
      <TablePanel
        key="virtual-network-leases-table"
        columns={columns}
        data={leases}
        isLoading={isLoadingVNet}
      />
    </Box>
  )
}

Leases.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Leases.id = 'lease'
Leases.title = T.Leases
