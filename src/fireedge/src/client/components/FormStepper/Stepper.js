/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  Popover,
} from '@mui/material'
import Step from '@mui/material/Step'
import { NavArrowDown, NavArrowUp } from 'iconoir-react'
import StepButton from '@mui/material/StepButton'
import StepConnector, {
  stepConnectorClasses,
} from '@mui/material/StepConnector'
import { useState } from 'react'
import StepIcon, { stepIconClasses } from '@mui/material/StepIcon'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { styled } from '@mui/styles'
import { SubmitButton } from 'client/components/FormControl'
import { Translate } from 'client/components/HOC'
import { SCHEMES, T } from 'client/constants'

const StepperStyled = styled(Stepper)(({ theme }) => ({
  backdropFilter: 'blur(3px)',
  position: 'sticky',
  top: -15,
  minHeight: 100,
  zIndex: theme.zIndex.mobileStepper,
  backgroundColor: theme.palette.action.hover,
}))

const ConnectorStyled = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.secondary[700],
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.secondary[700],
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor:
      theme.palette.mode === SCHEMES.DARK
        ? theme.palette.grey[600]
        : theme.palette.grey[400],
    borderTopWidth: 2,
    borderRadius: 1,
  },
}))

const ErrorListContainer = styled(Paper)(({ theme }) => ({
  maxHeight: 200,
  overflowY: 'auto',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
}))

const ErrorSummaryContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

const StepIconStyled = styled(StepIcon)(({ theme }) => ({
  color: theme.palette.text.hint,
  display: 'block',
  [`&.${stepIconClasses.completed}, &.${stepIconClasses.active}`]: {
    color: theme.palette.secondary[700],
  },
  [`&.${stepIconClasses.error}`]: {
    color: theme.palette.error.main,
  },
}))

const ButtonsWrapper = styled(Box)(({ theme }) => ({
  padding: '1em 0.5em',
  textAlign: 'end',
  backdropFilter: 'blur(3px)',
  position: 'sticky',
  top: 85,
  zIndex: theme.zIndex.mobileStepper + 1,
  backgroundColor: theme.palette.action.hover,
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
  isSubmitting,
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [currentStep, setCurrentStep] = useState(null)

  const handleClick = (event, stepIdx) => {
    setAnchorEl(event.currentTarget)
    setCurrentStep(stepIdx)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setCurrentStep(null)
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <StepperStyled
        nonLinear
        activeStep={activeStep}
        connector={<ConnectorStyled />}
      >
        {steps?.map(({ id, label }, stepIdx) => {
          const errorData = errors[id]
          const hasError = Boolean(errorData?.message)
          const individualMessages = errorData?.individualErrorMessages || []

          return (
            <Step key={id} completed={activeStep > stepIdx}>
              <StepButton
                onClick={() => handleStep(stepIdx)}
                disabled={activeStep + 1 < stepIdx}
                data-cy={`step-${id}`}
              >
                <StepLabel StepIconComponent={StepIconStyled} error={hasError}>
                  <Translate word={label} />
                </StepLabel>
              </StepButton>
              {hasError && (
                <>
                  <ErrorSummaryContainer
                    onClick={(event) => handleClick(event, stepIdx)}
                  >
                    <Typography variant="caption" color="error">
                      {`${errorData.message[0].replace(
                        '%s',
                        errorData.message[1]
                      )}`}
                    </Typography>
                    <IconButton size="small">
                      {currentStep === stepIdx && open ? (
                        <NavArrowUp />
                      ) : (
                        <NavArrowDown />
                      )}
                    </IconButton>
                  </ErrorSummaryContainer>
                  <Popover
                    id={id}
                    open={currentStep === stepIdx && open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                  >
                    <ErrorListContainer>
                      <List>
                        {individualMessages.flat().map((msg, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={msg} />
                          </ListItem>
                        ))}
                      </List>
                    </ErrorListContainer>
                  </Popover>
                </>
              )}
            </Step>
          )
        })}
      </StepperStyled>
      <ButtonsWrapper>
        <Button
          data-cy="stepper-back-button"
          disabled={disabledBack || isSubmitting}
          onClick={handleBack}
          size="small"
        >
          <Translate word={T.Back} />
        </Button>
        <SubmitButton
          color="secondary"
          data-cy="stepper-next-button"
          isSubmitting={isSubmitting}
          onClick={handleNext}
          size="small"
          label={
            <Translate word={activeStep === lastStep ? T.Finish : T.Next} />
          }
        />
      </ButtonsWrapper>
    </>
  )
}

CustomStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
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
    message: PropTypes.string,
  }),
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
  isSubmitting: false,
}

CustomStepper.displayName = 'Stepper'

export default CustomStepper
