import React from 'react'
import PropTypes from 'prop-types'

import {
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography
} from '@material-ui/core'
import { makeStyles, fade } from '@material-ui/core/styles'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  root: {
    position: 'sticky',
    top: -15,
    minHeight: 100,
    background: fade(theme.palette.background.default, 0.65),
    zIndex: theme.zIndex.mobileStepper
  }
}))

const CustomStepper = ({
  steps,
  activeStep,
  lastStep,
  disabledBack,
  handleNext,
  handleBack,
  errors,
  isSubmitting
}) => {
  const classes = useStyles()

  return (
    <>
      <Stepper activeStep={activeStep} className={classes.root}>
        {steps?.map(({ id, label }) => (
          <Step key={id}>
            <StepLabel
              {...(Boolean(errors[id]) && { error: true })}
              optional={
                <Typography variant="caption" color="error">
                  {errors[id]?.message}
                </Typography>
              }
            >{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Box marginY={2}>
        <Button onClick={handleBack} disabled={disabledBack}>
          {Tr(T.Back)}
        </Button>
        <SubmitButton
          color='primary'
          data-cy="stepper-next-button"
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
  handleNext: () => undefined,
  handleBack: () => undefined,
  errors: undefined,
  isSubmitting: false
}

CustomStepper.displayName = 'Stepper'

export default CustomStepper
