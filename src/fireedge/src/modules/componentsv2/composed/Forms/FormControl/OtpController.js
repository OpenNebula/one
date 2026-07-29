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
import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { OtpInput } from '@modules/componentsv2/primitives/Inputs'
import { useController, useFormContext } from 'react-hook-form'
import { DEFAULT_OTP_LENGTH } from '@ConstantsModule'
import {
  generateKey,
  getDigits,
  sentenceCase,
  isTranslationInput,
} from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

export const OtpController = memo(
  ({
    control,
    cy = `otp-${generateKey()}`,
    name = '',
    label = '',
    fieldProps = {},
    defaultValue,
  }) => {
    const { translate } = useTranslation()
    const { clearErrors, trigger } = useFormContext()
    const {
      hint = '',
      length = DEFAULT_OTP_LENGTH,
      disabled: isDisabled = false,
      ...otpProps
    } = fieldProps

    const {
      field: { value = '', onChange, onBlur },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    const handleChange = useCallback(
      (nextValue) => {
        onChange(nextValue)

        if (getDigits(nextValue, length).length === length) {
          clearErrors(name)
        }
      },
      [clearErrors, length, name, onChange]
    )

    const handleBlur = useCallback(() => {
      onBlur()
      trigger(name)
    }, [name, onBlur, trigger])

    const errorMessage = sentenceCase(
      [error?.message]
        ?.flat()
        ?.map((message) => message?.trim())
        ?.join(' ')
    )
    const trHint = isTranslationInput(hint) ? translate(hint) : hint
    const trLabel = isTranslationInput(label) ? translate(label) : label

    return (
      <OtpInput
        cy={cy}
        error={errorMessage}
        hint={trHint}
        label={trLabel}
        length={length}
        onBlur={handleBlur}
        onChange={handleChange}
        value={value}
        isDisabled={isDisabled}
        {...otpProps}
      />
    )
  },
  (prevProps, nextProps) =>
    prevProps.label === nextProps.label &&
    prevProps.fieldProps?.hint === nextProps.fieldProps?.hint &&
    prevProps.fieldProps?.length === nextProps.fieldProps?.length
)

OtpController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  fieldProps: PropTypes.object,
  defaultValue: PropTypes.string,
}

OtpController.displayName = 'OtpController'
