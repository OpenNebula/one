import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { styled, Button, MobileStepper } from '@material-ui/core';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@material-ui/icons';

import { Tr } from 'client/components/HOC';

const StickyMobileStepper = styled(MobileStepper)({
  position: 'sticky',
  top: -15,
  backdropFilter: 'blur(5px)',
  background: '#fafafa9c',
  zIndex: 1
});

const CustomMobileStepper = memo(
  ({
    totalSteps,
    activeStep,
    lastStep,
    disabledBack,
    handleNext,
    handleBack
  }) => (
    <StickyMobileStepper
      variant="progress"
      position="static"
      steps={totalSteps}
      activeStep={activeStep}
      backButton={
        <Button size="small" onClick={handleBack} disabled={disabledBack}>
          <KeyboardArrowLeft /> {Tr('Back')}
        </Button>
      }
      nextButton={
        <Button size="small" onClick={handleNext}>
          {activeStep === lastStep ? Tr('Finish') : Tr('Next')}
          <KeyboardArrowRight />
        </Button>
      }
    />
  ),
  (prev, next) => prev.activeStep === next.activeStep
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
