import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { useFormContext } from 'react-hook-form';

import ErrorHelper from 'client/components/FormControl/ErrorHelper';

function FormStep({ step, data, setFormData }) {
  const { errors } = useFormContext();
  const [showDialog, setShowDialog] = useState(false);
  const { id, preRender, FormComponent, DialogComponent } = step;

  useEffect(() => {
    preRender && preRender();
  }, []);

  const handleOpen = () => setShowDialog(true);
  const handleClose = () => setShowDialog(false);
  const handleSubmit = d => console.log(d);

  return (
    <>
      {typeof errors[id]?.message === 'string' && (
        <ErrorHelper label={errors[id]?.message} />
      )}
      {React.useMemo(
        () => (
          <FormComponent id={id} handleClick={handleOpen} />
        ),
        [id, handleOpen]
      )}
      {showDialog && DialogComponent && (
        <DialogComponent
          open={showDialog}
          values={data}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      )}
    </>
  );
}

FormStep.propTypes = {
  step: PropTypes.objectOf(PropTypes.any).isRequired,
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  setFormData: PropTypes.func.isRequired
};

FormStep.defaultProps = {
  step: {},
  data: {},
  setFormData: data => data
};

export default FormStep;
