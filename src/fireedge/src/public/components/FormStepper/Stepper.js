import React from 'react';
import PropTypes from 'prop-types';

import {
  styled,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box
} from '@material-ui/core';

import { Tr } from 'client/components/HOC';

const StickyStepper = styled(Stepper)({
  position: 'sticky',
  top: -15,
  backdropFilter: 'blur(5px)',
  background: '#fafafa9c',
  zIndex: 1
});

const CustomStepper = ({
  steps,
  activeStep,
  lastStep,
  disabledBack,
  handleNext,
  handleBack
}) => (
  <>
    <StickyStepper activeStep={activeStep}>
      {steps?.map(({ label }) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </StickyStepper>
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
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
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
