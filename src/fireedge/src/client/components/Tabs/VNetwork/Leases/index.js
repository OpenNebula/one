/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, TextField, Skeleton } from '@mui/material'

import {
  useGetVNetworkQuery,
  useHoldLeaseMutation,
} from 'client/features/OneApi/network'

import { SubmitButton } from 'client/components/FormControl'
import { Translate } from 'client/components/HOC'
import LeaseItem from 'client/components/Tabs/VNetwork/Leases/LeaseItem'

import { getAddressType } from 'client/models/VirtualNetwork'
import {
  T,
  AddressRange,
  VN_ACTIONS,
  LEASES_STATES_STR,
} from 'client/constants'
import { useGeneralApi } from 'client/features/General'

const LEASES_COLUMNS = [
  T.Resource,
  T.State,
  'IP',
  'IP6',
  'MAC',
  'IP6 GLOBAL',
  'IP6 LINK',
  'IP6 ULA',
]

const flatStates = (vnet, nameState = '') => {
  const vnets = vnet?.[nameState]?.ID

  return [vnets ? (Array.isArray(vnets) ? vnets : [vnets]) : []].flat()
}

const fillState = (state, id, stateName) => (state[id] = stateName)

/**
 * Renders the list of total leases from a Virtual Network.
 *
 * @param {object} props - Props
 * @param {object} props.tabProps - Tab information
 * @param {string[]} props.tabProps.actions - Actions tab
 * @param {string} props.id - Virtual Network id
 * @returns {ReactElement} AR tab
 */
const LeasesTab = ({ tabProps: { actions } = {}, id }) => {
  const { data: vnet } = useGetVNetworkQuery({ id })
  const { enqueueError } = useGeneralApi()
  const states = {
    '-1': LEASES_STATES_STR.HOLD,
  }

  const [holdLease, { isLoading, isSuccess, reset, originalArgs }] =
    useHoldLeaseMutation()

  const errorVms = flatStates(vnet, 'ERROR_VMS')
  const outdatedVms = flatStates(vnet, 'OUTDATED_VMS')
  const updatingVms = flatStates(vnet, 'UPDATING_VMS')
  const updatedVms = flatStates(vnet, 'UPDATED_VMS')

  errorVms.forEach((idVm) => fillState(states, idVm, LEASES_STATES_STR.ERROR))
  outdatedVms.forEach((idVm) =>
    fillState(states, idVm, LEASES_STATES_STR.OUTDATED)
  )
  updatingVms.forEach((idVm) =>
    fillState(states, idVm, LEASES_STATES_STR.UPDATING)
  )
  updatedVms.forEach((idVm) =>
    fillState(states, idVm, LEASES_STATES_STR.UPDATED)
  )

  /** @type {AddressRange[]} */
  const addressRanges = [vnet.AR_POOL.AR ?? []].flat()
  const leases = addressRanges.map(({ LEASES }) => LEASES.LEASE ?? []).flat()

  const isHolding =
    isLoading ||
    (isSuccess &&
      !leases.some(
        (l) =>
          originalArgs?.template.includes(l.IP) ||
          originalArgs?.template.includes(l.IP6) ||
          originalArgs?.template.includes(l.MAC)
      ))

  const hold = async (event) => {
    try {
      event.preventDefault()
      const { addr } = Object.fromEntries(new FormData(event.target))
      const addrName = getAddressType(addr)

      if (!addrName) return enqueueError(T.SomethingWrong)

      const leasesToHold = `LEASES = [ ${addrName} = ${addr} ]`
      await holdLease({ id, template: leasesToHold }).unwrap()
    } catch {}
  }

  return (
    <Box padding={{ sm: '0.8em', overflow: 'auto' }}>
      {actions[VN_ACTIONS.HOLD_LEASE] === true && (
        <Box
          component="form"
          onSubmit={hold}
          display="inline-flex"
          gap="1em"
          alignItems="center"
        >
          <TextField
            name="addr"
            inputProps={{ 'data-cy': 'addr' }}
            sx={{ '& input': { paddingBlock: '6px' } }}
            placeholder={'10.0.0.4'}
          />
          <SubmitButton
            type="submit"
            isSubmitting={isHolding}
            color="secondary"
            variant="outlined"
            label={T.HoldIP}
          />
        </Box>
      )}

      <Box
        component="section"
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(3, 1fr)',
          sm: 'repeat(4, 1fr)',
          md: 'repeat(8, 1fr)',
        }}
        alignItems="center"
        gap="0.25em"
        py="0.8em"
        sx={{
          '& > span': {
            // header styles
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            marginLeft: '-8px',
            paddingLeft: '8px',
            alignSelf: 'end',
          },
        }}
      >
        {LEASES_COLUMNS.map((col, index) => (
          <Typography
            key={col}
            noWrap
            component="span"
            variant="body1"
            display={{
              xs: ['NAME', 'IP', 'MAC'].includes(col) ? 'block' : 'none',
              sm: ['NAME', 'IP', 'IP6', 'MAC'].includes(col) ? 'block' : 'none',
              md: 'block',
            }}
          >
            <Translate word={col} />
          </Typography>
        ))}
        {leases.map((lease) => (
          <LeaseItem
            key={lease?.IP || lease?.MAC}
            lease={lease}
            actions={actions}
            id={id}
            state={states[lease?.VM || lease?.VNET || lease?.VROUTE]}
            resetHoldState={reset}
          />
        ))}
      </Box>
      {isHolding && <Skeleton variant="rectangular" />}
    </Box>
  )
}

LeasesTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

LeasesTab.displayName = 'LeasesTab'

export default LeasesTab
