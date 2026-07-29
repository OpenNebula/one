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

import { Component, forwardRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Slider as MUISlider } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Slider/Default/styles'

/**
 * Slider component for selecting a value from a range.
 *
 * @param {object} root0 - Params
 * @param {number} root0.value - Controlled value
 * @param {number} root0.defaultValue - Default value for uncontrolled mode
 * @param {number} root0.min - Minimum value
 * @param {number} root0.max - Maximum value
 * @param {number} root0.step - Step increment
 * @param {boolean} root0.isDisabled - IsDisabled state
 * @param {Function} root0.onChange - Change handler
 * @returns {Component} - Slider component
 */
export const Slider = forwardRef(
  (
    {
      value,
      defaultValue = 0,
      min = 0,
      max = 100,
      step = 1,
      isDisabled = false,
      onChange,
      ...opts
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue)

    const currentValue = value ?? internalValue

    const handleChange = (event, newValue) => {
      if (value === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(event, newValue)
    }

    return (
      <MUISlider
        ref={ref}
        value={currentValue}
        min={min}
        max={max}
        step={step}
        disabled={isDisabled}
        onChange={handleChange}
        sx={(theme) => getStyles({ theme })}
        {...opts}
      />
    )
  }
)

Slider.propTypes = {
  value: PropTypes.number,
  defaultValue: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  isDisabled: PropTypes.bool,
  onChange: PropTypes.func,
}

Slider.displayName = 'Slider'
