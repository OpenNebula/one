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

import { Box, FormControlLabel, Checkbox as MUICheckbox } from '@mui/material'
import { forwardRef, Component } from 'react'
import { getStyles } from '@modules/componentsv2/primitives/Buttons/Checkbox/styles'
import { CheckSvg as CheckedIcon } from '@modules/componentsv2/primitives/Buttons/Checkbox/checkSvg'
import { MinusSvg as IndeterminateIcon } from '@modules/componentsv2/primitives/Buttons/Checkbox/minusSvg'
import PropTypes from 'prop-types'
import { useControllableState } from '@HooksModule'
import clsx from 'clsx'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} root0 - Params
 * @param {Array} root0.options - List of options [{text,value, disabled, checked}]
 * @param {Function} root0.onClick - OnClick handler when value is selected
 * @param {string} root0.size - Circle size
 * @param {string} root0.direction - Direction of checkbox buttons
 * @returns {Component} - Custom MUI Checkbox component
 */
export const Checkbox = forwardRef(
  (
    {
      text = '',
      value,
      onChange,
      checked = false,
      size = 'medium',
      status = 'default',
      isDisabled = false,
      inputProps,
      ...opts
    },
    ref
  ) => {
    const { translateText } = useTranslation()
    const isSmall = size === 'small'
    const [isCheckedInternal, setIsCheckedInternal] = useControllableState({
      value: checked,
      defaultValue: false,
      onChange,
    })

    return (
      <Box
        sx={(theme) => getStyles({ theme, size, status })}
        ref={ref}
        {...opts}
      >
        <FormControlLabel
          disabled={isDisabled}
          className="checkbox-container"
          value={value}
          label={translateText(text)}
          componentsProps={{
            typography: { className: 'checkbox-label' },
          }}
          control={
            <MUICheckbox
              className={clsx('checkbox-input-container', {
                'checkbox-selected': isCheckedInternal === true,
                'checkbox-indeterminate': isCheckedInternal === null,
              })}
              disableRipple
              icon={<Box className="checkbox-unchecked-icon" />}
              inputProps={{ className: 'checkbox-input', ...inputProps }}
              indeterminate={isCheckedInternal === null}
              checkedIcon={
                <Box className="checkbox-checked-icon">
                  <CheckedIcon
                    className="checkbox-check-svg"
                    dimensions={
                      isSmall
                        ? { height: 9, width: 12 }
                        : { height: 12, width: 16 }
                    }
                  />
                </Box>
              }
              indeterminateIcon={
                <Box className="checkbox-indeterminate-icon">
                  <IndeterminateIcon
                    className="checkbox-dash-svg"
                    dimensions={
                      isSmall
                        ? { height: 16, width: 16 }
                        : { height: 24, width: 24 }
                    }
                  />
                </Box>
              }
              checked={isCheckedInternal ?? false}
              onChange={(_, val) => {
                const next = isCheckedInternal === null ? false : val
                setIsCheckedInternal(next)
              }}
            />
          }
        />
      </Box>
    )
  }
)

Checkbox.propTypes = {
  text: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  size: PropTypes.oneOf(['small', 'medium']),
  status: PropTypes.string,
  checked: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf([null])]),
  isDisabled: PropTypes.bool,
  inputProps: PropTypes.object,
}
Checkbox.displayName = 'Checkbox'
