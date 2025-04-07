/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Box, Stack, Tooltip, Typography, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { getResourceLabels, prettyBytes } from '@UtilsModule'
import { ReactElement, memo, useMemo } from 'react'

import {
  Cpu,
  Group,
  HardDrive,
  Internet as HostnameIcon,
  Lock,
  Network,
  User,
  WarningCircledOutline as WarningIcon,
} from 'iconoir-react'

import { RESOURCE_NAMES, T, VM } from '@ConstantsModule'
import { useAuth } from '@FeaturesModule'
import {
  getColorFromString,
  getErrorMessage,
  getIps,
  getLastHistory,
  getVirtualMachineState,
  timeFromMilliseconds,
} from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import { MemoryIcon } from '@modules/components/Icons'
import MultipleTags from '@modules/components/MultipleTagsCard'
import { StatusChip, StatusCircle } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import Timer from '@modules/components/Timer'
import clsx from 'clsx'

const VirtualMachineCard = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.vm - Virtual machine resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @param {ReactElement} [props.actions] - Actions
   * @param {object[]} [props.globalErrors] - Errors globals
   * @returns {ReactElement} - Card
   */
  ({ vm, rootProps, actions, onClickLabel, globalErrors = [] }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { labels } = useAuth()
    const LABELS = getResourceLabels(labels, vm?.ID, RESOURCE_NAMES.VM)

    const {
      ID,
      NAME,
      STIME,
      ETIME,
      LOCK,
      GNAME,
      UNAME,
      TEMPLATE: { VCPU = '-', MEMORY, CONTEXT = {} } = {},
    } = vm

    const { HOSTNAME = '--', VM_MAD: hypervisor } = useMemo(
      () => getLastHistory(vm) ?? '--',
      [vm.HISTORY_RECORDS]
    )

    const { SET_HOSTNAME: VM_HOSTNAME = '' } = CONTEXT

    const [time, timeFormat] = useMemo(() => {
      const fromMill = timeFromMilliseconds(+ETIME || +STIME)

      return [fromMill, fromMill.toFormat('ff')]
    }, [ETIME, STIME])

    const {
      color: stateColor,
      name: stateName,
      displayName: stateDisplayName,
    } = getVirtualMachineState(vm)

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

    const userLabels = useMemo(
      () =>
        LABELS?.user?.map((label) => ({
          text: label?.replace(/\$/g, ''),
          dataCy: `label-${label}`,
          stateColor: getColorFromString(label),
          onClick: onClickLabel,
        })) || [],
      [LABELS, onClickLabel]
    )

    const groupLabels = useMemo(
      () =>
        Object.entries(LABELS?.group || {}).flatMap(([group, gLabels]) =>
          gLabels.map((gLabel) => ({
            text: gLabel?.replace(/\$/g, ''),
            dataCy: `group-label-${group}-${gLabel}`,
            stateColor: getColorFromString(gLabel),
            onClick: onClickLabel,
          }))
        ),
      [LABELS, onClickLabel]
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

              <MultipleTags limitTags={1} tags={userLabels} />
              <MultipleTags limitTags={1} tags={groupLabels} />
            </span>
          </div>
          <div className={classes.vmActionLayout}>
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
              <span title={`${Tr(T.Host)}: ${HOSTNAME}`}>
                <HardDrive />
                <span data-cy="hostname">{HOSTNAME}</span>
              </span>
              {!!VM_HOSTNAME && (
                <span title={`${Tr(T.Hostname)}: ${VM_HOSTNAME}`}>
                  <HostnameIcon />
                  <span>{` ${VM_HOSTNAME}`}</span>
                </span>
              )}
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
                  <Stack
                    direction="row"
                    justifyContent="end"
                    alignItems="center"
                  >
                    <MultipleTags tags={ips} clipboard limitTags={2} />
                  </Stack>
                </span>
              )}
            </div>
            {actions && (
              <div className={clsx(classes.actions, classes.vmActions)}>
                {actions}
              </div>
            )}
          </div>
        </div>
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
