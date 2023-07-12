/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'

import { TextField, Chip, Autocomplete } from '@mui/material'
import { useController } from 'react-hook-form'

import { ErrorHelper } from 'client/components/FormControl'
import { Translate } from 'client/components/HOC'
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
    onConditionChange,
  }) => {
    const {
      field: { value: renderValue, onBlur, onChange },
      fieldState: { error },
    } = useController({ name, control })

    const selected = multiple
      ? renderValue ?? []
      : values.find(({ value }) => value === renderValue) ?? null

    const handleChange = useCallback(
      (_, newValue) => {
        const newValueToChange = multiple
          ? newValue?.map((value) =>
              ['string', 'number'].includes(typeof value)
                ? value
                : { text: value, value }
            )
          : newValue?.value

        onChange(newValueToChange ?? '')
        if (typeof onConditionChange === 'function') {
          onConditionChange(newValueToChange ?? '')
        }
      },
      [onChange, onConditionChange, multiple]
    )

    return (
      <Autocomplete
        fullWidth
        color="secondary"
        onBlur={onBlur}
        onChange={handleChange}
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
            label={<Translate word={label} />}
            inputProps={{ ...inputProps, 'data-cy': cy }}
            InputProps={{ readOnly }}
            error={Boolean(error)}
            helperText={
              Boolean(error) && (
                <ErrorHelper label={error?.message ?? error[0]?.message}>
                  {tooltip &&
                    inputProps?.value?.length > 0 &&
                    `. ${(<Translate word={tooltip} />)}`}
                </ErrorHelper>
              )
            }
            FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
            {...inputParams}
          />
        )}
        {...(tooltip && {
          loading: true,
          loadingText: <Translate word={tooltip} />,
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
  onConditionChange: PropTypes.func,
}

AutocompleteController.displayName = 'AutocompleteController'

export default AutocompleteController
