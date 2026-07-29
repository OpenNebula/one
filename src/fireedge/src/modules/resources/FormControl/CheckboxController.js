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
import { useEffect, memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useFormContext, useController, useWatch } from 'react-hook-form'
import { generateKey } from '@UtilsModule'
import { Checkbox, Tooltip } from '@ComponentsV2Module'

const CheckboxController = memo(
  ({
    control,
    cy = `checkbox-${generateKey()}`,
    name = '',
    label = '',
    status = 'default',
    fieldProps = {},
    readOnly = false,
    watcher,
    dependencies,
    onConditionChange,
    tooltip,
  }) => {
    const {
      field: { value = false, onChange, onBlur },
      fieldState: { error },
    } = useController({ name, control })

    const { disabled } = fieldProps

    const handleChange = useCallback(
      (checked) => {
        onBlur()
        onChange(checked)
        if (typeof onConditionChange === 'function') {
          onConditionChange(checked)
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
      <Tooltip title={tooltip ?? ''}>
        <Checkbox
          text={label}
          value={name}
          onChange={handleChange}
          status={error != null ? 'error' : status ?? 'default'}
          readOnly={readOnly}
          inputProps={{ 'data-cy': cy }}
          isDisabled={disabled}
          checked={value}
        />
      </Tooltip>
    )
  }
)

CheckboxController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  status: PropTypes.string,
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
