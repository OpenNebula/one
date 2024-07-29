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

import { Button, MobileStepper, Typography, Box, alpha } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import {
  NavArrowLeft as PreviousIcon,
  NavArrowRight as NextIcon,
} from 'iconoir-react'

import { Translate, labelCanBeTranslated } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'sticky',
    top: -15,
    background: alpha(theme.palette.primary.light, 0.65),
    zIndex: theme.zIndex.mobileStepper,
    margin: theme.spacing(2, 0),
  },
  title: {
    padding: theme.spacing(1, 2),
    color: theme.palette.primary.contrastText,
  },
  error: { padding: theme.spacing(1, 2) },
  button: { color: theme.palette.action.active },
  stepper: { background: 'transparent' },
}))

const CustomMobileStepper = ({
  steps,
  totalSteps,
  activeStep,
  lastStep,
  disabledBack,
  handleNext,
  handleBack,
  errors,
}) => {
  const classes = useStyles()
  const { id, label } = steps[activeStep]

  return (
    <Box className={classes.root}>
      <Box minHeight={60}>
        <Typography className={classes.title}>
          {labelCanBeTranslated(label) ? <Translate word={label} /> : label}
        </Typography>
        {Boolean(errors[id]) && (
          <Typography className={classes.error} variant="caption" color="error">
            <Translate word={errors[id]?.message} />
          </Typography>
        )}
      </Box>
      <MobileStepper
        className={classes.stepper}
        variant="progress"
        position="static"
        steps={totalSteps}
        activeStep={activeStep}
        LinearProgressProps={{ color: 'secondary' }}
        backButton={
          <Button
            className={classes.button}
            size="small"
            onClick={handleBack}
            disabled={disabledBack}
          >
            <PreviousIcon />
            <Translate word={T.Back} />
          </Button>
        }
        nextButton={
          <Button className={classes.button} size="small" onClick={handleNext}>
            {activeStep === lastStep ? (
              <Translate word={T.Finish} />
            ) : (
              <Translate word={T.Next} />
            )}
            <NextIcon />
          </Button>
        }
      />
    </Box>
  )
}

CustomMobileStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  totalSteps: PropTypes.number,
  activeStep: PropTypes.number,
  lastStep: PropTypes.number,
  disabledBack: PropTypes.bool,
  handleNext: PropTypes.func,
  handleBack: PropTypes.func,
  errors: PropTypes.shape({
    message: PropTypes.string,
  }),
}

CustomMobileStepper.defaultProps = {
  steps: [],
  totalSteps: 0,
  activeStep: 0,
  lastStep: 0,
  disabledBack: false,
  handleNext: () => undefined,
  handleBack: () => undefined,
  errors: undefined,
}

CustomMobileStepper.displayName = 'MobileStepper'

export default CustomMobileStepper
