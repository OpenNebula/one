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

import {
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  StepButton
} from '@material-ui/core'
import { makeStyles, alpha } from '@material-ui/core/styles'

import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  root: {
    position: 'sticky',
    top: -15,
    minHeight: 100,
    background: alpha(theme.palette.background.paper, 0.95),
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
                {...(Boolean(errors[id]?.message) && { error: true })}
              >{Tr(label)}</StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <Box marginY={2} textAlign='end'>
        <Button
          data-cy='stepper-back-button'
          disabled={disabledBack}
          onClick={handleBack}
          size='small'
        >
          {Tr(T.Back)}
        </Button>
        <SubmitButton
          color='secondary'
          data-cy='stepper-next-button'
          isSubmitting={isSubmitting}
          label={activeStep === lastStep ? Tr(T.Finish) : Tr(T.Next)}
          onClick={handleNext}
          size='small'
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
