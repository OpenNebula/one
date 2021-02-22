import React, { memo, createElement } from 'react'
import PropTypes from 'prop-types'

import { TextField, MenuItem } from '@material-ui/core'
import { Controller } from 'react-hook-form'

import ErrorHelper from 'client/components/FormControl/ErrorHelper'
import { Tr } from 'client/components/HOC/Translate'

const SelectController = memo(
  ({ control, cy, name, label, multiple, native, values, error, fieldProps }) => (
    <Controller
      render={({ value: renderValue, onChange, onBlur }) => {
        const defaultValue = multiple ? [values?.[0]?.value] : values?.[0]?.value

        return (
          <TextField
            value={renderValue ?? defaultValue}
            onBlur={onBlur}
            onChange={onChange}
            color='secondary'
            select
            fullWidth
            SelectProps={{ displayEmpty: true, multiple, native }}
            label={Tr(label)}
            inputProps={{ 'data-cy': cy }}
            error={Boolean(error)}
            helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
            FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
            {...fieldProps}
          >
            {values?.map(({ text, value = '' }) => createElement(
              native ? 'option' : MenuItem,
              { key: `${name}-${value}`, value },
              text
            ))}
          </TextField>
        )
      }}
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) => prevProps.error === nextProps.error
)

SelectController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  multiple: PropTypes.bool,
  native: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ]),
  fieldProps: PropTypes.object
}

SelectController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  multiple: false,
  native: false,
  values: [],
  error: false,
  fieldProps: undefined
}

SelectController.displayName = 'SelectController'

export default SelectController
