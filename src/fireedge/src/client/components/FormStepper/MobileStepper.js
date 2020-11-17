import React from 'react'
import PropTypes from 'prop-types'

import { Button, MobileStepper, Typography, Box } from '@material-ui/core'
import { KeyboardArrowLeft, KeyboardArrowRight } from '@material-ui/icons'
import { makeStyles, fade } from '@material-ui/core/styles'

import { Tr } from 'client/components/HOC'

const useStyles = makeStyles(theme => ({
  root: {
    position: 'sticky',
    top: -15,
    background: fade(theme.palette.primary.main, 0.65),
    zIndex: theme.zIndex.mobileStepper,
    margin: theme.spacing(2, 0)
  },
  title: {
    padding: theme.spacing(1, 2),
    color: theme.palette.common.black
  },
  error: {
    padding: theme.spacing(1, 2)
  },
  button: { color: theme.palette.common.black },
  stepper: { background: 'transparent' }
}))

const CustomMobileStepper = ({
  steps,
  totalSteps,
  activeStep,
  lastStep,
  disabledBack,
  handleNext,
  handleBack,
  errors
}) => {
  const classes = useStyles()
  const { id, label } = steps[activeStep]

  return (
    <Box className={classes.root}>
      <Box minHeight={60}>
        <Typography className={classes.title}>{label}</Typography>
        {Boolean(errors[id]) && (
          <Typography className={classes.error} variant="caption" color="error">
            {errors[id]?.message}
          </Typography>
        )}
      </Box>
      <MobileStepper
        className={classes.stepper}
        variant="progress"
        position="static"
        steps={totalSteps}
        activeStep={activeStep}
        backButton={
          <Button
            className={classes.button}
            size="small"
            onClick={handleBack}
            disabled={disabledBack}
          >
            <KeyboardArrowLeft /> {Tr('Back')}
          </Button>
        }
        nextButton={
          <Button className={classes.button} size="small" onClick={handleNext}>
            {activeStep === lastStep ? Tr('Finish') : Tr('Next')}
            <KeyboardArrowRight />
          </Button>
        }
      />
    </Box>
  )
}

CustomMobileStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  totalSteps: PropTypes.number,
  activeStep: PropTypes.number,
  lastStep: PropTypes.number,
  disabledBack: PropTypes.bool,
  handleNext: PropTypes.func,
  handleBack: PropTypes.func,
  errors: PropTypes.shape({
    message: PropTypes.string
  })
}

CustomMobileStepper.defaultProps = {
  steps: [],
  totalSteps: 0,
  activeStep: 0,
  lastStep: 0,
  disabledBack: false,
  handleNext: () => undefined,
  handleBack: () => undefined,
  errors: undefined
}

CustomMobileStepper.displayName = 'MobileStepper'

export default CustomMobileStepper
