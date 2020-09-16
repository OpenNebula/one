import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

import { useFormContext } from 'react-hook-form';

import ErrorHelper from 'client/components/FormControl/ErrorHelper';

function FormStep({ step, data, setFormData }) {
  const { errors } = useFormContext();
  const [showDialog, setShowDialog] = useState(false);
  const { id, preRender, FormComponent, DialogComponent } = step;

  useEffect(() => {
    if (preRender) preRender();
  }, []);

  const handleOpen = () => setShowDialog(true);
  const handleClose = () => setShowDialog(false);

  return (
    <>
      {typeof errors[id]?.message === 'string' && (
        <ErrorHelper label={errors[id]?.message} />
      )}
      {useMemo(
        () => (
          <FormComponent
            id={id}
            values={data}
            setFormData={setFormData}
            handleClick={handleOpen}
          />
        ),
        [id, handleOpen, setFormData, data]
      )}
      {showDialog && DialogComponent && (
        <DialogComponent
          open={showDialog}
          values={data}
          onCancel={handleClose}
        />
      )}
    </>
  );
}

FormStep.propTypes = {
  step: PropTypes.objectOf(PropTypes.any).isRequired,
  data: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.object,
    PropTypes.string
  ]).isRequired,
  setFormData: PropTypes.func.isRequired
};

FormStep.defaultProps = {
  step: {},
  data: {},
  setFormData: data => data
};

export default FormStep;
