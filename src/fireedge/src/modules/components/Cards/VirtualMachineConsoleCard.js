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
import { Box, Tooltip, Typography, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'

import { WarningCircle as WarningIcon } from 'iconoir-react'

import { T, VM } from '@ConstantsModule'
import {
  getErrorMessage,
  getVirtualMachineState,
  timeFromMilliseconds,
} from '@ModelsModule'
import { Tr } from '@modules/components/HOC'
import { StatusCircle } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import Timer from '@modules/components/Timer'
import clsx from 'clsx'

const VirtualMachineConsoleCard = memo(
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

    const { ID, NAME, STIME, ETIME } = vm

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
          </div>
          <div className={classes.vmActionLayout}>
            <div className={classes.caption}>
              <span data-cy="id">{`#${ID}`}</span>
              <span title={timeFormat}>
                {`${+ETIME ? Tr(T.Done) : Tr(T.Started)} `}
                <Timer initial={time} />
              </span>
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

VirtualMachineConsoleCard.propTypes = {
  vm: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
  globalErrors: PropTypes.array,
}

VirtualMachineConsoleCard.displayName = 'VirtualMachineConsoleCard'

export default VirtualMachineConsoleCard
