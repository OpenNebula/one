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

import PropTypes from 'prop-types'
import { Component, forwardRef, useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { Cancel } from 'iconoir-react'

import { Dropdown } from '@modules/componentsv2/primitives/Dropdown'
import { InputField } from '@modules/componentsv2/primitives/Fields/Default'
import { getStyles } from '@modules/componentsv2/primitives/MultiValueInput/Default/styles'

const MODES = {
  INPUT: 'input',
  SELECT: 'select',
}

const toText = (value) => (value == null ? '' : String(value))

const getOptionValue = (option) =>
  typeof option === 'object' ? option?.value : option

const includesValue = (values, value) =>
  values.some((current) => toText(current) === toText(value))

const splitValues = (value) =>
  toText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

/**
 * Adds multiple values from an input or a v2 dropdown and displays them as removable chips.
 *
 * @param {object} root0 - Component props
 * @param {'input'|'select'} root0.mode - Entry mode
 * @param {Array} root0.values - Selected values
 * @param {Array} root0.options - Select options
 * @param {Function} root0.onChange - Values change handler
 * @param {Function} root0.validateValue - Value validator
 * @param {string} root0.label - Field label
 * @param {string} root0.placeholder - Field placeholder
 * @param {string} root0.hint - Field hint
 * @param {string} root0.error - Error text
 * @param {Array} root0.markedValues - Values rendered with error styling
 * @param {boolean} root0.allowCustomValues - Allows free text in select mode
 * @param {number} root0.rowsDisplayed - Dropdown visible rows
 * @param {string} root0.dataCy - Input data-cy
 * @param {object} ref - Forwarded ref
 * @returns {Component} - Multi value input
 */
export const MultiValueInput = forwardRef(
  (
    {
      mode = MODES.INPUT,
      values = [],
      options = [],
      onChange,
      validateValue,
      label,
      placeholder,
      hint,
      error,
      markedValues = [],
      allowCustomValues = false,
      rowsDisplayed = 4,
      dataCy,
    },
    ref
  ) => {
    const [draft, setDraft] = useState('')
    const [selectKey, setSelectKey] = useState(0)

    const normalizedValues = useMemo(() => [].concat(values ?? []), [values])

    const availableOptions = useMemo(
      () =>
        options.filter(
          (option) => !includesValue(normalizedValues, getOptionValue(option))
        ),
      [options, normalizedValues]
    )

    const commitValues = (dirtyValues, source) => {
      const nextValues = [...normalizedValues]

      splitValues(dirtyValues).forEach((value) => {
        const isDuplicate = includesValue(nextValues, value)

        if (validateValue && !validateValue(value, { source, isDuplicate })) {
          return
        }

        if (!isDuplicate) {
          nextValues.push(value)
        }
      })

      if (nextValues.length !== normalizedValues.length) {
        onChange?.(nextValues)
      }
    }

    const handleSelectChange = (option) => {
      const rawValue = getOptionValue(option)
      if (rawValue == null || rawValue === '') return

      const source =
        typeof option === 'object' && option?.value !== undefined
          ? 'option'
          : 'input'

      commitValues(rawValue, source)
      setSelectKey((current) => current + 1)
    }

    const removeValue = (value) => {
      onChange?.(
        normalizedValues.filter((current) => toText(current) !== toText(value))
      )
    }

    const inputControl =
      mode === MODES.SELECT ? (
        <Box data-cy={dataCy}>
          <Dropdown
            key={selectKey}
            label={label}
            placeholder={placeholder}
            hint={hint}
            error={error}
            options={availableOptions}
            rowsDisplayed={rowsDisplayed}
            freeSolo={allowCustomValues}
            initialValue={null}
            onChange={handleSelectChange}
          />
        </Box>
      ) : (
        <InputField
          label={label}
          placeholder={placeholder}
          hint={hint}
          error={error}
          value={draft}
          onChange={setDraft}
          onBlur={() => {
            commitValues(draft, 'input')
            setDraft('')
          }}
          inputProps={{
            'data-cy': dataCy,
            onKeyDown: (event) => {
              if (event.key !== 'Enter' && event.key !== ',') return
              event.preventDefault()
              commitValues(draft, 'input')
              setDraft('')
            },
          }}
        />
      )

    return (
      <Box sx={(theme) => getStyles({ theme })} ref={ref}>
        {inputControl}

        {normalizedValues.length > 0 && (
          <Box className="multivalue-tags">
            {normalizedValues.map((value) => {
              const textValue = toText(value)
              const isMarked = includesValue(markedValues, value)

              return (
                <Box
                  key={textValue}
                  className={['multivalue-chip', isMarked && 'marked']
                    .filter(Boolean)
                    .join(' ')}
                  title={textValue}
                >
                  <span className="label">{textValue}</span>
                  <Box
                    component="button"
                    type="button"
                    className="remove"
                    onClick={() => removeValue(value)}
                  >
                    <Cancel />
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    )
  }
)

MultiValueInput.propTypes = {
  mode: PropTypes.oneOf(Object.values(MODES)),
  values: PropTypes.array,
  options: PropTypes.array,
  onChange: PropTypes.func,
  validateValue: PropTypes.func,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,
  markedValues: PropTypes.array,
  allowCustomValues: PropTypes.bool,
  rowsDisplayed: PropTypes.number,
  dataCy: PropTypes.string,
}

MultiValueInput.displayName = 'MultiValueInput'
