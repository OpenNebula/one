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
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Fields/Default/styles'
import { TextField } from '@modules/componentsv2/primitives/TextField'
import { AlertNotification } from '@modules/componentsv2/primitives/AlertNotification'
import { Label } from '@modules/componentsv2/primitives/Labels/Default'
import { useTranslation } from '@ProvidersModule'

/**
 * Text input field component.
 *
 * @param {object} root0 - Params
 * @param {string} root0.label - Label text
 * @param {string} root0.hint - Hint text
 * @param {object} root0.children - Child elements
 * @param {string} root0.defaultValue - Initial value
 * @returns {Component} - InputField component
 */
export const InputField = forwardRef(
  (
    {
      onChange,
      onClick,
      status = 'default',
      label,
      isOptional = false,
      isRequired = false,
      isDisabled = false,
      tooltip = '',
      hint,
      error,
      errorDataCy,
      defaultValue,
      initialValue,
      children,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const resolvedStatus = error ? 'error' : isDisabled ? 'disabled' : status

    return (
      <Box
        sx={(theme) =>
          getStyles({
            theme,
          })
        }
        ref={ref}
      >
        {label && (
          <Label
            isRequired={isRequired}
            isOptional={isOptional}
            tooltip={tooltip}
            className="inputfield-label"
          >
            {label}
          </Label>
        )}
        <TextField
          onClick={onClick}
          onChange={onChange}
          defaultValue={defaultValue ?? initialValue}
          status={resolvedStatus}
          {...opts}
        >
          {children}
        </TextField>
        {hint && <Box className="inputfield-hint">{translate(hint)}</Box>}
        {error && (
          <AlertNotification
            data-cy={errorDataCy}
            description={error}
            type={'inline'}
            status={'error'}
          />
        )}
      </Box>
    )
  }
)

InputField.propTypes = {
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  label: PropTypes.string,
  status: PropTypes.string,
  error: PropTypes.string,
  errorDataCy: PropTypes.string,
  hint: PropTypes.string,
  children: PropTypes.array,
  defaultValue: PropTypes.string,
  initialValue: PropTypes.string,
  isOptional: PropTypes.bool,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool,
  tooltip: PropTypes.string,
}

InputField.displayName = 'InputField'
