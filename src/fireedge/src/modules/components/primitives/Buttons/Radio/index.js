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

import {
  Box,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
} from '@mui/material'
import { forwardRef, Component } from 'react'
import { useControllableState } from '@HooksModule'
import {
  getStyles,
  getPlainStyles,
} from '@modules/components/primitives/Buttons/Radio/styles'
import PropTypes from 'prop-types'
import { useTranslation } from '@ProvidersModule'

/**
 * @param {object} root0 - Params
 * @param {Array} root0.options - List of options [{text,value}]
 * @param {Function} root0.onClick - OnClick handler when value is selected
 * @param {Function} root0.onChange - Plain variant selection change handler
 * @param {string} root0.variant - Default buttons or plain native radios
 * @param {string|number} root0.value - Controlled selected value
 * @param {string|number} root0.defaultValue - Initial uncontrolled value
 * @param {boolean} root0.isDisabled - Disable all options
 * @param {string} root0.dataCy - Testing identifier for the group and its options
 * @param {Function|object} root0.inputRef - Reference to the first radio input
 * @param {string} root0.size - Circle size
 * @param {string} root0.direction - Direction of radio buttons
 * @returns {Component} - Custom MUI Button component
 */
export const RadioButton = forwardRef(
  (
    {
      options = [],
      onClick = () => {},
      onChange,
      variant = 'default',
      value: selectedValue,
      defaultValue = null,
      isDisabled = false,
      dataCy,
      inputRef,
      size = 'small',
      direction = 'row',
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const [selected, setSelected] = useControllableState({
      value: selectedValue,
      defaultValue,
    })

    /* eslint-disable-next-line jsdoc/require-jsdoc */
    const handleSelect = (value, args) => {
      setSelected(value)
      onClick?.(value, args)
    }

    const handleChange = (event) => {
      const nextValue = options.find(
        (option) => String(option.value) === event.target.value
      )?.value

      setSelected(nextValue)
      onChange?.(nextValue)
    }

    if (variant === 'plain') {
      return (
        <RadioGroup
          sx={(theme) => getPlainStyles({ theme, size, direction })}
          ref={ref}
          data-cy={dataCy}
          {...opts}
          value={selected ?? ''}
          onChange={handleChange}
        >
          {[].concat(options)?.map(({ text, value }, index) => (
            <FormControlLabel
              key={value}
              value={value}
              disabled={isDisabled}
              label={translate(text)}
              className={'radiogroup-container'}
              control={
                <Radio
                  disableRipple
                  onClick={(...args) => onClick?.(value, args)}
                  inputRef={index === 0 ? inputRef : undefined}
                  inputProps={{
                    'data-cy': dataCy
                      ? `${dataCy}-${String(value).toLowerCase()}`
                      : undefined,
                  }}
                  icon={<Box className="radiocircle" />}
                  checkedIcon={<Box className="radiocircle selected" />}
                />
              }
            />
          ))}
        </RadioGroup>
      )
    }

    return (
      <Box
        sx={(theme) => getStyles({ theme, size, direction })}
        ref={ref}
        data-cy={dataCy}
        onChange={onChange}
        {...opts}
      >
        {[].concat(options)?.map(({ text, value }) => (
          <FormControlLabel
            key={value}
            value={value}
            label={translate(text)}
            className={'radiogroup-container'}
            control={
              <IconButton
                aria-label={`${translate('select')} ${translate(text)}`}
                disableFocusRipple
                disableRipple
                onClick={(...args) => handleSelect(value, args)}
              >
                <Box
                  className={`radiocircle${
                    value === selected ? ' selected' : ''
                  }`}
                />
              </IconButton>
            }
          />
        ))}
      </Box>
    )
  }
)

const RadioButtonPropTypes = {
  options: PropTypes.array,
  onClick: PropTypes.func,
  onChange: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'plain']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isDisabled: PropTypes.bool,
  dataCy: PropTypes.string,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  size: PropTypes.string,
  direction: PropTypes.string,
}

RadioButton.propTypes = RadioButtonPropTypes

RadioButton.displayName = 'RadioButton'
