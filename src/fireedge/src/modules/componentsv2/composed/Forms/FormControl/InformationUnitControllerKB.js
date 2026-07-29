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
import PropTypes from 'prop-types'
import { memo, useCallback, useEffect, useState } from 'react'

import { useController, useWatch } from 'react-hook-form'

import { UnitInput } from '@modules/componentsv2/primitives/Inputs'
import {
  generateKey,
  isTranslationInput,
  prettyBytes,
  sentenceCase,
} from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { T, UNITS } from '@ConstantsModule'

const ARRAY_UNITS = Object.values(UNITS)
const DEFAULT_UNIT = ARRAY_UNITS[0]

const valueInMB = (value = 0, unit = DEFAULT_UNIT) => {
  const idxUnit = ARRAY_UNITS.indexOf(unit)
  const numberValue = +value

  return Math.round(numberValue * (idxUnit <= 0 ? 1 : 1024 ** idxUnit))
}

export const InformationUnitControllerKB = memo(
  ({
    control,
    cy = `input-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    watcher,
    dependencies,
    fieldProps = {},
    readOnly = false,
    onConditionChange,
  }) => {
    const { translate } = useTranslation()
    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const {
      field: { ref, value = '', onChange, ...inputProps },
      fieldState: { error },
    } = useController({ name, control })

    const safeFieldProps =
      fieldProps && typeof fieldProps === 'object' ? fieldProps : {}

    const {
      InputProps: fieldInputProps = {},
      disabled: fieldDisabled = false,
      hint,
      helperText,
      inputProps: fieldHtmlInputProps = {},
      isOptional = false,
      isRequired = false,
      max,
      min,
      placeholder,
      readOnly: fieldReadOnly = false,
      step,
      ...restFieldProps
    } = safeFieldProps

    const isReadOnly =
      readOnly || fieldReadOnly || fieldDisabled || fieldInputProps.readOnly

    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch)
      watcherValue !== undefined && onChange(watcherValue)
    }, [watch, watcher, dependencies])

    const [internalValue, setInternalValue] = useState(+value)
    const [unit, setUnit] = useState(DEFAULT_UNIT)

    useEffect(() => {
      const dataUnits = prettyBytes(value, DEFAULT_UNIT, 2, true)
      setInternalValue(dataUnits.value)
      setUnit(dataUnits.units)
    }, [value])

    const handleChange = useCallback(
      (internalType, valueInput) => {
        if (internalType === 'value') {
          setInternalValue(valueInput)
        } else {
          setUnit(valueInput)
        }

        const valueMB =
          internalType === 'value'
            ? valueInMB(valueInput, unit)
            : valueInMB(internalValue, valueInput)

        onChange(valueMB)
        if (typeof onConditionChange === 'function') {
          onConditionChange(valueMB)
        }
      },
      [internalValue, onChange, onConditionChange, unit]
    )

    const trLabel = isTranslationInput(label) ? translate(label) : label

    return (
      <UnitInput
        {...restFieldProps}
        {...inputProps}
        inputRef={ref}
        value={internalValue}
        onChange={(nextValue) => handleChange('value', nextValue)}
        onUnitChange={(nextUnit) => handleChange('unit', nextUnit)}
        unit={unit}
        units={ARRAY_UNITS}
        type="number"
        cy={cy}
        label={trLabel}
        tooltip={tooltip}
        placeholder={placeholder || `${T.Enter} ${trLabel}`}
        hint={hint ?? helperText}
        isDisabled={isReadOnly}
        isOptional={isOptional}
        isRequired={isRequired}
        InputProps={fieldInputProps}
        inputProps={{
          'data-cy': cy,
          min,
          max,
          step,
          ...fieldHtmlInputProps,
        }}
        errorDataCy={`${cy}-error`}
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

InformationUnitControllerKB.propTypes = {
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
}

InformationUnitControllerKB.displayName = 'InformationUnitControllerKB'
