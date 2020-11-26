import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { TextField, Chip } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab'
import { Controller } from 'react-hook-form'

import ErrorHelper from 'client/components/FormControl/ErrorHelper'
import { Tr } from 'client/components/HOC/Translate'

const AutocompleteController = memo(
  ({ control, cy, name, label, multiple, values, error, fieldProps }) => (
    <Controller
      render={({ value: renderValue, onBlur, onChange }) => {
        const selected = multiple
          ? renderValue ?? []
          : values.find(({ value }) => value === renderValue) ?? null

        return (
          <Autocomplete
            fullWidth
            onBlur={onBlur}
            onChange={(_, newValue) => {
              const newValueToChange = multiple
                ? newValue?.map(value =>
                  typeof value === 'string' ? ({ text: value, value }) : value
                )
                : newValue.value

              return onChange(newValueToChange)
            }}
            options={values}
            value={selected}
            multiple={multiple}
            renderTags={(tags, getTagProps) =>
              tags.map((tag, index) => (
                <Chip
                  key={tag.value}
                  size="small"
                  variant="outlined"
                  label={tag.text}
                  {...getTagProps({ index })}
                />
              ))
            }
            getOptionLabel={option => option.text}
            getOptionSelected={option => option.value === renderValue}
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
            {...fieldProps}
          />
        )
      }}
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) => (
    prevProps.error === nextProps.error &&
    prevProps.values === nextProps.values
  ))

AutocompleteController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  multiple: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ]),
  fieldProps: PropTypes.object
}

AutocompleteController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  multiple: false,
  values: [],
  error: false,
  fieldProps: undefined
}

AutocompleteController.displayName = 'AutocompleteController'

export default AutocompleteController
