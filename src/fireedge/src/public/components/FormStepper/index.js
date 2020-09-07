import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

import { useFormContext } from 'react-hook-form';
import { useMediaQuery } from '@material-ui/core';

import CustomMobileStepper from 'client/components/FormStepper/MobileStepper';
import CustomStepper from 'client/components/FormStepper/Stepper';
import { console } from 'window-or-global';

const FIRST_STEP = 0;

const FormStepper = ({ steps, initialValue, onSubmit }) => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'));
  const { watch } = useFormContext();
  const [activeStep, setActiveStep] = useState(FIRST_STEP);
  const [formData, setFormData] = useState(initialValue);

  const totalSteps = useMemo(() => steps?.length, [steps]);
  const lastStep = useMemo(() => totalSteps - 1, [totalSteps]);
  const disabledBack = useMemo(() => activeStep === FIRST_STEP, [activeStep]);

  const handleNext = useCallback(() => {
    setFormData(data => ({ ...data, ...watch() }));

    if (activeStep === lastStep) {
      onSubmit(formData);
    } else setActiveStep(prevActiveStep => prevActiveStep + 1);
  }, [activeStep]);

  const handleBack = useCallback(() => {
    if (activeStep <= FIRST_STEP) return;

    setActiveStep(prevActiveStep => prevActiveStep - 1);
    setFormData(data => ({ ...data, ...watch() }));
  }, [activeStep]);

  return (
    <>
      {/* STEPPER */}
      {isMobile ? (
        <CustomMobileStepper
          totalSteps={totalSteps}
          activeStep={activeStep}
          lastStep={lastStep}
          disabledBack={disabledBack}
          handleNext={handleNext}
          handleBack={handleBack}
        />
      ) : (
        <CustomStepper
          steps={steps}
          activeStep={activeStep}
          lastStep={lastStep}
          disabledBack={disabledBack}
          handleNext={handleNext}
          handleBack={handleBack}
        />
      )}

      {/* FORM CONTENT */}
      {React.useMemo(() => {
        const { content: Content, ...rest } = steps[activeStep];

        return (
          <Content
            data={formData}
            setFormData={setFormData}
            step={{ ...rest }}
          />
        );
      }, [activeStep, formData, setFormData])}
    </>
  );
};

FormStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
      dependOf: PropTypes.bool
    })
  ),
  initialValue: PropTypes.objectOf(PropTypes.object),
  onSubmit: PropTypes.func
};

FormStepper.defaultProps = {
  steps: [],
  initialValue: {},
  onSubmit: dataForm => console.log(dataForm)
};

export default FormStepper;
