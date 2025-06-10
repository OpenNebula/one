/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { useEffect, memo, useCallback } from 'react'
import PropTypes from 'prop-types'

import {
  styled,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Checkbox,
} from '@mui/material'
import { useFormContext, useController, useWatch } from 'react-hook-form'

import { ErrorHelper, Tooltip } from '@modules/components/FormControl'
import { Tr, labelCanBeTranslated } from '@modules/components/HOC'
import { generateKey } from '@UtilsModule'

const Label = styled('span')({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5em',
})

const CheckboxController = memo(
  ({
    control,
    cy = `checkbox-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    fieldProps = {},
    readOnly = false,
    watcher,
    dependencies,
    onConditionChange,
  }) => {
    const {
      field: { value = false, onChange, onBlur },
      fieldState: { error },
    } = useController({ name, control })

    const { sx, ...restFieldProps } = fieldProps

    const handleChange = useCallback(
      (e) => {
        onBlur()
        const condition = e.target.checked
        onChange(condition)
        if (typeof onConditionChange === 'function') {
          onConditionChange(condition)
        }
      },
      [onChange, onConditionChange]
    )

    // Add watcher to know if the dependencies fields have changes
    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const formContext = useFormContext()

    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch, { name, formContext })

      watcherValue !== undefined && onChange(watcherValue)
    }, [watch, watcher, dependencies])

    return (
      <FormControl error={Boolean(error)} margin="dense" sx={{ ...sx }}>
        <FormControlLabel
          control={
            <Checkbox
              onChange={handleChange}
              name={name}
              readOnly={readOnly}
              checked={Boolean(value)}
              inputProps={{ 'data-cy': cy }}
              {...restFieldProps}
            />
          }
          label={
            <Label>
              {labelCanBeTranslated(label) ? Tr(label) : label}
              {tooltip && <Tooltip title={tooltip} />}
            </Label>
          }
          labelPlacement="end"
        />
        {Boolean(error) && (
          <FormHelperText data-cy={`${cy}-error`}>
            <ErrorHelper label={error?.message} />
          </FormHelperText>
        )}
      </FormControl>
    )
  }
)

CheckboxController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
}

CheckboxController.displayName = 'CheckboxController'

export default CheckboxController
