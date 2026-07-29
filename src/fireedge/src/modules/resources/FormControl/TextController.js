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
import { memo, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { TextArea, InputField } from '@ComponentsV2Module'
import { useController, useWatch, useFormContext } from 'react-hook-form'
import { sentenceCase, generateKey, isTranslationInput } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

const TextController = memo(
  ({
    control,
    cy = `input-${generateKey()}`,
    name = '',
    label = '',
    type = 'text',
    multiline = false,
    tooltip,
    watcher,
    dependencies,
    fieldProps = {},
    onConditionChange,
    defaultValue,
  }) => {
    const { translate } = useTranslation()
    const {
      hint,
      placeholder,
      isRequired = false,
      isOptional = false,
      ...restFieldProps
    } = fieldProps

    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const {
      field: { ref, value = '', onChange, onBlur, ...inputProps },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    const formContext = useFormContext()

    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch, { name, formContext })

      watcherValue !== undefined && onChange(watcherValue)
    }, [watch, watcher, dependencies])

    const handleChange = useCallback(
      (val) => {
        onBlur()
        const condition = val === '' ? undefined : val
        onChange(condition)
        if (typeof onConditionChange === 'function') {
          onConditionChange(condition)
        }
      },
      [onChange, onConditionChange]
    )

    const trLabel = isTranslationInput(label) ? translate(label) : label

    return multiline ? (
      <TextArea
        {...restFieldProps}
        {...inputProps}
        inputRef={ref}
        onChange={handleChange}
        minRows={8}
        type={type}
        label={trLabel}
        placeholder={placeholder || 'Placeholder'}
        initialValue={value}
        tooltip={tooltip}
      />
    ) : (
      <InputField
        {...restFieldProps}
        isRequired={isRequired}
        isOptional={isOptional}
        inputRef={ref}
        initialValue={value}
        onChange={handleChange}
        type={type}
        label={trLabel}
        placeholder={placeholder || 'Placeholder'}
        hint={hint}
        error={sentenceCase(
          [error?.message]
            ?.flat()
            ?.map((s) => s?.trim())
            ?.join(' ')
        )}
      />
    )
  },
  (prevProps, nextProps) =>
    prevProps.type === nextProps.type &&
    prevProps.label === nextProps.label &&
    prevProps.tooltip === nextProps.tooltip &&
    prevProps.fieldProps?.value === nextProps.fieldProps?.value &&
    prevProps.fieldProps?.helperText === nextProps.fieldProps?.helperText &&
    prevProps.readOnly === nextProps.readOnly
)

TextController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  type: PropTypes.string,
  multiline: PropTypes.bool,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  fieldProps: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
  defaultValue: PropTypes.string,
}

TextController.displayName = 'TextController'

export default TextController
