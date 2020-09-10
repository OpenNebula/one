import React from 'react';
import PropTypes from 'prop-types';

import { Grid } from '@material-ui/core';
import { useFormContext } from 'react-hook-form';

import { TYPE_INPUT } from 'client/constants';
import TextController from 'client/components/FormControl/TextController';
import SelectController from 'client/components/FormControl/SelectController';
import CheckboxController from 'client/components/FormControl/CheckboxController';

const InputController = {
  [TYPE_INPUT.TEXT]: TextController,
  [TYPE_INPUT.SELECT]: SelectController,
  [TYPE_INPUT.CHECKBOX]: CheckboxController
};

const FormWithSchema = ({ id, cy, schema }) => {
  const { control, errors } = useFormContext();

  return (
    <Grid container spacing={3}>
      {schema?.map(({ name, type, label, values }) => {
        const dataCy = `${cy}-${name}`;
        const inputName = id ? `${id}.${name}` : name;
        const formError = id ? errors[id] : errors;
        const inputError = formError ? formError[name] : false;

        return (
          <Grid key={`${cy}-${name}`} item xs={12} md={6}>
            {React.createElement(InputController[type], {
              control,
              cy: dataCy,
              name: inputName,
              label,
              values,
              error: inputError
            })}
          </Grid>
        );
      })}
    </Grid>
  );
};

FormWithSchema.propTypes = {
  id: PropTypes.string,
  cy: PropTypes.string,
  schema: PropTypes.arrayOf(PropTypes.object)
};

FormWithSchema.defaultProps = {
  id: '',
  cy: 'form',
  schema: []
};

export default FormWithSchema;
