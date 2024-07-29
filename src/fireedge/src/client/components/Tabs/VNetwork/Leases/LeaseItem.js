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
import { ReactElement, memo, Fragment } from 'react'
import PropTypes from 'prop-types'
import ReleaseIcon from 'iconoir-react/dist/PlayOutline'
import { Link as RouterLink, generatePath } from 'react-router-dom'
import { Stack, Link, Typography } from '@mui/material'

import { useReleaseLeaseMutation } from 'client/features/OneApi/network'

import { SubmitButton } from 'client/components/FormControl'
import { StatusCircle, StatusChip } from 'client/components/Status'

import { getAddressType, getLeaseState } from 'client/models/VirtualNetwork'
import { T, VN_ACTIONS, ARLease, LEASES_STATES_STR } from 'client/constants'
import { PATH } from 'client/apps/sunstone/routesOne'

const LEASE_TYPES = { VM: 'vm', NET: 'net', VR: 'vr' }

const LeaseStatus = ({ state, type }) => {
  const { name: stateName, color: stateColor } = getLeaseState(
    state ||
      (type === LEASE_TYPES.NET
        ? LEASES_STATES_STR.RESERVED
        : LEASES_STATES_STR.VROUTER)
  )

  return (
    <Stack direction="row" alignItems="center" gap={1} width="max-content">
      <StatusCircle color={stateColor} />
      <StatusChip dataCy="state" text={stateName} stateColor={stateColor} />
    </Stack>
  )
}
LeaseStatus.propTypes = {
  state: PropTypes.string,
  type: PropTypes.oneOf(Object.values(LEASE_TYPES)),
}

/**
 * Renders the name of lease.
 *
 * @param {object} props - Props
 * @param {string} props.id - Resource id
 * @param {'vm'|'net'|'vr'} props.type - Resource type: VM, VNET or VR
 * @returns {ReactElement} Lease column name
 */
const LeaseName = ({ id, type }) => {
  const path = {
    [LEASE_TYPES.VM]: PATH.INSTANCE.VMS.DETAIL,
    [LEASE_TYPES.NET]: PATH.NETWORK.VNETS.DETAIL,
    [LEASE_TYPES.VR]: PATH.INSTANCE.VROUTERS.LIST,
  }[type]

  return (
    <Link
      noWrap
      data-cy="name"
      variant="subtitle2"
      color="secondary"
      component={RouterLink}
      title={`${type.toUpperCase()} ${id}`}
      to={generatePath(path, { id })}
      sx={{
        gap: '1.5em',
        minHeight: '31px', // same as release button
        '& > svg': { mr: '1em' },
      }}
    >
      {`${type.toUpperCase()}: ${id}`}
    </Link>
  )
}

LeaseName.propTypes = {
  id: PropTypes.string,
  type: PropTypes.oneOf(Object.values(LEASE_TYPES)),
}

const LeaseItem = memo(
  /**
   * @param {object} props - Props
   * @param {string} props.id - Virtual Network id
   * @param {object} props.actions - Actions tab
   * @param {ARLease} props.lease - Lease to render
   * @param {string} props.state - States
   * @param {Function} props.resetHoldState - Reset hold state mutation
   * @returns {ReactElement} Lease component
   */
  ({ id, actions, lease, state, resetHoldState }) => {
    const [releaseLease, { isLoading: isReleasing }] = useReleaseLeaseMutation()

    /** @type {ARLease} */
    const {
      IP,
      MAC,
      addr = IP || MAC,
      IP6,
      IP6_GLOBAL,
      IP6_LINK,
      IP6_ULA,
      VM: vmId,
      VNET: vnetId,
      VROUTER: vrId,
    } = lease

    const release = async () => {
      const template = `LEASES = [ ${getAddressType(addr)} = ${addr} ]`
      await releaseLease({ id, template }).unwrap()
      await resetHoldState()
    }

    const resType =
      vmId >= 0
        ? LEASE_TYPES.VM
        : vnetId >= 0
        ? LEASE_TYPES.NET
        : LEASE_TYPES.VR

    const resId = {
      [LEASE_TYPES.VM]: vmId,
      [LEASE_TYPES.NET]: vnetId,
      [LEASE_TYPES.VR]: vrId,
    }[resType]

    return (
      <Fragment key={addr}>
        {+vmId === -1 ? (
          actions[VN_ACTIONS.RELEASE_LEASE] && (
            <SubmitButton
              isSubmitting={isReleasing}
              onClick={release}
              variant="text"
              startIcon={<ReleaseIcon />}
              label={T.ReleaseIp}
            />
          )
        ) : (
          <LeaseName id={resId} type={resType} />
        )}
        <LeaseStatus state={state} type={resType} />
        {[
          { text: IP, dataCy: 'ip' },
          { text: IP6, dataCy: 'ip6' },
          { text: MAC, dataCy: 'mac' },
          { text: IP6_GLOBAL, dataCy: 'ip6-global' },
          { text: IP6_LINK, dataCy: 'ip6-link' },
          { text: IP6_ULA, dataCy: 'ip6-ula' },
        ].map(({ text = '--', dataCy }) => (
          <Typography
            noWrap
            key={`${addr}-${dataCy}`}
            data-cy={`${addr}-${dataCy}`.toLowerCase()}
            variant="subtitle2"
            title={typeof text === 'string' ? text : undefined}
            display={{
              xs: ['ip', 'mac'].includes(dataCy) ? 'block' : 'none',
              sm: ['ip', 'ip6', 'mac'].includes(dataCy) ? 'block' : 'none',
              md: 'block',
            }}
          >
            {text}
          </Typography>
        ))}
      </Fragment>
    )
  }
)

LeaseItem.propTypes = {
  lease: PropTypes.object,
  actions: PropTypes.object,
  id: PropTypes.string,
  state: PropTypes.string,
  resetHoldState: PropTypes.func,
}

LeaseItem.displayName = 'LeaseItem'

export default LeaseItem
