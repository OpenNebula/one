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
import { memo, useCallback, useEffect } from 'react'
import { FormControl, FormHelperText } from '@mui/material'
import { Switch } from '@modules/componentsv2/primitives/Buttons/Switch'
import { useController, useWatch } from 'react-hook-form'
import { ErrorHelper } from '@modules/componentsv2/composed/Forms/FormControl/ErrorHelper'
import { generateKey } from '@UtilsModule'
import { Text } from '@modules/componentsv2/primitives/Text'
import { TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

export const SwitchController = memo(
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
    description,
  }) => {
    const {
      field: { value = false, onChange, onBlur },
      fieldState: { error },
    } = useController({ name, control })

    const handleChange = useCallback(
      (checked) => {
        onBlur()
        onChange(checked)
        if (typeof onConditionChange === 'function') {
          onConditionChange(checked)
        }
      },
      [onBlur, onChange, onConditionChange]
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
        <Switch
          readOnly={readOnly}
          onChange={handleChange}
          name={name}
          label={label}
          isChecked={Boolean(value)}
          inputProps={{ 'data-cy': cy }}
          tooltip={tooltip}
          {...fieldProps}
        />
        {description && (
          <FormHelperText>
            <Text
              component="span"
              value={description}
              variant={TEXT_VARIANTS.CAPTION}
              weight={TEXT_WEIGHTS.REGULAR}
            />
          </FormHelperText>
        )}
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
  description: PropTypes.string,
}

SwitchController.displayName = 'SwitchController'
