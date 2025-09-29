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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  Popover,
  FormControlLabel,
  Switch,
  useTheme,
} from '@mui/material'
import Step from '@mui/material/Step'
import { NavArrowDown, NavArrowUp } from 'iconoir-react'
import StepButton from '@mui/material/StepButton'
import StepConnector, {
  stepConnectorClasses,
} from '@mui/material/StepConnector'
import { useState, useMemo } from 'react'
import StepIcon, { stepIconClasses } from '@mui/material/StepIcon'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { styled } from '@mui/styles'
import { SubmitButton } from '@modules/components/FormControl'
import { Translate } from '@modules/components/HOC'
import { SCHEMES, T, STYLE_BUTTONS } from '@ConstantsModule'

import FormStepperStyles from '@modules/components/FormStepper/styles'

const Label = styled('span')({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5em',
})

const StepperStyled = styled(Stepper)(({ theme }) => ({
  backdropFilter: 'blur(3px)',
  position: 'sticky',
  top: -15,
  minHeight: '3.75rem',
  zIndex: theme.zIndex.mobileStepper,
  backgroundColor: 'transparent',
}))

const ConnectorStyled = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.dark,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.dark,
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
    color: theme.palette.primary.dark,
  },
  [`&.${stepIconClasses.error}`]: {
    color: theme.palette.error.main,
  },
}))

const CustomStepper = ({
  steps,
  activeStep,
  lastStep,
  disabledBack,
  handleStep,
  handleNext,
  handleBack,
  enableShowMandatoryOnly,
  handleShowMandatoryOnly,
  showMandatoryOnly,
  errors,
  isSubmitting,
}) => {
  // Styles
  const theme = useTheme()
  const classes = useMemo(() => FormStepperStyles(theme), [theme])

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
    <div className={classes.stepperContainer}>
      <StepperStyled
        nonLinear
        activeStep={activeStep}
        className={classes.stepsContainer}
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

      <Box className={classes.buttonContainer}>
        <SubmitButton
          data-cy="stepper-back-button"
          disabled={disabledBack || isSubmitting}
          onClick={handleBack}
          importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
          size={STYLE_BUTTONS.SIZE.MEDIUM}
          type={STYLE_BUTTONS.TYPE.FILLED}
          label={<Translate word={T.Back} />}
        />
        <SubmitButton
          data-cy="stepper-next-button"
          isSubmitting={isSubmitting}
          onClick={handleNext}
          importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
          size={STYLE_BUTTONS.SIZE.MEDIUM}
          type={STYLE_BUTTONS.TYPE.FILLED}
          label={
            <Translate word={activeStep === lastStep ? T.Finish : T.Next} />
          }
        />
      </Box>

      {enableShowMandatoryOnly && (
        <FormControlLabel
          className={classes.mandatoryLabelContainer}
          control={
            <Switch
              onChange={handleShowMandatoryOnly}
              checked={showMandatoryOnly}
              inputProps={{ 'data-cy': 'switch-mandatory' }}
            />
          }
          label={<Label>{T.MandatoryUserInputs}</Label>}
          labelPlacement="end"
        />
      )}
    </div>
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
  enableShowMandatoryOnly: PropTypes.bool,
  handleShowMandatoryOnly: PropTypes.func,
  showMandatoryOnly: PropTypes.bool,
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
