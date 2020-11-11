import React from 'react'
import PropTypes from 'prop-types'

import {
  styled,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography
} from '@material-ui/core'

import ButtonSubmit from 'client/components/FormControl/SubmitButton'
import { Finish, Back, Next } from 'client/constants/translates'
import { Tr } from 'client/components/HOC'

const StickyStepper = styled(Stepper)({
  position: 'sticky',
  top: -15,
  minHeight: 100,
  backdropFilter: 'blur(5px)',
  background: '#fafafa9c',
  zIndex: 1
})

const CustomStepper = ({
  steps,
  activeStep,
  lastStep,
  disabledBack,
  handleNext,
  handleBack,
  errors,
  isSubmitting
}) => (
  <>
    <StickyStepper activeStep={activeStep}>
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
    </StickyStepper>
    <Box marginY={2}>
      <Button onClick={handleBack} disabled={disabledBack}>
        {Tr(Back)}
      </Button>
      <ButtonSubmit
        data-cy="stepper-next-button"
        onClick={handleNext}
        isSubmitting={isSubmitting}
        label={activeStep === lastStep ? Tr(Finish) : Tr(Next)}
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
