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
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import {
  Group,
  Lock,
  LockKey,
  ModernTv,
  HardDrive,
  Network,
  BoxIso,
  Wrench,
} from 'iconoir-react'
import { Typography, Grid, Box, Tooltip } from '@mui/material'

import {
  LinearProgressWithTooltip,
  StatusCircle,
} from 'client/components/Status'
import { getState, getQuotaUsage } from 'client/models/User'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * UserCard component to display user details and quota usage.
 *
 * @param {object} props - Component props
 * @param {object} props.user - User details
 * @param {object} props.rootProps - Additional props for the root element
 * @returns {Component} UserCard component
 */
const UserCard = ({ user, rootProps }) => {
  const {
    ID,
    NAME,
    GNAME,
    IS_ADMIN_GROUP,
    ENABLED,
    AUTH_DRIVER,
    VM_QUOTA,
    DATASTORE_QUOTA,
    NETWORK_QUOTA,
    IMAGE_QUOTA,
  } = user

  const vmQuotaUsage = useMemo(() => getQuotaUsage('VM', VM_QUOTA), [VM_QUOTA])
  const datastoreQuotaUsage = useMemo(
    () => getQuotaUsage('DATASTORE', DATASTORE_QUOTA),
    [DATASTORE_QUOTA]
  )
  const networkQuotaUsage = useMemo(
    () => getQuotaUsage('NETWORK', NETWORK_QUOTA),
    [NETWORK_QUOTA]
  )
  const imageQuotaUsage = useMemo(
    () => getQuotaUsage('IMAGE', IMAGE_QUOTA),
    [IMAGE_QUOTA]
  )

  const { color: stateColor, name: stateName } = getState(user)

  return (
    <Box
      {...rootProps}
      data-cy={`user-${ID}`}
      display="flex"
      flexDirection="row"
      p={2}
      gap={2}
    >
      <Box
        width={250}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Box display="flex" alignItems="center">
          <StatusCircle color={stateColor} tooltip={stateName} />
          <Typography noWrap ml={1}>
            {NAME}
          </Typography>
          {IS_ADMIN_GROUP && (
            <Tooltip title={Tr(T.Admin)}>
              <Wrench ml={1} />
            </Tooltip>
          )}
          {!+ENABLED && (
            <Tooltip title="Locked">
              <Lock ml={1} />
            </Tooltip>
          )}
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          mt={2}
        >
          <Typography variant="caption">{`#${ID}`}</Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Tooltip title={`${Tr(T.Group)}: ${GNAME}`}>
              <Box display="flex" alignItems="center" mr={2}>
                <Group />
                <Typography variant="caption" ml={1}>
                  {GNAME}
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip title={`${Tr(T.AuthDriver)}: ${AUTH_DRIVER}`}>
              <Box display="flex" alignItems="center">
                <LockKey />
                <Typography
                  variant="caption"
                  ml={1}
                  data-cy={`auth-driver-${ID}`}
                >
                  {AUTH_DRIVER}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      <Box flexGrow={1} mt={1}>
        <Grid container spacing={3} alignItems="center" justifyContent="center">
          <Grid item xs={6}>
            <LinearProgressWithTooltip
              value={datastoreQuotaUsage.size.percentOfUsed}
              label={datastoreQuotaUsage.size.percentLabel}
              tooltipTitle={T.DatastoreSize}
              icon={<HardDrive />}
            />
            <LinearProgressWithTooltip
              value={vmQuotaUsage.vms.percentOfUsed}
              label={vmQuotaUsage.vms.percentLabel}
              tooltipTitle={T.VMCount}
              icon={<ModernTv />}
            />
          </Grid>
          <Grid item xs={6}>
            <LinearProgressWithTooltip
              value={networkQuotaUsage.leases.percentOfUsed}
              label={networkQuotaUsage.leases.percentLabel}
              tooltipTitle={T.NetworkLeases}
              icon={<Network />}
            />
            <LinearProgressWithTooltip
              value={imageQuotaUsage.rvms.percentOfUsed}
              label={imageQuotaUsage.rvms.percentLabel}
              tooltipTitle={T.ImageRVMS}
              icon={<BoxIso />}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

UserCard.propTypes = {
  user: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    GNAME: PropTypes.string.isRequired,
    IS_ADMIN_GROUP: PropTypes.bool,
    ENABLED: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    AUTH_DRIVER: PropTypes.string.isRequired,
    VM_QUOTA: PropTypes.oneOfType([
      PropTypes.any,
      PropTypes.arrayOf(PropTypes.any),
    ]),
    DATASTORE_QUOTA: PropTypes.oneOfType([
      PropTypes.any,
      PropTypes.arrayOf(PropTypes.any),
    ]),
    NETWORK_QUOTA: PropTypes.oneOfType([
      PropTypes.any,
      PropTypes.arrayOf(PropTypes.any),
    ]),
    IMAGE_QUOTA: PropTypes.oneOfType([
      PropTypes.any,
      PropTypes.arrayOf(PropTypes.any),
    ]),
  }).isRequired,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
}

UserCard.displayName = 'UserCard'

export default UserCard
