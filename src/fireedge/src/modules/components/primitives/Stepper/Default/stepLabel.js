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
import { Box } from '@mui/material'
import clsx from 'clsx'
import { Component } from 'react'
import { T, STEP_STATUS } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

/**
 * Get the corresponding label for a step status.
 *
 * @param {string} status - The status constant
 * @returns {string} The label
 */
const getStepStatusLabel = (status) => {
  switch (status) {
    case STEP_STATUS.PENDING:
      return undefined
    case STEP_STATUS.IN_PROGRESS:
      return T.InProgress
    case STEP_STATUS.COMPLETED:
      return T.Completed
    case STEP_STATUS.REVIEWING:
      return T.Reviewing
    case STEP_STATUS.ERROR:
      return T.HasErrors
    default:
      return undefined
  }
}

const STATUS_MAP_LABEL = {
  [STEP_STATUS.IN_PROGRESS]: 'stepper-label-status-active',
  [STEP_STATUS.COMPLETED]: 'stepper-label-status-completed',
  [STEP_STATUS.REVIEWING]: 'stepper-label-status-reviewing',
  [STEP_STATUS.ERROR]: 'stepper-label-status-error',
}

const STATUS_MAP_TITLE = {
  [STEP_STATUS.PENDING]: 'stepper-label-title-pending',
  [STEP_STATUS.IN_PROGRESS]: 'stepper-label-title-active',
  [STEP_STATUS.COMPLETED]: 'stepper-label-title-completed',
  [STEP_STATUS.REVIEWING]: 'stepper-label-title-reviewing',
  [STEP_STATUS.ERROR]: 'stepper-label-title-error',
}

/**
 * Custom step label for OpenNebula.
 *
 * @param {object} props - Step label properties
 * @param {string} props.label - Label of the step
 * @param {string} props.stepStatus - Status of the step
 * @param {string} props.stepNumber - Number of the step
 * @param {string} props.stepIcon - Icon defined for the step
 * @returns {Component} The component to use as step label
 */
export const OpenNebulaStepLabel = ({
  label,
  stepStatus,
  stepNumber,
  stepIcon,
}) => {
  const { translate } = useTranslation()
  const statusLabel = getStepStatusLabel(stepStatus)

  return (
    <Box className="stepper-label">
      {stepIcon && (
        <Box className="stepper-label-step">
          {`${translate(T.Label)} ${stepNumber}`}
        </Box>
      )}

      <Box
        className={clsx('stepper-label-title', STATUS_MAP_TITLE[stepStatus])}
      >
        {label}
      </Box>

      {statusLabel && (
        <Box
          className={clsx('stepper-label-status', STATUS_MAP_LABEL[stepStatus])}
        >
          {translate(statusLabel)}
        </Box>
      )}
    </Box>
  )
}

OpenNebulaStepLabel.propTypes = {
  label: PropTypes.string.isRequired,
  stepStatus: PropTypes.string,
  stepNumber: PropTypes.number,
  stepIcon: PropTypes.object,
}
