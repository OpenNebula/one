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
import { Component } from 'react'
import clsx from 'clsx'
import { Box } from '@mui/material'
import { Check } from 'iconoir-react'
import { renderIcon } from '@UtilsModule'
import { STEP_STATUS } from '@ConstantsModule'

const STEP_ICON_CLASS_BY_STATUS = {
  [STEP_STATUS.PENDING]: ({ stepIcon }) =>
    stepIcon && 'stepper-icon-pending-with-icon',
  [STEP_STATUS.IN_PROGRESS]: ({ stepIcon }) =>
    clsx('stepper-icon-active', stepIcon && 'stepper-icon-active-with-icon'),
  [STEP_STATUS.COMPLETED]: () => 'stepper-icon-completed',
  [STEP_STATUS.REVIEWING]: () => 'stepper-icon-reviewing',
  [STEP_STATUS.ERROR]: () => 'stepper-icon-hasErrors',
}

const getStepIconClassName = ({ stepStatus, stepIcon }) =>
  STEP_ICON_CLASS_BY_STATUS[stepStatus]?.({ stepIcon })

/**
 * Custom step icon for OpenNebula.
 *
 * @param {object} props - Step icon properties
 * @param {string} props.icon - Number of the step
 * @param {string} props.stepIcon - Icond defined for the step
 * @param {string} props.stepStatus - Status of the step
 * @param {number} props.stepIdx - Index of the step
 * @param {Function} props.onClick - Step click handler
 * @returns {Component} The component to use as step icon
 */
export const OpenNebulaStepIcon = ({
  icon,
  stepIdx,
  stepIcon,
  onClick,
  stepStatus,
}) => (
  <Box
    onClick={() => stepStatus !== STEP_STATUS.PENDING && onClick(stepIdx)}
    className={clsx(
      'stepper-icon',
      getStepIconClassName({ stepStatus, stepIcon }),
      stepStatus !== STEP_STATUS.PENDING && 'stepper-step-button-clickable'
    )}
  >
    {stepIcon
      ? renderIcon(stepStatus === STEP_STATUS.COMPLETED ? <Check /> : stepIcon)
      : icon}
  </Box>
)

OpenNebulaStepIcon.propTypes = {
  icon: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.node,
  ]),
  stepIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  stepIdx: PropTypes.number,
  onClick: PropTypes.func,
  stepStatus: PropTypes.string,
}
