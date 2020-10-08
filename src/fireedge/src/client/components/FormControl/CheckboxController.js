import React, { memo } from 'react';
import PropTypes from 'prop-types';

import {
  FormControl,
  FormControlLabel,
  Checkbox,
  Tooltip
} from '@material-ui/core';
import { Controller } from 'react-hook-form';

import ErrorHelper from 'client/components/FormControl/ErrorHelper';

const CheckboxController = memo(
  ({ control, cy, name, label, tooltip, error }) => (
    <Controller
      render={({ onChange, value }) => (
        <Tooltip title={tooltip ?? ''}>
          <FormControl error={Boolean(error)}>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={e => onChange(e.target.checked)}
                  name={name}
                  checked={value}
                  color="primary"
                  inputProps={{ 'data-cy': cy }}
                />
              }
              label={label}
              labelPlacement="end"
            />
            {Boolean(error) && <ErrorHelper label={error?.message} />}
          </FormControl>
        </Tooltip>
      )}
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) => prevProps.error === nextProps.error
);

CheckboxController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltip: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ])
};

CheckboxController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  tooltip: undefined,
  values: [],
  error: false
};

export default CheckboxController;
