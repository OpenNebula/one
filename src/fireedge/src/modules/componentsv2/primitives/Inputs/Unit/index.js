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

import { Component, forwardRef } from 'react'
import PropTypes from 'prop-types'

import { InputAdornment, MenuItem, Select } from '@mui/material'

import { InputField } from '@modules/componentsv2/primitives/Fields'
import { getStyles } from '@modules/componentsv2/primitives/Inputs/Unit/styles'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

/**
 * Input with a unit selector embedded at the end.
 *
 * @param {object} props - Props
 * @param {string} props.cy - Cypress selector prefix
 * @param {boolean} props.isDisabled - Disable input and unit selector
 * @param {Function} props.onUnitChange - Unit selector change callback
 * @param {string} props.unit - Current unit
 * @param {string[]} props.units - Unit options
 * @param {string|number} props.value - Current input value
 * @returns {Component} Unit input
 */
export const UnitInput = forwardRef(
  (
    {
      cy = 'unit-input',
      InputProps = {},
      inputProps = {},
      isDisabled = false,
      onUnitChange,
      unit = '',
      unitLabel = T.MemoryUnit,
      units = [],
      ...props
    },
    ref
  ) => {
    const { translate } = useTranslation()

    const isReadOnly = isDisabled || InputProps.readOnly

    return (
      <InputField
        {...props}
        ref={ref}
        isDisabled={isReadOnly}
        inputProps={{
          'data-cy': cy,
          ...inputProps,
        }}
        InputProps={{
          ...InputProps,
          readOnly: isReadOnly,
          endAdornment: (
            <>
              {InputProps.endAdornment}
              <InputAdornment
                className="textfield-adornment-end"
                position="end"
                sx={(theme) => getStyles({ theme }).adornment}
              >
                <Select
                  data-cy={`${cy}-unit`}
                  value={unit}
                  onChange={(event) => onUnitChange?.(event.target.value)}
                  variant="standard"
                  disableUnderline
                  disabled={isReadOnly}
                  inputProps={{
                    'aria-label': translate(unitLabel),
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: (theme) => getStyles({ theme }).menuPaper,
                    },
                  }}
                  sx={(theme) => getStyles({ theme }).select}
                >
                  {units.map((option, index) => (
                    <MenuItem
                      key={`${option}-${index}`}
                      value={option}
                      data-cy={`${cy}-unit-${option}`}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </InputAdornment>
            </>
          ),
        }}
      />
    )
  }
)

UnitInput.propTypes = {
  cy: PropTypes.string,
  InputProps: PropTypes.object,
  inputProps: PropTypes.object,
  isDisabled: PropTypes.bool,
  onUnitChange: PropTypes.func,
  unit: PropTypes.string,
  unitLabel: PropTypes.string,
  units: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

UnitInput.displayName = 'UnitInput'
