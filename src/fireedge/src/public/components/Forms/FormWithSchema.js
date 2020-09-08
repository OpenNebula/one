import React from 'react';
import PropTypes from 'prop-types';

import {
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox
} from '@material-ui/core';
import { useFormContext, Controller } from 'react-hook-form';

import { TYPE_INPUT } from 'client/constants';
import ErrorHelper from 'client/components/FormControl/ErrorHelper';

const FormWithSchema = ({ id, cy, schema }) => {
  const { register, control, errors } = useFormContext();

  return (
    <Grid container spacing={3}>
      {schema?.map(({ name, type, label, values }) => (
        <Grid key={`${cy}-${name}`} item xs={12} md={6}>
          {(type === TYPE_INPUT.TEXT || type === TYPE_INPUT.SELECT) && (
            <Controller
              as={
                <TextField
                  fullWidth
                  select={type === TYPE_INPUT.SELECT}
                  label={label}
                  inputProps={{ 'data-cy': `${cy}-${name}` }}
                  error={errors[name]}
                  helperText={
                    errors[name] && (
                      <ErrorHelper label={errors[name]?.message} />
                    )
                  }
                  FormHelperTextProps={{ 'data-cy': `${cy}-${name}-error` }}
                >
                  {type === TYPE_INPUT.SELECT &&
                    values?.map(({ text, value }) => (
                      <MenuItem key={`${name}-${value}`} value={`${value}`}>
                        {text}
                      </MenuItem>
                    ))}
                </TextField>
              }
              name={`${id}.${name}`}
              control={control}
            />
          )}
        </Grid>
      ))}
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
