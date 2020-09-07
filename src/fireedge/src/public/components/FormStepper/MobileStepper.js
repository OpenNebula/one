import React from 'react';
import PropTypes from 'prop-types';

import { Button, MobileStepper } from '@material-ui/core';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@material-ui/icons';

import { Tr } from 'client/components/HOC';

const CustomMobileStepper = ({
  totalSteps,
  activeStep,
  lastStep,
  disabledBack,
  handleNext,
  handleBack
}) => (
  <MobileStepper
    variant="progress"
    position="static"
    steps={totalSteps}
    activeStep={activeStep}
    style={{ flexGrow: 1 }}
    backButton={
      <Button size="small" onClick={handleBack} disabled={disabledBack}>
        <KeyboardArrowLeft /> {Tr('Back')}
      </Button>
    }
    nextButton={
      <Button size="small" onClick={handleNext}>
        {Tr(activeStep === lastStep ? 'Finish' : 'Next')}
        <KeyboardArrowRight />
      </Button>
    }
  />
);

CustomMobileStepper.propTypes = {
  totalSteps: PropTypes.number,
  activeStep: PropTypes.number,
  lastStep: PropTypes.number,
  disabledBack: PropTypes.bool,
  handleNext: PropTypes.func,
  handleBack: PropTypes.func
};

CustomMobileStepper.defaultProps = {
  totalSteps: 0,
  activeStep: 0,
  lastStep: 0,
  disabledBack: false,
  handleNext: () => undefined,
  handleBack: () => undefined
};

export default CustomMobileStepper;
