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

import {
  styled,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
} from '@mui/material'
import { useController, useWatch } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const Label = styled('span')({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5em',
})

const SwitchController = memo(
  ({
    control,
    cy = `switch-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    fieldProps = {},
    readOnly = false,
    onConditionChange,
    watcher,
    dependencies,
  }) => {
    const {
      field: { value = false, onChange, onBlur },
      fieldState: { error },
    } = useController({ name, control })

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

    // Execute watcher function define on the field when dependenices fields have changes
    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch, { name })
      watcherValue !== undefined && onChange(watcherValue)
    }, [watch, watcher, dependencies])

    return (
      <FormControl error={Boolean(error)} margin="dense">
        <FormControlLabel
          control={
            <Switch
              readOnly={readOnly}
              onChange={handleChange}
              name={name}
              checked={Boolean(value)}
              color="secondary"
              inputProps={{ 'data-cy': cy }}
              {...fieldProps}
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

SwitchController.propTypes = {
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

SwitchController.displayName = 'SwitchController'

export default SwitchController
