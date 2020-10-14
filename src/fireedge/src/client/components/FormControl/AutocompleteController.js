import React from 'react'
import PropTypes from 'prop-types'

import { TextField } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'
import { Controller } from 'react-hook-form'

import ErrorHelper from 'client/components/FormControl/ErrorHelper'
import { Tr } from 'client/components/HOC/Translate'

const AutocompleteController = ({
  control,
  cy,
  name,
  label,
  values,
  error
}) => (
  <Controller
    render={({ value: val, onBlur, onChange }) => {
      const selected = values.find(({ value }) => value === val) ?? null

      return (
        <Autocomplete
          fullWidth
          onBlur={onBlur}
          onChange={(_, newValue) => onChange(newValue.value)}
          options={values}
          value={selected}
          getOptionLabel={option => option.text}
          getOptionSelected={option => option.value === val}
          renderInput={({ inputProps, ...inputParams }) => (
            <TextField
              label={Tr(label)}
              inputProps={{ ...inputProps, 'data-cy': cy }}
              error={Boolean(error)}
              helperText={
                Boolean(error) && <ErrorHelper label={error?.message} />
              }
              FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
              {...inputParams}
            />
          )}
        />
      )
    }}
    name={name}
    control={control}
  />
)

AutocompleteController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ])
}

AutocompleteController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  values: [],
  error: false
}

export default AutocompleteController
