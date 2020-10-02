import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { useFormContext } from 'react-hook-form';
import { useMediaQuery } from '@material-ui/core';

import CustomMobileStepper from 'client/components/FormStepper/MobileStepper';
import CustomStepper from 'client/components/FormStepper/Stepper';
import ErrorHelper from 'client/components/FormControl/ErrorHelper';

const FIRST_STEP = 0;

const FormStepper = ({ steps, onSubmit }) => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'));
  const { watch, trigger, reset, errors } = useFormContext();

  const [formData, setFormData] = useState(() => watch());
  const [activeStep, setActiveStep] = useState(FIRST_STEP);

  const totalSteps = useMemo(() => steps?.length, [steps]);
  const lastStep = useMemo(() => totalSteps - 1, [totalSteps]);
  const disabledBack = useMemo(() => activeStep === FIRST_STEP, [activeStep]);

  useEffect(() => {
    reset({ ...formData }, { errors: false });
  }, [formData]);

  const handleNext = useCallback(() => {
    const idSteps = steps.slice(0, activeStep + 1).map(({ id }) => id);

    trigger(idSteps).then(isValid => {
      if (!isValid) return;

      const data = { ...formData, ...watch() };

      if (activeStep === lastStep) {
        onSubmit(data);
      } else {
        setFormData(data);
        setActiveStep(prevActiveStep => prevActiveStep + 1);
      }
    });
  }, [activeStep, watch]);

  const handleBack = useCallback(() => {
    if (activeStep <= FIRST_STEP) return;

    setActiveStep(prevActiveStep => prevActiveStep - 1);
  }, [activeStep]);

  const { id, content: Content } = useMemo(() => steps[activeStep], [
    formData,
    activeStep,
    setFormData
  ]);

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
      {typeof errors[id]?.message === 'string' && (
        <ErrorHelper label={errors[id]?.message} />
      )}
      {Content && <Content data={formData[id]} setFormData={setFormData} />}
    </>
  );
};

FormStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
      content: PropTypes.func.isRequired
    })
  ),
  initialValue: PropTypes.objectOf(PropTypes.any),
  onSubmit: PropTypes.func
};

FormStepper.defaultProps = {
  steps: [],
  initialValue: {},
  onSubmit: console.log
};

export default FormStepper;
