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
import { Group, ModernTv, HardDrive, Network, BoxIso } from 'iconoir-react'
import { Typography, Grid, Box, Tooltip } from '@mui/material'

import { LinearProgressWithTooltip } from 'client/components/Status'
import { getQuotaUsage } from 'client/models/Group'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * UserCard component to display user details and quota usage.
 *
 * @param {object} props - Component props
 * @param {object} props.group - Group details
 * @param {object} props.rootProps - Additional props for the root element
 * @returns {Component} UserCard component
 */
const GroupCard = ({ group, rootProps }) => {
  const {
    ID,
    NAME,
    TOTAL_USERS,
    VM_QUOTA,
    DATASTORE_QUOTA,
    NETWORK_QUOTA,
    IMAGE_QUOTA,
  } = group

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

  return (
    <Box
      {...rootProps}
      data-cy={`group-${ID}`}
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
          <Typography noWrap>{NAME}</Typography>
        </Box>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          mt={2}
        >
          <Typography variant="caption">{`#${ID}`}</Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Tooltip title={Tr([T['groups.users.total'], TOTAL_USERS])}>
              <Box display="flex" alignItems="center" mr={2}>
                <Group />
                <Typography variant="caption" ml={1}>
                  {TOTAL_USERS}
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
              tooltipTitle="Datastore Size"
              icon={<HardDrive />}
            />
            <LinearProgressWithTooltip
              value={vmQuotaUsage.vms.percentOfUsed}
              label={vmQuotaUsage.vms.percentLabel}
              tooltipTitle="VM Count"
              icon={<ModernTv />}
            />
          </Grid>
          <Grid item xs={6}>
            <LinearProgressWithTooltip
              value={networkQuotaUsage.leases.percentOfUsed}
              label={networkQuotaUsage.leases.percentLabel}
              tooltipTitle="Network Leases"
              icon={<Network />}
            />
            <LinearProgressWithTooltip
              value={imageQuotaUsage.rvms.percentOfUsed}
              label={imageQuotaUsage.rvms.percentLabel}
              tooltipTitle="Image RVMS"
              icon={<BoxIso />}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

GroupCard.propTypes = {
  group: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TOTAL_USERS: PropTypes.number.isRequired,
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

GroupCard.displayName = 'GroupCard'

export default GroupCard
