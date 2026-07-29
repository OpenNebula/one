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
import { forwardRef } from 'react'
import {
  Stepper as MUIStepper,
  Step,
  StepLabel,
  StepConnector,
  Box,
} from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Stepper/Default/styles'
import { OpenNebulaStepIcon } from '@modules/componentsv2/primitives/Stepper/Default/stepIcon'
import { OpenNebulaStepLabel } from '@modules/componentsv2/primitives/Stepper/Default/stepLabel'
import { Tooltip } from '@modules/componentsv2/primitives/Tooltip'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

/**
 * Gets the error messages to display for a step.
 *
 * @param {object} errorData - Error object stored in react-hook-form for the step.
 * @returns {Array} List of individual messages, or the generic step message as fallback.
 */
const getStepErrorMessages = (errorData) => {
  const individualMessages = Array.isArray(errorData?.individualErrorMessages)
    ? errorData.individualErrorMessages.flat().filter(Boolean)
    : []

  return individualMessages.length > 0
    ? individualMessages
    : [errorData?.message].filter(Boolean)
}

/**
 * Converts an error message value into safe text that React can render.
 *
 * @param {string|number|Array|object} message - Message value. It can be raw text, a sprintf tuple, or an object with message data.
 * @param {Function} translate - Active locale translator.
 * @returns {string} Formatted message text.
 */
const renderErrorMessage = (message, translate) => {
  if (Array.isArray(message)) {
    return translate(message)
  }

  if (typeof message === 'string') {
    return translate(message)
  }

  if (typeof message === 'number') {
    return String(message)
  }

  if (message && typeof message === 'object') {
    if (message.word) {
      return translate(message)
    }

    if (message.message) {
      return renderErrorMessage(message.message, translate)
    }

    return Object.values(message)
      .map((value) => renderErrorMessage(value, translate))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

/**
 * Builds the tooltip content for the step error messages.
 *
 * @param {Array} messages - Step error messages to show in the tooltip.
 * @param {Function} translate - Active locale translator.
 * @returns {object} Tooltip content node.
 */
const getStepErrorTooltip = (messages, translate) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    {messages.map((message, index) => (
      <Box key={index}>{renderErrorMessage(message, translate)}</Box>
    ))}
  </Box>
)

/**
 * Custom Stepper for OpenNebula.
 *
 * @param {object} props - Step label properties
 * @param {string} props.steps - List of steps
 * @param {string} props.activeStep - Id of the active step
 * @returns {object} The component to use as stepper
 */
export const Stepper = forwardRef(
  (
    { steps = [], activeStep = 0, onClick, stepStatuses = {}, errors = {} },
    ref
  ) => {
    const { translate } = useTranslation()

    return (
      <>
        <MUIStepper
          ref={ref}
          connector={<StepConnector />}
          activeStep={activeStep}
          alternativeLabel
          nonLinear
          sx={(theme) => getStyles({ theme })}
        >
          {steps?.map(({ id, label, optional, icon: stepIcon }, stepIdx) => {
            // Get status of the step and errors
            const stepStatus = stepStatuses[id]
            const stepErrorMessages = getStepErrorMessages(errors[id])
            const hasStepErrors = stepErrorMessages.length > 0

            return (
              <Step key={id}>
                <Tooltip
                  title={
                    hasStepErrors
                      ? getStepErrorTooltip(stepErrorMessages, translate)
                      : ''
                  }
                  placement="bottom"
                >
                  <StepLabel
                    StepIconComponent={(props) => (
                      <OpenNebulaStepIcon
                        {...props}
                        stepIcon={stepIcon}
                        onClick={onClick}
                        stepIdx={stepIdx}
                        stepStatus={stepStatus}
                      />
                    )}
                  >
                    <OpenNebulaStepLabel
                      label={
                        optional
                          ? `${translate(label)} - ${translate(T.Optional)}`
                          : translate(label)
                      }
                      stepStatus={stepStatus}
                      stepNumber={stepIdx + 1}
                      stepIcon={stepIcon}
                    />
                  </StepLabel>
                </Tooltip>
              </Step>
            )
          })}
        </MUIStepper>
      </>
    )
  }
)

Stepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      optional: PropTypes.bool,
    })
  ),
  activeStep: PropTypes.number.isRequired,
  onClick: PropTypes.func,
  stepStatuses: PropTypes.object,
  errors: PropTypes.object,
}

Stepper.displayName = 'Stepper'
