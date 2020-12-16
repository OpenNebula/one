import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { TextField } from '@material-ui/core'
import { Controller } from 'react-hook-form'
import { Tr } from 'client/components/HOC'

import ErrorHelper from 'client/components/FormControl/ErrorHelper'

const TextController = memo(
  ({ control, cy, type, name, label, error, fieldProps }) => (
    <Controller
      render={({ value, ...props }) =>
        <TextField
          fullWidth
          color='secondary'
          value={value ?? ''}
          type={type}
          {...(label && { label: Tr(label) })}
          inputProps={{ 'data-cy': cy }}
          error={Boolean(error)}
          helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
          FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
          {...props}
          {...fieldProps}
        />
      }
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.error === nextProps.error && prevProps.type === nextProps.type
)

TextController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ]),
  fieldProps: PropTypes.object
}

TextController.defaultProps = {
  control: {},
  cy: 'cy',
  type: 'text',
  name: '',
  label: '',
  error: false,
  fieldProps: undefined
}

TextController.displayName = 'TextController'

export default TextController
