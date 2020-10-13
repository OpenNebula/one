import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { TextField, MenuItem } from '@material-ui/core';
import { Controller } from 'react-hook-form';

import ErrorHelper from 'client/components/FormControl/ErrorHelper';
import { Tr } from 'client/components/HOC/Translate';

const SelectController = memo(
  ({ control, cy, name, label, values, error }) => (
    <Controller
      as={
        <TextField
          select
          SelectProps={{ displayEmpty: true }}
          fullWidth
          label={Tr(label)}
          inputProps={{ 'data-cy': cy }}
          error={Boolean(error)}
          helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
          FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
        >
          {Array.isArray(values) &&
            values?.map(({ text, value }) => (
              <MenuItem key={`${name}-${value}`} value={value ?? ''}>
                {text}
              </MenuItem>
            ))}
        </TextField>
      }
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) => prevProps.error === nextProps.error
);

SelectController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ])
};

SelectController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  values: [],
  error: false
};

export default SelectController;
