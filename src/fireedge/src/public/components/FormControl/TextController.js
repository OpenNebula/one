import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { TextField } from '@material-ui/core';
import { Controller } from 'react-hook-form';

import ErrorHelper from 'client/components/FormControl/ErrorHelper';

const TextController = memo(
  ({ control, cy, type, name, label, error }) => (
    <Controller
      as={
        <TextField
          fullWidth
          type={type}
          label={label}
          inputProps={{ 'data-cy': cy }}
          error={Boolean(error)}
          helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
          FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
        />
      }
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) => prevProps.error === nextProps.error
);

TextController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ])
};

TextController.defaultProps = {
  control: {},
  cy: 'cy',
  type: 'text',
  name: '',
  label: '',
  error: false
};

export default TextController;
