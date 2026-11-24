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
import { TEXT_VARIANTS, TEXT_WEIGHTS, T, STEP_STATUS } from '@ConstantsModule'
import { Text } from '@modules/components/primitives/Text/Default'
import { Component } from 'react'
import { useTranslation } from '@ProvidersModule'

const STEP_LABEL_STATUS_TRANSLATIONS = {
  [STEP_STATUS.IN_PROGRESS]: T.InProgress,
  [STEP_STATUS.COMPLETED]: T.Completed,
  [STEP_STATUS.REVIEWING]: T.Reviewing,
  [STEP_STATUS.ERROR]: T.HasErrors,
}

const STEP_LABEL_CLASS_BY_STATUS = {
  [STEP_STATUS.PENDING]: 'pending',
  [STEP_STATUS.IN_PROGRESS]: 'in-progress',
  [STEP_STATUS.COMPLETED]: 'completed',
  [STEP_STATUS.REVIEWING]: 'reviewing',
  [STEP_STATUS.ERROR]: 'error',
}

/**
 * Custom step label for OpenNebula.
 *
 * @param {object} props - Step label properties
 * @param {string} props.label - Label of the step
 * @param {string} props.status - Status of the step
 * @param {string} props.number - Number of the step
 * @param {string} props.icon - Icon defined for the step
 * @returns {Component} The component to use as step label
 */
export const StepLabel = ({ number, label, status, icon }) => {
  const { translate } = useTranslation()

  const statusLabel = STEP_LABEL_STATUS_TRANSLATIONS[status]
  const translatedNumber = `${translate(T.Step)} ${number}`
  const translatedStatus = statusLabel ? translate(statusLabel) : ''

  return (
    <Box className={`step-label ${STEP_LABEL_CLASS_BY_STATUS[status]}`}>
      {icon && (
        <Text
          className="number"
          value={translatedNumber}
          variant={TEXT_VARIANTS.CAPTION}
        />
      )}

      <Text
        className="title"
        value={label}
        weight={TEXT_WEIGHTS.MEDIUM}
        variant={TEXT_VARIANTS.BODY_SMALL}
      />

      {statusLabel && (
        <Text
          className="status"
          value={translatedStatus}
          weight={TEXT_WEIGHTS.MEDIUM}
          variant={TEXT_VARIANTS.CAPTION}
        />
      )}
    </Box>
  )
}

StepLabel.propTypes = {
  label: PropTypes.string.isRequired,
  status: PropTypes.string,
  number: PropTypes.number,
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
}
