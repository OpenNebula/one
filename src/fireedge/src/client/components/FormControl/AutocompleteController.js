/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { memo } from 'react'
import PropTypes from 'prop-types'

import { TextField, Chip, Autocomplete } from '@mui/material'
import { useController } from 'react-hook-form'

import { ErrorHelper } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const AutocompleteController = memo(
  ({
    control,
    cy = `autocomplete-${generateKey()}`,
    name = '',
    label = '',
    tooltip = '',
    multiple = false,
    values = [],
    fieldProps: { separators, ...fieldProps } = {},
    readOnly = false,
  }) => {
    const {
      field: { value: renderValue, onBlur, onChange },
      fieldState: { error },
    } = useController({ name, control })

    const selected = multiple
      ? renderValue ?? []
      : values.find(({ value }) => value === renderValue) ?? null

    return (
      <Autocomplete
        fullWidth
        color="secondary"
        onBlur={onBlur}
        onChange={(_, newValue) => {
          const newValueToChange = multiple
            ? newValue?.map((value) =>
                typeof value === 'string' ? value : { text: value, value }
              )
            : newValue?.value

          return onChange(newValueToChange ?? '')
        }}
        options={values}
        value={selected}
        multiple={multiple}
        renderTags={(tags, getTagProps) =>
          // render when freesolo prop
          tags.map((tag, index) => (
            <Chip
              key={tag}
              size="small"
              variant="outlined"
              label={tag}
              {...getTagProps({ index })}
            />
          ))
        }
        getOptionLabel={(option) => option.text}
        isOptionEqualToValue={(option) => option.value === renderValue}
        renderInput={({ inputProps, ...inputParams }) => (
          <TextField
            label={labelCanBeTranslated(label) ? Tr(label) : label}
            inputProps={{ ...inputProps, 'data-cy': cy }}
            InputProps={{ readOnly }}
            error={Boolean(error)}
            helperText={
              Boolean(error) && <ErrorHelper label={error?.message} />
            }
            FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
            {...inputParams}
          />
        )}
        {...(tooltip && {
          loading: true,
          loadingText: labelCanBeTranslated(tooltip) ? Tr(tooltip) : tooltip,
        })}
        {...(Array.isArray(separators) && {
          autoSelect: true,
          onInputChange: (event, newInputValue) => {
            if (separators.includes([...newInputValue].at(-1))) {
              event.target.blur()
              event.target.focus()
            }
          },
        })}
        {...fieldProps}
      />
    )
  },
  (prevProps, nextProps) => prevProps.values === nextProps.values
)

AutocompleteController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  multiple: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object),
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
}

AutocompleteController.displayName = 'AutocompleteController'

export default AutocompleteController
