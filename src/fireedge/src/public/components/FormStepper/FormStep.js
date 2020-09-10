import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { useFormContext } from 'react-hook-form';

function FormStep({ step, data, setFormData }) {
  const { reset, errors } = useFormContext();
  const { id, preRender, FormComponent } = step;

  useEffect(() => {
    preRender && preRender();
    reset({ [id]: data }, { errors: true });
  }, []);

  return React.useMemo(() => <FormComponent id={id} />, [id]);
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
