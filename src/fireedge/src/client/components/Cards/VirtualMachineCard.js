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
import { ReactElement, memo, useMemo } from 'react'

import { Box, Stack, Tooltip, Typography } from '@mui/material'
import {
  Cpu,
  Group,
  HardDrive,
  Lock,
  Network,
  User,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'

import { Tr } from 'client/components/HOC'
import { MemoryIcon } from 'client/components/Icons'
import MultipleTags from 'client/components/MultipleTags'
import { StatusChip, StatusCircle } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import Timer from 'client/components/Timer'
import { useAuth, useViews } from 'client/features/Auth'

import { ACTIONS, RESOURCE_NAMES, T, VM } from 'client/constants'
import {
  getColorFromString,
  getErrorMessage,
  getUniqueLabels,
  timeFromMilliseconds,
} from 'client/models/Helper'
import { getIps, getLastHistory, getState } from 'client/models/VirtualMachine'
import { prettyBytes } from 'client/utils'

const VirtualMachineCard = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.vm - Virtual machine resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @param {ReactElement} [props.actions] - Actions
   * @param {object[]} [props.globalErrors] - Errors globals
   * @returns {ReactElement} - Card
   */
  ({
    vm,
    rootProps,
    actions,
    onClickLabel,
    onDeleteLabel,
    globalErrors = [],
  }) => {
    const classes = rowStyles()
    const { [RESOURCE_NAMES.VM]: vmView } = useViews()
    const { labels: userLabels } = useAuth()

    const enableEditLabels =
      vmView?.actions?.[ACTIONS.EDIT_LABELS] === true && !!onDeleteLabel

    const {
      ID,
      NAME,
      STIME,
      ETIME,
      LOCK,
      USER_TEMPLATE: { LABELS } = {},
      GNAME,
      UNAME,
      TEMPLATE: { VCPU = '-', MEMORY } = {},
    } = vm

    const { HOSTNAME = '--', VM_MAD: hypervisor } = useMemo(
      () => getLastHistory(vm) ?? '--',
      [vm.HISTORY_RECORDS]
    )

    const [time, timeFormat] = useMemo(() => {
      const fromMill = timeFromMilliseconds(+ETIME || +STIME)

      return [fromMill, fromMill.toFormat('ff')]
    }, [ETIME, STIME])

    const {
      color: stateColor,
      name: stateName,
      displayName: stateDisplayName,
    } = getState(vm)

    const errorRows = globalErrors.filter(
      (errorRow) => errorRow?.rows?.length && errorRow?.rows?.includes(ID)
    )
    const IconsError = () => (
      <>
        {errorRows.map((value, index) => (
          <Tooltip
            arrow
            placement="bottom"
            key={`icon-${ID}-${index}`}
            title={
              <Typography variant="subtitle2">
                {value?.message || ''}
              </Typography>
            }
          >
            <Box color={`${value?.type || 'error'}.main`} component="span">
              {value?.icon || ''}
            </Box>
          </Tooltip>
        ))}
      </>
    )

    const error = useMemo(() => getErrorMessage(vm), [vm])
    const ips = useMemo(() => getIps(vm), [vm])
    const memValue = useMemo(() => prettyBytes(+MEMORY, 'MB', 2), [MEMORY])

    const labels = useMemo(
      () =>
        getUniqueLabels(LABELS).reduce((acc, label) => {
          if (userLabels?.includes(label)) {
            acc.push({
              text: label,
              dataCy: `label-${label}`,
              stateColor: getColorFromString(label),
              onClick: onClickLabel,
              onDelete: enableEditLabels && onDeleteLabel,
            })
          }

          return acc
        }, []),

      [LABELS, enableEditLabels, onClickLabel, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`vm-${ID}`}>
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle
              color={stateColor}
              tooltip={stateDisplayName ?? stateName}
            />
            <Typography noWrap component="span">
              {NAME}
            </Typography>
            <IconsError />
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
            <span title={timeFormat}>
              {`${+ETIME ? Tr(T.Done) : Tr(T.Started)} `}
              <Timer initial={time} />
            </span>
            <span title={`${Tr(T.VirtualCpu)}: ${VCPU}`}>
              <Cpu />
              <span data-cy="vcpu">{VCPU}</span>
            </span>
            <span title={`${Tr(T.Memory)}: ${memValue}`}>
              <MemoryIcon width={20} height={20} />
              <span data-cy="memory">{memValue}</span>
            </span>
            <span title={`${Tr(T.Hostname)}: ${HOSTNAME}`}>
              <HardDrive />
              <span data-cy="hostname">{HOSTNAME}</span>
            </span>
            {!!UNAME && (
              <span title={`${Tr(T.Owner)}: ${UNAME}`}>
                <User />
                <span>{` ${UNAME}`}</span>
              </span>
            )}
            {!!GNAME && (
              <span title={`${Tr(T.Group)}: ${GNAME}`}>
                <Group />
                <span>{` ${GNAME}`}</span>
              </span>
            )}
            {!!ips?.length && (
              <span title={`${Tr(T.IP)}`}>
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
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
  globalErrors: PropTypes.array,
}

VirtualMachineCard.displayName = 'VirtualMachineCard'

export default VirtualMachineCard
