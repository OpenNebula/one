/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  Lock,
  HardDrive,
  Cpu,
  Network,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'
import { Box, Stack, Typography, Tooltip } from '@mui/material'

import { useViews } from 'client/features/Auth'
import MultipleTags from 'client/components/MultipleTags'
import Timer from 'client/components/Timer'
import { MemoryIcon } from 'client/components/Icons'
import { StatusCircle, StatusChip } from 'client/components/Status'
import { Tr } from 'client/components/HOC'
import { rowStyles } from 'client/components/Tables/styles'

import { getState, getLastHistory, getIps } from 'client/models/VirtualMachine'
import {
  timeFromMilliseconds,
  getUniqueLabels,
  getErrorMessage,
  getColorFromString,
} from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T, VM, ACTIONS, RESOURCE_NAMES } from 'client/constants'

const VirtualMachineCard = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.vm - Virtual machine resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @param {ReactElement} [props.actions] - Actions
   * @returns {ReactElement} - Card
   */
  ({ vm, rootProps, actions, onDeleteLabel }) => {
    const classes = rowStyles()
    const { [RESOURCE_NAMES.VM]: vmView } = useViews()

    const enableEditLabels =
      vmView?.actions?.[ACTIONS.EDIT_LABELS] === true && !!onDeleteLabel

    const {
      ID,
      NAME,
      STIME,
      ETIME,
      LOCK,
      USER_TEMPLATE: { LABELS } = {},
      TEMPLATE: { CPU, MEMORY } = {},
    } = vm

    const { HOSTNAME = '--', VM_MAD: hypervisor } = useMemo(
      () => getLastHistory(vm) ?? '--',
      [vm.HISTORY_RECORDS]
    )

    const time = useMemo(
      () => timeFromMilliseconds(+ETIME || +STIME),
      [ETIME, STIME]
    )

    const { color: stateColor, name: stateName } = getState(vm)
    const error = useMemo(() => getErrorMessage(vm), [vm])
    const ips = useMemo(() => getIps(vm), [vm])
    const memValue = useMemo(() => prettyBytes(+MEMORY, 'MB'), [MEMORY])

    const labels = useMemo(
      () =>
        getUniqueLabels(LABELS).map((label) => ({
          text: label,
          stateColor: getColorFromString(label),
          onDelete: enableEditLabels && onDeleteLabel,
        })),
      [LABELS, enableEditLabels, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`vm-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateColor} tooltip={stateName} />
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
              <MultipleTags tags={labels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span data-cy="id">{`#${ID}`}</span>
            <span title={useMemo(() => time.toFormat('ff'), [ETIME, STIME])}>
              {`${+ETIME ? T.Done : T.Started} `}
              <Timer initial={time} />
            </span>
            <span title={`${Tr(T.PhysicalCpu)}: ${CPU}`}>
              <Cpu />
              <span data-cy="cpu">{CPU}</span>
            </span>
            <span title={`${Tr(T.Memory)}: ${memValue}`}>
              <MemoryIcon width={20} height={20} />
              <span data-cy="memory">{memValue}</span>
            </span>
            <span
              className={classes.captionItem}
              title={`${Tr(T.Hostname)}: ${HOSTNAME}`}
            >
              <HardDrive />
              <span data-cy="hostname">{HOSTNAME}</span>
            </span>
            {!!ips?.length && (
              <span className={classes.captionItem}>
                <Network />
                <Stack direction="row" justifyContent="end" alignItems="center">
                  <MultipleTags tags={ips} clipboard />
                </Stack>
              </span>
            )}
          </div>
        </div>
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
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
}

VirtualMachineCard.displayName = 'VirtualMachineCard'

export default VirtualMachineCard
