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
import { memo, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import { TextField } from '@mui/material'
import { useController, useWatch, useFormContext } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

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
    readOnly = false,
    onConditionChange,
    defaultValue,
  }) => {
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
      (e) => {
        onBlur()
        // Empty string it's undefined value (this way, a number input that is no mandatory could have empty value)
        const condition = e.target.value === '' ? undefined : e.target.value
        onChange(condition)
        if (typeof onConditionChange === 'function') {
          onConditionChange(condition)
        }
      },
      [onChange, onConditionChange]
    )

    return (
      <TextField
        {...inputProps}
        fullWidth
        inputRef={ref}
        value={value}
        onChange={handleChange}
        multiline={multiline}
        rows={3}
        type={type}
        label={labelCanBeTranslated(label) ? Tr(label) : label}
        InputProps={{
          readOnly,
          endAdornment: tooltip && <Tooltip title={tooltip} />,
        }}
        inputProps={{
          'data-cy': cy,
          ...(type === 'number' && {
            min: fieldProps.min,
            max: fieldProps.max,
            step: fieldProps.step,
          }),
          ...(multiline && { style: { resize: 'both' } }),
        }}
        error={Boolean(error)}
        helperText={
          error ? <ErrorHelper label={error?.message} /> : fieldProps.helperText
        }
        FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
        {...fieldProps}
        sx={multiline ? { textarea: { resize: 'both' } } : {}}
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
