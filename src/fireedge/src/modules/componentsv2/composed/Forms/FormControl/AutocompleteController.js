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

import { memo, useCallback, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { TagsInput } from '@modules/componentsv2/primitives/Fields/Tags'
import { Dropdown } from '@modules/componentsv2/primitives/Dropdown'
import { useController, useWatch, useFormContext } from 'react-hook-form'
import { sentenceCase, generateKey } from '@UtilsModule'
import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

const getOptionValue = (option) =>
  typeof option === 'object' ? option?.value ?? option?.text : option

export const AutocompleteController = memo(
  ({
    control,
    cy = `autocomplete-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    multiple = false,
    values = [],
    fieldProps = {},
    readOnly = false,
    optionsOnly = false,
    clearInvalid = false,
    onConditionChange,
    watcher,
    dependencies,
    disableEnter = false,
    defaultValue,
  }) => {
    const { translate } = useTranslation()
    const {
      hint,
      placeholder,
      menuTitle,
      rowsDisplayed = 4,
      separators,
      parseFreeSoloValue,
      freeSolo,
      ...restFieldProps
    } = fieldProps
    const trLabel = translate(label)
    const resolvedPlaceholder = placeholder || `${T.Enter} ${trLabel}`
    const trHint =
      hint ??
      (multiple ? translate(T.PressKeysToAddAValue, ['ENTER']) : undefined)
    const resolvedFreeSolo = freeSolo ?? !optionsOnly

    const {
      field: { value: renderValue, onBlur, onChange },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    const formContext = useFormContext()

    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const errorText = sentenceCase(
      [error?.message]
        ?.flat()
        ?.map((s) => s?.trim())
        ?.join(' ')
    )

    const handleChange = useCallback(
      (nextValue) => {
        const valueToChange = multiple
          ? nextValue ?? []
          : nextValue == null
          ? null
          : getOptionValue(nextValue)

        onChange(valueToChange)

        if (typeof onConditionChange === 'function') {
          onConditionChange(valueToChange)
        }
      },
      [onChange, onConditionChange, multiple]
    )

    const handleInputChange = useCallback(
      (_, newInputValue, reason) => {
        if (reason !== 'input' || !resolvedFreeSolo) return

        onChange(newInputValue)

        if (typeof onConditionChange === 'function') {
          onConditionChange(newInputValue)
        }
      },
      [onChange, onConditionChange, resolvedFreeSolo]
    )

    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch, { name, formContext })

      watcherValue !== undefined && onChange(watcherValue)
    }, [watch, watcher, dependencies])

    useEffect(() => {
      if (!clearInvalid || !optionsOnly) return

      if (multiple) {
        const currentValues = [].concat(renderValue ?? [])
        if (!currentValues.length) return

        const validValues = currentValues.filter((currentValue) =>
          values.some(
            (option) => String(getOptionValue(option)) === String(currentValue)
          )
        )

        if (validValues.length !== currentValues.length) {
          onChange(validValues)
        }

        return
      }

      const isValid = values.some(
        (option) => String(getOptionValue(option)) === String(renderValue)
      )

      if (!isValid) {
        onChange('')
      }
    }, [clearInvalid, optionsOnly, renderValue, values, multiple, onChange])

    const resolvedValue = useMemo(() => {
      if (renderValue === undefined || renderValue === null) return renderValue

      if (multiple) {
        return []
          ?.concat(renderValue)
          ?.map(
            (val) =>
              values?.find((opt) =>
                typeof opt === 'object'
                  ? String(getOptionValue(opt)) === String(val)
                  : String(opt) === String(val)
              ) ?? val
          )
      }

      return (
        values?.find((opt) =>
          typeof opt === 'object'
            ? String(getOptionValue(opt)) === String(renderValue)
            : String(opt) === String(renderValue)
        ) ?? renderValue
      )
    }, [renderValue, values, multiple, defaultValue])

    return multiple ? (
      <TagsInput
        {...restFieldProps}
        onBlur={onBlur}
        value={resolvedValue ?? []}
        onChange={handleChange}
        label={trLabel}
        hint={trHint}
        tooltip={tooltip}
        placeholder={resolvedPlaceholder}
        options={values}
        rowsDisplayed={rowsDisplayed}
        error={errorText}
        dataCy={cy}
        freeSolo={resolvedFreeSolo}
        parseFreeSoloValue={parseFreeSoloValue}
        separators={separators}
        isReadOnly={readOnly}
        isDisableEnter={disableEnter}
      />
    ) : (
      <Dropdown
        {...restFieldProps}
        dataCy={cy}
        onBlur={onBlur}
        initialValue={resolvedValue}
        onChange={handleChange}
        label={trLabel}
        hint={trHint}
        tooltip={tooltip}
        placeholder={resolvedPlaceholder}
        menuTitle={menuTitle}
        options={values}
        rowsDisplayed={rowsDisplayed}
        error={errorText}
        freeSolo={resolvedFreeSolo}
        isSearchable
        isReadOnly={readOnly}
        isDisableEnter={disableEnter}
        onInputChange={handleInputChange}
      />
    )
  },
  (prevProps, nextProps) => prevProps.values === nextProps.values
)

AutocompleteController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  multiple: PropTypes.bool,
  disableEnter: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object),
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  optionsOnly: PropTypes.bool,
  clearInvalid: PropTypes.bool,
  onConditionChange: PropTypes.func,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  defaultValue: PropTypes.string,
}

AutocompleteController.displayName = 'AutocompleteController'
