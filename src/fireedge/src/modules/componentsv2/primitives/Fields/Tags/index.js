/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { useControllableState } from '@HooksModule'
import { forwardRef, useMemo, useState, Component } from 'react'
import PropTypes from 'prop-types'
import { Autocomplete as MUIAutocomplete, Box } from '@mui/material'
import { Cancel } from 'iconoir-react'
import { InputField } from '@modules/componentsv2/primitives/Fields/Default'
import { Tag } from '@modules/componentsv2/primitives/Tags'
import {
  getStyles,
  getMenuStyles,
  getListStyles,
} from '@modules/componentsv2/primitives/Fields/Tags/styles'

const toText = (value) => (value == null ? '' : String(value))

const getOptionValue = (option) =>
  typeof option === 'object' ? option?.value ?? option?.text : option

const getOptionText = (option) =>
  typeof option === 'object' ? option?.text ?? option?.value : option

const getOptionDescription = (option) =>
  typeof option === 'object' ? option?.description : undefined

const normalizeValues = (value) =>
  Array.isArray(value) ? value : value == null ? [] : [value]

const optionMatchesValue = (option, value) =>
  toText(getOptionValue(option)) === toText(getOptionValue(value)) ||
  toText(getOptionText(option)) === toText(getOptionValue(value))

const resolveValue = (value, options) =>
  normalizeValues(value).map(
    (item) => options.find((option) => optionMatchesValue(option, item)) ?? item
  )

const getPlaceholderMinWidth = (text) => {
  const baseWidth = toText(text).length * 8 + 96

  return Math.min(Math.max(baseWidth, 240), 360)
}

/**
 * Free-solo multi Tag input with autocomplete and removable tags.
 *
 * @param {object} root0 - Component props
 * @param {Array} root0.value - Controlled selected values
 * @param {Array} root0.defaultValue - Initial selected values for uncontrolled mode
 * @param {Array} root0.options - Autocomplete options
 * @param {Function} root0.onChange - Selected values change handler
 * @param {Function} root0.onBlur - Blur handler
 * @param {string} root0.label - Field label
 * @param {string} root0.placeholder - Field placeholder
 * @param {string} root0.hint - Field hint
 * @param {string} root0.error - Error text
 * @param {boolean} root0.freeSolo - Allow custom values
 * @param {boolean} root0.isReadOnly - Read-only input
 * @param {Function} root0.parseFreeSoloValue - Custom parser for typed values
 * @param {Array} root0.separators - Characters that commit the current input
 * @param {number} root0.rowsDisplayed - Number of visible menu rows
 * @param {number|string} root0.inputMinHeight - Minimum input height
 * @param {string} root0.dataCy - Input data-cy
 * @param {boolean} root0.isDisableEnter - Stop Enter propagation
 * @param {object} ref - Forwarded ref
 * @returns {Component} - Tag input component
 */
