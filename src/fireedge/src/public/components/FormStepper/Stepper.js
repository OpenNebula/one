import React from 'react';
import PropTypes from 'prop-types';

import { Button, Stepper, Step, StepLabel, Box } from '@material-ui/core';

import { Tr } from 'client/components/HOC';

/*
position: sticky;
top: 0;
backdrop-filter: blur(5px);
background: #000000aa;
z-index: 1;
*/

const CustomStepper = ({
  steps,
  activeStep,
  lastStep,
  disabledBack,
  handleNext,
  handleBack
}) => (
  <>
    <Stepper activeStep={activeStep}>
      {steps?.map(({ label }) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
    <Box marginY={2}>
      <Button onClick={handleBack} disabled={disabledBack}>
        {Tr('Back')}
      </Button>
      <Button variant="contained" color="primary" onClick={handleNext}>
        {Tr(activeStep === lastStep ? 'Finish' : 'Next')}
      </Button>
    </Box>
  </>
);

CustomStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOf([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  activeStep: PropTypes.number.isRequired,
  lastStep: PropTypes.number.isRequired,
  disabledBack: PropTypes.bool.isRequired,
  handleNext: PropTypes.func,
  handleBack: PropTypes.func
};

CustomStepper.defaultProps = {
  steps: [],
  activeStep: 0,
  lastStep: 0,
  disabledBack: false,
  handleNext: () => undefined,
  handleBack: () => undefined
};

export default CustomStepper;
