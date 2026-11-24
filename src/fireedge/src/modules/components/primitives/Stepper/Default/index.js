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
import { forwardRef, useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { Wrapper } from '@modules/components/primitives/Wrapper/Default'
import { getStyles } from '@modules/components/primitives/Stepper/Default/styles'
import { StepMarker } from '@modules/components/primitives/Stepper/Default/StepMarker'
import { StepLabel } from '@modules/components/primitives/Stepper/Default/StepLabel'
import { Tooltip } from '@modules/components/primitives/Tooltip'
import { T, STEP_STATUS } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

const COMPACT_STEP_THRESHOLD = 6

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
 * @param {object} props - Stepper properties
 * @param {Array} props.steps - List of steps
 * @param {number} props.activeStep - Index of the active step
 * @param {Function} props.onClick - Step click handler
 * @param {object} props.stepStatuses - Status indexed by step id
 * @param {object} props.errors - Errors indexed by step id
 * @param {string} props.orientation - Stepper orientation
 * @param {'vertical'|'horizontal'} props.direction - Stepper direction
 * @returns {object} The component to use as stepper
 */
export const Stepper = forwardRef(
  (
    {
      steps = [],
      activeStep = 0,
      onClick,
      stepStatuses = {},
      errors = {},
      direction = 'vertical',
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const listRef = useRef(null)
    const isCompact = steps.length > COMPACT_STEP_THRESHOLD

    useEffect(() => {
      const list = listRef.current
      if (direction !== 'vertical' || !list) return

      const showActiveStep = () => {
        const currentStep = list.children[activeStep]
        if (!currentStep) return

        const stepTop = currentStep.offsetTop
        const stepBottom = stepTop + currentStep.offsetHeight

        if (stepTop < list.scrollTop) {
          list.scrollTop = stepTop
        } else if (stepBottom > list.scrollTop + list.clientHeight) {
          list.scrollTop = Math.min(stepTop, stepBottom - list.clientHeight)
        }
      }

      showActiveStep()

      const observer = new ResizeObserver(showActiveStep)
      observer.observe(list)
      Array.from(list.children).forEach((step) => observer.observe(step))

      return () => observer.disconnect()
    }, [activeStep, direction, steps])

    return (
      <Box
        ref={ref}
        className="stepper"
        sx={(theme) => getStyles({ theme, direction, isCompact })}
      >
        <Box component="ol" ref={listRef} tabIndex={0} className="stepper-list">
          {steps.map(({ id, label, optional, icon }, index) => {
            const status = stepStatuses[id]
            const stepErrorMessages = getStepErrorMessages(errors[id])
            const hasStepErrors = stepErrorMessages.length > 0
            const isPending = status === STEP_STATUS.PENDING
            const isActive = index === activeStep
            const number = index + 1
            const translatedLabel = optional
              ? `${translate(label)} - ${translate(T.Optional)}`
              : translate(label)
            const isHorizontal = direction === 'horizontal'
            const isExpandedConnector =
              isCompact && (isActive || index === activeStep - 1)

            return (
              <Box component="li" key={id} className="step">
                <Wrapper
                  condition={hasStepErrors}
                  component={Tooltip}
                  title={getStepErrorTooltip(stepErrorMessages, translate)}
                  placement={isHorizontal ? 'top' : 'bottom'}
                  PopperProps={{
                    anchorEl: () =>
                      listRef.current?.children[index]?.querySelector(
                        isHorizontal ? '.stepper-button' : '.step-label'
                      ),
                  }}
                >
                  <Box
                    component="button"
                    className={`stepper-button ${isActive ? 'active' : ''}`}
                    disabled={isPending}
                    aria-current={isActive ? 'step' : undefined}
                    aria-invalid={hasStepErrors || undefined}
                    onClick={isActive ? undefined : () => onClick?.(index)}
                  >
                    <Box className="stepper-rail">
                      {isHorizontal && (
                        <Box aria-hidden="true" className="stepper-connector" />
                      )}

                      <StepMarker
                        dataCy={`step-${id}`}
                        number={number}
                        icon={icon}
                        status={status}
                        active={isActive}
                      />

                      {(isHorizontal || index < steps.length - 1) && (
                        <Box
                          aria-hidden="true"
                          className={`stepper-connector${
                            isExpandedConnector ? ' expanded' : ''
                          }`}
                        />
                      )}
                    </Box>

                    <StepLabel
                      number={number}
                      icon={icon}
                      status={status}
                      label={translatedLabel}
                    />
                  </Box>
                </Wrapper>
              </Box>
            )
          })}
        </Box>
      </Box>
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
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
}

Stepper.displayName = 'Stepper'
