/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import { TextField, Chip, Autocomplete } from '@mui/material'
import { useController, useWatch, useFormContext } from 'react-hook-form'

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
    optionsOnly = false,
    onConditionChange,
    watcher,
    dependencies,
    disableEnter = false,
  }) => {
    const {
      field: { value: renderValue, onBlur, onChange },
      fieldState: { error },
    } = useController({ name, control })

    const selected = multiple
      ? renderValue ?? []
      : values.find(({ value }) => value === renderValue) || renderValue

    const handleChange = useCallback(
      (_, newValue) => {
        const newValueToChange = multiple
          ? newValue?.map((value) =>
              typeof value === 'object' ? value.value : value
            )
          : newValue && typeof newValue === 'object'
          ? newValue.value
          : newValue

        onChange(newValueToChange ?? '')
        if (typeof onConditionChange === 'function') {
          onConditionChange(newValueToChange ?? '')
        }
      },
      [onChange, onConditionChange, multiple, renderValue]
    )

    // Add watcher to know if the dependencies fields have changes
    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const filterOptions = (options, { inputValue }) =>
      options?.filter((option) => {
        const optionText = typeof option?.text === 'string' ? option.text : ''
        const optionValue =
          typeof option?.value === 'string' ? option.value : ''

        const textMatch = optionText
          .toLowerCase()
          .includes(inputValue?.toLowerCase())
        const valueMatch = optionValue
          .toLowerCase()
          .includes(inputValue?.toLowerCase())

        return textMatch || valueMatch
      })

    const formContext = useFormContext()

    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch, { name, formContext })

      watcherValue !== undefined && onChange(watcherValue)
    }, [watch, watcher, dependencies])

    return (
      <Autocomplete
        fullWidth
        color="secondary"
        onBlur={onBlur}
        onChange={handleChange}
        onInputChange={(_, newInputValue, reason) => {
          // Processes the input in freesolo mode
          if (
            reason === 'input' &&
            (fieldProps?.freeSolo || !optionsOnly) &&
            !multiple
          ) {
            onChange(newInputValue)
            if (typeof onConditionChange === 'function') {
              onConditionChange(newInputValue)
            }
          }
        }}
        options={values}
        filterOptions={filterOptions}
        value={selected}
        multiple={multiple}
        freeSolo={!optionsOnly}
        renderOption={(props, option) => (
          <li {...props} data-value={option?.value ?? option?.text}>
            {option?.text}
          </li>
        )}
        renderTags={(tags, getTagProps) =>
          tags.map((tag, index) => {
            const labelTag =
              values.find((item) => item.value === tag)?.text || tag

            return (
              <Chip
                key={index}
                size="small"
                variant="outlined"
                label={labelTag}
                {...getTagProps({ index })}
              />
            )
          })
        }
        getOptionLabel={(option) =>
          typeof option === 'object' ? option.text : option
        }
        isOptionEqualToValue={(option, value) =>
          typeof option === 'object' ? option.value === value : option === value
        }
        renderInput={({ inputProps, ...inputParams }) => (
          <TextField
            label={<Translate word={label} />}
            inputProps={{
              ...inputProps,
              'data-cy': cy,
              ...(disableEnter
                ? { onKeyDown: (e) => e.key === 'Enter' && e.stopPropagation() }
                : {}),
            }}
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
  disableEnter: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object),
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  optionsOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
}

AutocompleteController.displayName = 'AutocompleteController'

export default AutocompleteController
