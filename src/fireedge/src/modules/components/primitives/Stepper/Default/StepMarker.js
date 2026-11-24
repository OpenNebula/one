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
  [STEP_STATUS.PENDING]: 'pending',
  [STEP_STATUS.IN_PROGRESS]: 'in-progress',
  [STEP_STATUS.COMPLETED]: 'completed',
  [STEP_STATUS.REVIEWING]: 'reviewing',
  [STEP_STATUS.ERROR]: 'error',
}

const getStatusClassName = (status) => STEP_ICON_CLASS_BY_STATUS[status]

/**
 * Custom step icon for Stepper component.
 *
 * @param {object} props - Step icon properties
 * @param {string} props.number - Number of the step
 * @param {string} props.icon - Icond defined for the step
 * @param {string} props.status - Status of the step
 * @param {boolean} props.active - Whether the step is active or not
 * @param {string} props.dataCy - Cypress selector
 * @returns {Component} The component to use as step icon
 */
export const StepMarker = ({ number, icon, status, active, dataCy }) => {
  const finalIcon = status === STEP_STATUS.COMPLETED ? <Check /> : icon

  return (
    <Box
      data-cy={dataCy}
      className={clsx(
        'step-marker',
        icon && 'has-icon',
        active && 'active',
        getStatusClassName(status)
      )}
    >
      {icon ? renderIcon(finalIcon) : number}
    </Box>
  )
}

StepMarker.propTypes = {
  number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  status: PropTypes.string,
  active: PropTypes.bool,
  dataCy: PropTypes.string,
}
