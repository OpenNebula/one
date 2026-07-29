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

import { forwardRef, Component, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, TextareaAutosize as MUITextArea, Typography } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/TextArea/Default/styles'
import { T } from '@ConstantsModule'
import { renderIcon } from '@UtilsModule'
import { Label } from '@modules/componentsv2/primitives/Labels/Default'
import { useTranslation } from '@ProvidersModule'

/**
 * TextArea input component .
 *
 * @param {object} root0 - Params
 * @param {Function} root0.onChange - Callback when date is changed
 * @param {string} root0.label - Label text
 * @param {string} root0.hint - Hint text
 * @param {string} root0.placeholder - Placeholder text
 * @param {string} root0.tooltip - Tooltip text
 * @param {boolean} root0.isFilled - Filled background
 * @param {boolean} root0.isRequired - Required marker
 * @param {boolean} root0.isOptional - Optional marker
 * @param {boolean} root0.isCountChars - Show character counter
 * @param {string} root0.status - Status indicator
 * @param {string} root0.startIcon - Start input icon
 * @param {string} root0.initialValue - Initial value
 * @param {string} root0.endIcon - End input icon
 * @param {number} root0.minRows - Mininmum rows to display
 * @param {number} root0.maxRows - Maximum rows to display
 * @returns {Component} - TextArea component
 */
export const TextArea = forwardRef(
  (
    {
      onChange,
      label = '',
      hint = '',
      placeholder = '',
      tooltip = '',
      isFilled = false,
      isRequired = false,
      isOptional = false,
      isCountChars = false,
      status = 'default',
      startIcon = null,
      endIcon = null,
      initialValue,
      minRows = 8,
      maxRows,
      inputProps,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const [value, setValue] = useState(initialValue ?? '')
    const [charCount, setCharCount] = useState(null)

    useEffect(() => {
      setValue(initialValue ?? '')
    }, [initialValue])

    useEffect(() => {
      onChange?.(value)
      setCharCount(value?.length ?? 0)
    }, [value])

    return (
      <Box
        sx={(theme) =>
          getStyles({
            theme,
            status,
            isFilled,
            isOptional,
            isIconOffset: !!startIcon || !!endIcon,
          })
        }
        ref={ref}
        {...opts}
      >
        {label && (
          <Label
            isRequired={isRequired}
            isOptional={isOptional}
            tooltip={tooltip}
          >
            {label}
          </Label>
        )}
        {hint && (
          <Typography className={'textarea-hint'}>{translate(hint)}</Typography>
        )}
        <Box className={'textarea-container'}>
          {startIcon && renderIcon(startIcon, { className: 'start-icon' })}
          <Box
            component={MUITextArea}
            className={'textarea'}
            variant="body1"
            value={value}
            placeholder={translate(placeholder)}
            minRows={minRows}
            maxRows={maxRows}
            {...inputProps}
            onChange={(event) => {
              setValue(event?.target?.value)
            }}
          />

          {endIcon && renderIcon(endIcon, { className: 'end-icon' })}
        </Box>
        {isCountChars && (
          <Typography className={'textarea-character-count'}>
            {translate(T.CharCount)}
            {charCount > 0 ? ` ${charCount}` : ''}
          </Typography>
        )}
      </Box>
    )
  }
)

TextArea.propTypes = {
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  onChange: PropTypes.func,
  isFilled: PropTypes.bool,
  isRequired: PropTypes.bool,
  isOptional: PropTypes.bool,
  isCountChars: PropTypes.bool,
  status: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  tooltip: PropTypes.string,
  hint: PropTypes.string,
  initialValue: PropTypes.string,
  minRows: PropTypes.number,
  maxRows: PropTypes.number,
  inputProps: PropTypes.object,
}

TextArea.displayName = 'TextArea'
