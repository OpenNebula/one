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

import { forwardRef, Component } from 'react'
import PropTypes from 'prop-types'
import { Box, TextField as MUITextField } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/TextField/styles'
import { adornments } from '@modules/componentsv2/primitives/TextField/adornments'
import { useControllableState } from '@HooksModule'
import { useTranslation } from '@ProvidersModule'

/**
 * TextField input component .
 *
 * @param {object} root0 - Params
 * @param {Function} root0.onChange - Callback when date is changed
 * @param {string} root0.placeholder - Placeholder text
 * @param {boolean} root0.filled - Filled background for input
 * @param {string} root0.status - Status indicator
 * @param {object} root0.children - Child elements
 * @param {string} root0.initialValue - Initial value
 * @param {object} root0.inputProps - inputProps forward
 * @param {object} root0.InputProps - InputProps forward
 * @returns {Component} - TextField component
 */
export const TextField = forwardRef(
  (
    {
      onClick,
      onChange,
      placeholder = '',
      isFilled,
      isOutlined = true,
      status = 'default',
      startIcon = null,
      endIcon = null,
      preTab = '',
      postTab = '',
      value,
      defaultValue,
      initialValue,
      children,
      inputProps,
      InputProps,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const [currentValue, setCurrentValue] = useControllableState({
      value,
      defaultValue: defaultValue ?? initialValue ?? '',
      onChange,
    })

    return (
      <Box
        className="textfield-container"
        sx={(theme) =>
          getStyles({
            theme,
            status,
            isFilled: isFilled ?? currentValue != null ?? false,
            defined: !!preTab || !!postTab,
            isOutlined,
          })
        }
        onClick={onClick}
        ref={ref}
      >
        <MUITextField
          onChange={(event) => {
            setCurrentValue(event?.target?.value)
          }}
          value={currentValue}
          className={'textfield-root'}
          variant="standard"
          placeholder={translate(placeholder)}
          inputProps={{
            ...inputProps,
            ...(typeof inputProps?.['aria-label'] === 'string' && {
              'aria-label': translate(inputProps['aria-label']),
            }),
            className: 'textfield-input',
          }}
          InputProps={{
            ...InputProps,
            className: 'textfield-input-wrapper',
            disableUnderline: true,
            ...adornments({ startIcon, endIcon, preTab, postTab }),
          }}
          {...opts}
          {...(typeof opts.label === 'string' && {
            label: translate(opts.label),
          })}
          {...(typeof opts.helperText === 'string' && {
            helperText: translate(opts.helperText),
          })}
        >
          {children}
        </MUITextField>
      </Box>
    )
  }
)

TextField.propTypes = {
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  placeholder: PropTypes.string,
  isFilled: PropTypes.bool,
  isOutlined: PropTypes.bool,
  status: PropTypes.string,
  endIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  startIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  preTab: PropTypes.string,
  postTab: PropTypes.string,
  children: PropTypes.array,
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  initialValue: PropTypes.string,
  inputProps: PropTypes.object,
  InputProps: PropTypes.object,
}

TextField.displayName = 'TextField'
