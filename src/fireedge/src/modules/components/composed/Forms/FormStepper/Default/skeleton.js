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
import { memo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'
import { Box, useTheme } from '@mui/material'
import { T } from '@ConstantsModule'
import { useCreationForm, useTranslation } from '@ProvidersModule'
import { SkeletonLoading } from '@modules/components/primitives/Loaders'
import { Button } from '@modules/components/primitives/Buttons/Default'
import { getStyles as getStepperStyles } from '@modules/components/primitives/Stepper/Default/styles'
import { getStyles } from '@modules/components/composed/Forms/FormStepper/Default/styles'
import useFormStepperLayout from '@modules/components/composed/Forms/FormStepper/Default/useLayout'

/**
 * Mirrors the stepper form layout while its data and configuration load.
 *
 * @param {object} props - Skeleton properties
 * @param {number} props.stepCount - Known step count, or three placeholders while unknown
 * @param {object[]} props.steps - Optional step configuration, taking precedence over stepCount
 * @param {number} props.activeStep - Index of the step whose layout is loading
 * @param {boolean} props.isPopup - Whether the form is rendered in a popup
 * @param {number|string} props.maxContentWidth - Optional maximum width for centered content, overridden by the active step
 * @returns {JSXElementConstructor} Skeleton loader component
 */
const SkeletonStepsForm = memo(
  ({
    stepCount = 3,
    steps,
    activeStep = 0,
    isPopup = false,
    maxContentWidth,
  }) => {
    const theme = useTheme()
    const { translate } = useTranslation()
    const { isCreation } = useCreationForm()
    const { layout, canvasHeight, setCanvasRef } = useFormStepperLayout()
    const totalSteps = steps?.length ?? stepCount
    const stepMaxContentWidth = steps?.[activeStep]?.maxContentWidth
    const hasStepper = totalSteps > 1
    const hasCreationHeader = isCreation && !isPopup
    const isHorizontal = layout !== 'wide'

    return (
      <Box
        ref={setCanvasRef}
        className="form-stepper form-stepper-skeleton"
        data-cy="form-stepper-skeleton"
        aria-busy="true"
        aria-label={translate(T.Loading)}
        sx={getStyles({
          theme,
          isPopup,
          layout,
          canvasHeight,
          hasStepper,
          maxContentWidth: stepMaxContentWidth ?? maxContentWidth,
        })}
      >
        {hasStepper && (
          <Box
            className="stepper"
            aria-hidden="true"
            sx={getStepperStyles({
              theme,
              direction: isHorizontal ? 'horizontal' : 'vertical',
            })}
          >
            <Box component="ol" className="stepper-list">
              {Array.from({ length: totalSteps }, (_, index) => (
                <Box component="li" className="step" key={index}>
                  <Box className="stepper-button">
                    <Box className="stepper-rail">
                      {isHorizontal && <Box className="stepper-connector" />}
                      <Box className="step-marker">
                        <SkeletonLoading
                          loading
                          variant="circular"
                          width="100%"
                          height="100%"
                        />
                      </Box>
                      {(isHorizontal || index < totalSteps - 1) && (
                        <Box className="stepper-connector" />
                      )}
                    </Box>
                    <Box
                      className="step-label"
                      sx={{
                        gap: `${theme.scale[100]}px`,
                        maxWidth: `${theme.scale[1500]}px`,
                        ...(isHorizontal && {
                          width: `calc(100% - ${theme.scale[400]}px)`,
                        }),
                      }}
                    >
                      <SkeletonLoading
                        loading
                        width="100%"
                        height={theme.scale[500]}
                      />
                      {index === activeStep && (
                        <SkeletonLoading
                          loading
                          width="66%"
                          height={theme.scale[400]}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        <Box className="content" aria-hidden="true">
          <Box
            sx={{
              display: 'grid',
              gap: `${theme.scale[600]}px`,
              gridTemplateColumns: 'minmax(0, 1fr)',
              [`@container form-stepper-main (min-width: ${theme.breakpoints.values.md}px)`]:
                {
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                },
            }}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${theme.scale[100]}px`,
                  minWidth: 0,
                  ...(index === 2 && { gridColumn: '1 / -1' }),
                }}
              >
                <SkeletonLoading
                  loading
                  width={theme.scale[1600]}
                  height={theme.scale[500]}
                />
                <SkeletonLoading
                  loading
                  height={index === 2 ? theme.scale[1400] : theme.scale[800]}
                />
              </Box>
            ))}
          </Box>
        </Box>
        <Box className="footer">
          <Box className="stepper-buttons">
            <Button
              isDisabled
              type={hasCreationHeader ? 'secondary' : 'transparent'}
              title={hasCreationHeader ? T.Back : T.Cancel}
            />
            <Box className="form-stepper-buttons-progress">
              {!hasCreationHeader && (
                <Button isDisabled type="secondary" title={T.Back} />
              )}
              <Button
                isDisabled
                title={activeStep === totalSteps - 1 ? T.Finish : T.Next}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }
)

SkeletonStepsForm.propTypes = {
  stepCount: PropTypes.number,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      maxContentWidth: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]),
    })
  ),
  activeStep: PropTypes.number,
  isPopup: PropTypes.bool,
  maxContentWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

SkeletonStepsForm.displayName = 'SkeletonStepsForm'

export default SkeletonStepsForm
