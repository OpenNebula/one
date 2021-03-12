import * as React from 'react'
import PropTypes from 'prop-types'

import {
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  StepButton
} from '@material-ui/core'
import { makeStyles, fade } from '@material-ui/core/styles'

import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  root: {
    position: 'sticky',
    top: -15,
    minHeight: 100,
    background: fade(theme.palette.background.paper, 0.65),
    zIndex: theme.zIndex.mobileStepper
  },
  icon: {
    color: theme.palette.text.hint,
    display: 'block',
    '&$completed': {
      color: theme.palette.secondary.main
    },
    '&$active': {
      color: theme.palette.secondary.main
    },
    '&$error': {
      color: theme.palette.error.main
    }
  },
  completed: {},
  active: {},
  error: {}
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
}) => {
  const classes = useStyles()

  return (
    <>
      <Stepper nonLinear activeStep={activeStep} className={classes.root}>
        {steps?.map(({ id, label }, stepIdx) => (
          <Step key={id}>
            <StepButton
              onClick={() => handleStep(stepIdx)}
              completed={activeStep > stepIdx}
              disabled={activeStep + 1 < stepIdx}
              optional={
                <Typography variant='caption' color='error'>
                  {errors[id]?.message}
                </Typography>
              }
            >
              <StepLabel
                StepIconProps={{
                  classes: {
                    root: classes.icon,
                    completed: classes.completed,
                    active: classes.active,
                    error: classes.error
                  }
                }}
                {...(Boolean(errors[id]) && { error: true })}
              >{Tr(label)}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <Box marginY={2} textAlign='end'>
        <Button onClick={handleBack} disabled={disabledBack} data-cy='stepper-back-button'>
          {Tr(T.Back)}
        </Button>
        <SubmitButton
          color='secondary'
          data-cy='stepper-next-button'
          onClick={handleNext}
          isSubmitting={isSubmitting}
          label={activeStep === lastStep ? Tr(T.Finish) : Tr(T.Next)}
        />
      </Box>
    </>
  )
}

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
