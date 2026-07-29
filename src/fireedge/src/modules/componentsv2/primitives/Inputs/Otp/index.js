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

import { forwardRef, Component, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { Stack, Box, Typography } from '@mui/material'
import { DEFAULT_OTP_LENGTH } from '@ConstantsModule'
import { getDigits } from '@UtilsModule'
import { getStyles } from '@modules/componentsv2/primitives/Inputs/Otp/styles'
import { useTranslation } from '@ProvidersModule'

const getDigitValues = (value, length) => {
  const digits = getDigits(value, length)

  return Array.from({ length }, (_, index) => digits[index] ?? '')
}

const getActiveInputIndex = (values) => {
  const emptyIndex = values.findIndex((digit) => !digit)

  return emptyIndex === -1 ? values.length - 1 : emptyIndex
}

/**
 * OtpInput component.
 *
 * @param {object} root0 - Params
 * @param {string} root0.cy - Cypress selector prefix
 * @param {boolean} root0.isDisabled - Disable all OTP inputs
 * @param {string|boolean} root0.error - Error message or state
 * @param {string} root0.hint - Hint text
 * @param {string} root0.label - Label text
 * @param {number} root0.length - Number of OTP digits
 * @param {Function} root0.onBlur - Callback when an input loses focus
 * @param {Function} root0.onChange - Callback with the full OTP value
 * @param {string} root0.status - Status indicator
 * @param {string|number} root0.value - Current OTP value
 * @returns {Component} - OtpInput component
 */
export const OtpInput = forwardRef(
  (
    {
      isDisabled = false,
      cy = 'otp-input',
      error = '',
      hint = '',
      label = '',
      value = '',
      status = 'default',
      onBlur = () => {},
      onChange,
      length = DEFAULT_OTP_LENGTH,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const inputsRef = useRef([])
    const didAutoFocusRef = useRef(false)
    const [values, setValues] = useState(() => getDigitValues(value, length))
    const resolvedStatus = isDisabled ? 'disabled' : error ? 'error' : status
    const activeInputIndex = getActiveInputIndex(values)

    const focusInput = (index) => {
      window.requestAnimationFrame(() => inputsRef.current[index]?.focus())
    }

    useEffect(() => {
      setValues(getDigitValues(value, length))
    }, [length, value])

    useEffect(() => {
      if (isDisabled || didAutoFocusRef.current) return

      didAutoFocusRef.current = true
      focusInput(activeInputIndex)
    }, [activeInputIndex, isDisabled])

    const updateValue = (nextValues, nextFocus) => {
      const nextValue = nextValues.filter(Boolean).join('')

      setValues(nextValues)
      onChange(nextValue)
      Number.isInteger(nextFocus) && focusInput(nextFocus)
    }

    const fillFromIndex = (index, inputValue) => {
      const cleanValue = getDigits(inputValue, length)
      if (!cleanValue) return

      const nextValues = [...values]
      cleanValue.split('').forEach((digit, offset) => {
        const nextIndex = index + offset

        if (nextIndex < length) {
          nextValues[nextIndex] = digit
        }
      })

      const nextFocus = Math.min(index + cleanValue.length, length - 1)
      updateValue(nextValues, nextFocus)
    }

    const digitChange = (index) => (event) => {
      const cleanValue = getDigits(event.target.value, length)
      const inputData = getDigits(event.nativeEvent?.data, length)

      if (!cleanValue) {
        const nextValues = [...values]
        nextValues[index] = ''
        updateValue(nextValues, index)

        return
      }

      if (inputData && values[index]) {
        const nextValues = [...values]
        nextValues[index] = inputData
        updateValue(nextValues, Math.min(index + 1, length - 1))

        return
      }

      fillFromIndex(index, cleanValue)
    }

    const handleKeyDown = (index) => (event) => {
      if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault()
        focusInput(index - 1)

        return
      }

      if (event.key === 'ArrowRight' && index < length - 1) {
        event.preventDefault()
        focusInput(index + 1)

        return
      }

      if (event.key === 'Backspace' && !values[index] && index > 0) {
        event.preventDefault()

        const nextValues = [...values]
        nextValues[index - 1] = ''
        updateValue(nextValues, index - 1)
      }
    }

    const handlePaste = (index) => (event) => {
      event.preventDefault()
      fillFromIndex(index, event.clipboardData.getData('text'))
    }

    const handleBlur = (event) => {
      if (inputsRef.current.includes(event.relatedTarget)) return

      onBlur(event)
    }

    return (
      <Stack
        className="otpinput"
        ref={ref}
        sx={(theme) => getStyles({ theme, status: resolvedStatus })}
      >
        <Typography
          variant="subtitle2"
          className={`text ${error ? 'error' : ''} ${
            isDisabled ? 'disabled' : ''
          }`}
        >
          {translate(label)}
        </Typography>
        <Box className="input-wrapper">
          {values.map((digit, index) => {
            const isInputDisabled = isDisabled || index > activeInputIndex

            return (
              <Box
                key={index}
                className="input"
                component="input"
                data-cy={`${cy}-${index + 1}`}
                inputMode="numeric"
                onBlur={handleBlur}
                onChange={digitChange(index)}
                onKeyDown={handleKeyDown(index)}
                onPaste={handlePaste(index)}
                pattern="[0-9]*"
                ref={(input) => {
                  inputsRef.current[index] = input
                }}
                type="text"
                value={digit}
                {...opts}
                disabled={isInputDisabled}
              />
            )
          })}
        </Box>
        <Typography
          variant="caption"
          className={clsx('text', 'hint', isDisabled && 'disabled')}
        >
          {translate(hint)}
        </Typography>
        {error && (
          <Typography variant="caption" className="text hint error">
            {typeof error === 'string' ? translate(error) : error}
          </Typography>
        )}
      </Stack>
    )
  }
)

OtpInput.propTypes = {
  cy: PropTypes.string,
  isDisabled: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  hint: PropTypes.string,
  label: PropTypes.string,
  length: PropTypes.number,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  status: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

OtpInput.displayName = 'OtpInput'
