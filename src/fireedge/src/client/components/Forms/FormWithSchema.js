import React from 'react';
import PropTypes from 'prop-types';

import { Grid } from '@material-ui/core';
import { useFormContext, useWatch } from 'react-hook-form';

import { TYPE_INPUT } from 'client/constants';
import TextController from 'client/components/FormControl/TextController';
import SelectController from 'client/components/FormControl/SelectController';
import CheckboxController from 'client/components/FormControl/CheckboxController';
import AutocompleteController from 'client/components/FormControl/AutocompleteController';

const InputController = {
  [TYPE_INPUT.TEXT]: TextController,
  [TYPE_INPUT.SELECT]: SelectController,
  [TYPE_INPUT.CHECKBOX]: CheckboxController,
  [TYPE_INPUT.AUTOCOMPLETE]: AutocompleteController
};

const FormWithSchema = ({ id, cy, fields }) => {
  const { control, errors } = useFormContext();

  return (
    <Grid container spacing={1}>
      {fields?.map(
        ({ name, type, htmlType, label, values, dependOf, tooltip, grid }) => {
          const dataCy = `${cy}-${name}`;
          const inputName = id ? `${id}.${name}` : name;
          const formError = id ? errors[id] : errors;
          const inputError = formError ? formError[name] : false;
          const dependValue = dependOf
            ? useWatch({ control, name: id ? `${id}.${dependOf}` : dependOf })
            : null;

          return (
            InputController[type] && (
              <Grid key={`${cy}-${name}`} item xs={12} md={6} {...grid}>
                {React.createElement(InputController[type], {
                  control,
                  cy: dataCy,
                  type: htmlType,
                  name: inputName,
                  label,
                  tooltip,
                  values: dependOf ? values(dependValue) : values,
                  error: inputError
                })}
              </Grid>
            )
          );
        }
      )}
    </Grid>
  );
};

FormWithSchema.propTypes = {
  id: PropTypes.string,
  cy: PropTypes.string,
  fields: PropTypes.arrayOf(PropTypes.object)
};

FormWithSchema.defaultProps = {
  id: '',
  cy: 'form',
  fields: []
};

export default FormWithSchema;
