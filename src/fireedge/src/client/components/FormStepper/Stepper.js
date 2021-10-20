/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { alpha, Box, Button, Typography } from '@mui/material'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepButton from '@mui/material/StepButton'
import StepIcon, { stepIconClasses } from '@mui/material/StepIcon'
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector'
import { styled } from '@mui/styles'

import { SubmitButton } from 'client/components/FormControl'
import { Tr, Translate, labelCanBeTranslated } from 'client/components/HOC'
import { T, SCHEMES } from 'client/constants'

const StepperStyled = styled(Stepper)(({ theme }) => ({
  position: 'sticky',
  top: -15,
  minHeight: 100,
  background: alpha(theme.palette.background.paper, 0.95),
  zIndex: theme.zIndex.mobileStepper
}))

const ConnectorStyled = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)'
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.secondary[700]
    }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.secondary[700]
    }
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === SCHEMES.DARK
      ? theme.palette.grey[600]
      : theme.palette.grey[400],
    borderTopWidth: 2,
    borderRadius: 1
  }
}))

const StepIconStyled = styled(StepIcon)(({ theme }) => ({
  color: theme.palette.text.hint,
  display: 'block',
  [`&.${stepIconClasses.completed}, &.${stepIconClasses.active}`]: {
    color: theme.palette.secondary[700]
  },
  [`&.${stepIconClasses.error}`]: {
    color: theme.palette.error.main
  }
}))

const CustomStepper = ({
  steps,
  activeStep,
  lastStep,
  disabledBack,
  handleStep,
  handleNext,
  handleBack,
  errors,
  isSubmitting
}) => (
  <>
    <StepperStyled nonLinear activeStep={activeStep} connector={<ConnectorStyled />}>
      {steps?.map(({ id, label }, stepIdx) => (
        <Step key={id} completed={activeStep > stepIdx}>
          <StepButton
            onClick={() => handleStep(stepIdx)}
            disabled={activeStep + 1 < stepIdx}
            optional={errors[id] && (
              <Typography variant='caption' color='error'>
                {errors[id]?.message}
              </Typography>
            )}
          >
            <StepLabel
              StepIconComponent={StepIconStyled}
              error={Boolean(errors[id]?.message)}
            >
              {labelCanBeTranslated(label) ? Tr(label) : label}
            </StepLabel>
          </StepButton>
        </Step>
      ))}
    </StepperStyled>
    <Box marginY={2} textAlign='end'>
      <Button
        data-cy='stepper-back-button'
        disabled={disabledBack || isSubmitting}
        onClick={handleBack}
        size='small'
      >
        <Translate word={T.Back} />
      </Button>
      <SubmitButton
        color='secondary'
        data-cy='stepper-next-button'
        isSubmitting={isSubmitting}
        onClick={handleNext}
        size='small'
        label={<Translate word={activeStep === lastStep ? T.Finish : T.Next} />}
      />
    </Box>
  </>
)

CustomStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  activeStep: PropTypes.number.isRequired,
  lastStep: PropTypes.number.isRequired,
  disabledBack: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool,
  handleStep: PropTypes.func,
  handleNext: PropTypes.func,
  handleBack: PropTypes.func,
  errors: PropTypes.shape({
    message: PropTypes.string
  })
}

CustomStepper.defaultProps = {
  steps: [],
  activeStep: 0,
  lastStep: 0,
  disabledBack: false,
  handleStep: () => undefined,
  handleNext: () => undefined,
  handleBack: () => undefined,
  errors: undefined,
  isSubmitting: false
}

CustomStepper.displayName = 'Stepper'

export default CustomStepper