export const TagsInput = forwardRef(
  (
    {
      value,
      defaultValue = [],
      options = [],
      onChange,
      onBlur,
      label,
      placeholder,
      hint,
      tooltip,
      error,
      isReadOnly = false,
      freeSolo = true,
      parseFreeSoloValue,
      separators = ['Enter'],
      rowsDisplayed = 4,
      inputMinHeight,
      dataCy,
      isDisableEnter = false,
      ...autocompleteProps
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState('')
    const [currentValue, setCurrentValue] = useControllableState({
      value,
      defaultValue,
      onChange,
    })

    const selected = useMemo(
      () => resolveValue(currentValue, options),
      [currentValue, options]
    )
    const hasSelectedValues = selected.length > 0
    const hasOptions = options.length > 0

    const menuProps = {
      ...(freeSolo && { forcePopupIcon: false }),
      ...(!hasOptions && {
        open: false,
        forcePopupIcon: false,
      }),
    }
    const placeholderText = placeholder ?? label
    const placeholderMinWidth = useMemo(
      () => getPlaceholderMinWidth(placeholderText),
      [placeholderText]
    )

    const normalizeSelectedValues = (selection) =>
      normalizeValues(selection).map(getOptionValue)

    const normalizeFreeSoloValue = (dirtyValue) => {
      const rawValue = getOptionValue(dirtyValue)
      if (rawValue == null || rawValue === '') return []

      if (typeof parseFreeSoloValue !== 'function') return [rawValue]

      const parsedValue = parseFreeSoloValue(rawValue)

      return Array.isArray(parsedValue) ? parsedValue : [parsedValue]
    }

    const handleChange = (_, nextValue) => {
      setCurrentValue(normalizeSelectedValues(nextValue))
    }

    const commitInputValue = (dirtyValue) => {
      const valueToCommit = toText(dirtyValue).trim()
      if (!freeSolo || valueToCommit === '') return

      setCurrentValue([
        ...normalizeSelectedValues(selected),
        ...normalizeFreeSoloValue(valueToCommit),
      ])

      setInputValue('')
    }

    const handleInputChange = (_, nextInputValue, reason) => {
      if (reason !== 'input') {
        setInputValue(nextInputValue)

        return
      }

      const separator = separators.find((item) => nextInputValue.endsWith(item))

      if (separator) {
        commitInputValue(nextInputValue.slice(0, -separator.length))

        return
      }

      setInputValue(nextInputValue)
    }

    const filterOptions = (items, { inputValue: filter }) => {
      if (!hasOptions) return []

      return items.filter((option) => {
        const candidate = [
          getOptionText(option),
          getOptionValue(option),
          getOptionDescription(option),
        ]
          .filter((item) => item != null)
          .join(' ')
          .toLowerCase()

        return candidate.includes(toText(filter).toLowerCase())
      })
    }

    return (
      <Box
        className={hasSelectedValues ? 'has-values' : undefined}
        sx={(theme) =>
          getStyles({ theme, placeholderMinWidth, inputMinHeight })
        }
        ref={ref}
      >
        <MUIAutocomplete
          {...autocompleteProps}
          {...menuProps}
          className="autocomplete-root"
          fullWidth
          multiple
          filterSelectedOptions
          freeSolo={freeSolo}
          onBlur={onBlur}
          onChange={handleChange}
          onInputChange={handleInputChange}
          inputValue={inputValue}
          value={selected}
          options={options}
          filterOptions={filterOptions}
          getOptionLabel={(option) => toText(getOptionText(option))}
          isOptionEqualToValue={optionMatchesValue}
          ListboxProps={{
            sx: (theme) => getListStyles({ theme, rowsDisplayed }),
          }}
          componentsProps={{
            paper: {
              className: 'autocomplete-menu-paper',
              sx: (theme) => getMenuStyles({ theme }),
            },
          }}
          renderTags={(tags, getTagProps) =>
            tags.map((tag, index) => {
              const { key, onDelete, className, ...tagProps } = getTagProps({
                index,
              })
              const tagLabel = toText(getOptionText(tag))

              return (
                <Tag
                  key={key ?? `${tagLabel}-${index}`}
                  title={tagLabel}
                  isInteractive
                  endIcon={<Cancel />}
                  className={[className, 'autocomplete-tag']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete?.(event)
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Backspace' && event.key !== 'Delete') {
                      return
                    }

                    onDelete?.(event)
                  }}
                  {...tagProps}
                />
              )
            })
          }
          renderOption={({ className, ...optionProps }, option) => (
            <li
              {...optionProps}
              className={[className, 'autocomplete-option']
                .filter(Boolean)
                .join(' ')}
            >
              <span className="autocomplete-option-text">
                {toText(getOptionText(option))}
              </span>
              {getOptionDescription(option) && (
                <span className="autocomplete-option-description">
                  {toText(getOptionDescription(option))}
                </span>
              )}
            </li>
          )}
          renderInput={({ InputProps, inputProps }) => (
            <InputField
              label={label}
              placeholder={hasSelectedValues ? undefined : placeholderText}
              hint={hint}
              tooltip={tooltip}
              error={error}
              inputProps={{
                ...inputProps,
                readOnly: isReadOnly,
                'data-cy': dataCy,
                onKeyDown: (event) => {
                  inputProps?.onKeyDown?.(event)

                  if (isDisableEnter && event.key === 'Enter') {
                    event.stopPropagation()

                    return
                  }

                  if (
                    event.defaultPrevented ||
                    !separators.includes(event.key)
                  ) {
                    return
                  }

                  event.preventDefault()
                  commitInputValue(event.currentTarget.value)
                },
              }}
              InputProps={InputProps}
            />
          )}
        />
      </Box>
    )
  }
)

TagsInput.propTypes = {
  value: PropTypes.array,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  options: PropTypes.array,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  hint: PropTypes.string,
  tooltip: PropTypes.any,
  error: PropTypes.string,
  freeSolo: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  parseFreeSoloValue: PropTypes.func,
  separators: PropTypes.arrayOf(PropTypes.string),
  rowsDisplayed: PropTypes.number,
  inputMinHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  dataCy: PropTypes.string,
  isDisableEnter: PropTypes.bool,
}

TagsInput.displayName = 'TagsInput'
