/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useMemo, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import { TextField } from '@mui/material'
import { useController, useWatch } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey, findClosestValue } from 'client/utils'

const SelectController = memo(
  ({
    control,
    cy = `select-${generateKey()}`,
    name = '',
    label = '',
    multiple = false,
    values = [],
    renderValue,
    tooltip,
    watcher,
    dependencies,
    defaultValueProp,
    fieldProps = {},
    readOnly = false,
    onConditionChange,
  }) => {
    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const firstValue = defaultValueProp
      ? values?.find((val) => val.value === defaultValueProp)
      : values?.[0]?.value ?? ''

    const defaultValue =
      defaultValueProp !== undefined
        ? multiple
          ? [defaultValueProp]
          : defaultValueProp
        : multiple
        ? [firstValue]
        : firstValue

    const {
      field: { ref, value: optionSelected, onChange, onBlur, ...inputProps },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    const needShrink = useMemo(
      () =>
        multiple ||
        values?.find((o) => o.value === optionSelected)?.text !== '',
      [optionSelected]
    )

    useEffect(() => {
      if (!optionSelected && !optionSelected.length) return

      if (multiple) {
        const exists = values.some((o) => optionSelected.includes(o.value))
        !exists && onChange([firstValue])
      } else {
        const exists = values.some((o) => `${o.value}` === `${optionSelected}`)

        !exists && onChange(firstValue)
      }
    }, [multiple])

    useEffect(() => {
      if (!watcher || !dependencies) return
      if (!watch) return onChange(defaultValue)

      const watcherValue = watcher(watch)
      const optionValues = values.map((o) => o.value)

      const ensuredWatcherValue = isNaN(watcherValue)
        ? optionValues.find((o) => `${o}` === `${watcherValue}`)
        : findClosestValue(watcherValue, optionValues)

      onChange(ensuredWatcherValue ?? defaultValue)
    }, [watch, watcher, dependencies])

    const handleChange = useCallback(
      (evt) => {
        onBlur()
        if (!multiple) {
          onChange(evt)
          if (typeof onConditionChange === 'function') {
            onConditionChange(evt)
          }
        } else {
          const {
            target: { options },
          } = evt
          const newValue = []

          for (const option of options) {
            option.selected && newValue.push(option.value)
          }

          onChange(newValue)
          if (typeof onConditionChange === 'function') {
            onConditionChange(newValue)
          }
        }
      },
      [onChange, onConditionChange, multiple]
    )

    return (
      <TextField
        {...inputProps}
        inputRef={ref}
        value={optionSelected}
        onChange={handleChange}
        select
        fullWidth
        disabled={readOnly}
        SelectProps={{ native: true, multiple }}
        label={labelCanBeTranslated(label) ? Tr(label) : label}
        InputLabelProps={{ shrink: needShrink }}
        InputProps={{
          ...(multiple && { sx: { paddingTop: '0.5em' } }),
          startAdornment:
            (optionSelected && renderValue?.(optionSelected)) ||
            (tooltip && <Tooltip title={tooltip} position="start" />),
        }}
        inputProps={{ 'data-cy': cy }}
        error={Boolean(error)}
        helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
        FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
        {...fieldProps}
      >
        {values?.map(({ text, value = '' }) => (
          <option key={`${name}-${value}`} value={value}>
            {Tr(text)}
          </option>
        ))}
      </TextField>
    )
  },
  (prev, next) =>
    prev.error === next.error &&
    prev.values.length === next.values.length &&
    prev.label === next.label &&
    prev.tooltip === next.tooltip &&
    prev.multiple === next.multiple &&
    prev.readOnly === next.readOnly
)

SelectController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  multiple: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  renderValue: PropTypes.func,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  defaultValueProp: PropTypes.string,
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
}

SelectController.displayName = 'SelectController'

export default SelectController
