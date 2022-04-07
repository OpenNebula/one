/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, memo } from 'react'
import PropTypes from 'prop-types'

import {
  User,
  Group,
  Lock,
  HardDrive,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'
import { Box, Stack, Typography, Tooltip } from '@mui/material'

import Timer from 'client/components/Timer'
import MultipleTags from 'client/components/MultipleTags'
import { StatusCircle, StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import {
  getState,
  getLastHistory,
  getHypervisor,
  getErrorMessage,
} from 'client/models/VirtualMachine'
import { timeFromMilliseconds } from 'client/models/Helper'
import { VM } from 'client/constants'

const VirtualMachineCard = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.vm - Virtual machine resource
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} [props.actions] - Actions
   * @returns {ReactElement} - Card
   */
  ({ vm, rootProps, actions }) => {
    const classes = rowStyles()
    const { ID, NAME, UNAME, GNAME, IPS, STIME, ETIME, LOCK } = vm

    const HOSTNAME = getLastHistory(vm)?.HOSTNAME ?? '--'
    const hypervisor = getHypervisor(vm)
    const time = timeFromMilliseconds(+ETIME || +STIME)
    const error = getErrorMessage(vm)

    const { color: stateColor, name: stateName } = getState(vm)

    return (
      <div {...rootProps} data-cy={`vm-${ID}`}>
        <div>
          <StatusCircle color={stateColor} tooltip={stateName} />
        </div>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span">
              {NAME}
            </Typography>
            {error && (
              <Tooltip
                arrow
                placement="bottom"
                title={<Typography variant="subtitle2">{error}</Typography>}
              >
                <Box color="error.dark" component="span">
                  <WarningIcon />
                </Box>
              </Tooltip>
            )}
            <span className={classes.labels}>
              {hypervisor && <StatusChip text={hypervisor} />}
              {LOCK && <Lock data-cy="lock" />}
            </span>
          </div>
          <div className={classes.caption}>
            <span title={time.toFormat('ff')}>
              {`#${ID} ${+ETIME ? 'done' : 'started'} `}
              <Timer initial={time} />
            </span>
            <span title={`Owner: ${UNAME}`}>
              <User />
              <span data-cy="uname">{` ${UNAME}`}</span>
            </span>
            <span title={`Group: ${GNAME}`}>
              <Group />
              <span data-cy="gname">{` ${GNAME}`}</span>
            </span>
            <span title={`Hostname: ${HOSTNAME}`}>
              <HardDrive />
              <span data-cy="hostname">{` ${HOSTNAME}`}</span>
            </span>
          </div>
        </div>
        {!!IPS?.length && (
          <div className={classes.secondary}>
            <Stack flexWrap="wrap" justifyContent="end" alignItems="center">
              <MultipleTags tags={IPS.split(',')} />
            </Stack>
          </div>
        )}
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

VirtualMachineCard.propTypes = {
  vm: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  actions: PropTypes.any,
}

VirtualMachineCard.displayName = 'VirtualMachineCard'

export default VirtualMachineCard
