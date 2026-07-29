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

import { Stack } from '@mui/material'
import { useController, useWatch } from 'react-hook-form'

import { Slider } from '@modules/componentsv2/primitives/Slider/Default'
import { InputField } from '@modules/componentsv2/primitives/Fields'
import { ErrorHelper } from '@modules/componentsv2/composed/Forms/FormControl/ErrorHelper'
import { isTranslationInput, generateKey } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

export const SliderController = memo(
  ({
    control,
    cy = `slider-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    watcher,
    dependencies,
    fieldProps = {},
    readOnly = false,
    onConditionChange,
    defaultValue,
  }) => {
    const { translate } = useTranslation()
    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const { min, max, step } = fieldProps ?? {}

    const {
      field: { value, onChange, onBlur, ...inputProps },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    const handleEnsuredChange = useCallback(
      (newValue) => {
        if (min && newValue < min) return onChange(min)
        if (max && newValue > max) return onChange(max)
        if (min && max && newValue <= max && newValue >= min)
          return onChange(newValue)
      },
      [onChange, min, max]
    )

    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch)
      watcherValue !== undefined && handleEnsuredChange(watcherValue)
    }, [watch, watcher, dependencies])

    const sliderId = `${cy}-slider`
    const inputId = `${cy}-input`

    const handleChange = useCallback(
      (_, newValue) => {
        onBlur()
        if (!readOnly) {
          onChange(newValue)
          if (typeof onConditionChange === 'function') {
            onConditionChange(newValue)
          }
        }
      },
      [onChange, onConditionChange, readOnly]
    )

    return (
      <>
        <Stack
          direction="row"
          pl="1em"
          mt="0.5rem"
          spacing={2}
          alignItems="center"
        >
          <Slider
            value={typeof value === 'number' ? value : 0}
            aria-labelledby={sliderId}
            valueLabelDisplay="auto"
            isDisabled={readOnly}
            data-cy={sliderId}
            onChange={handleChange}
            {...fieldProps}
          />
          <InputField
            {...inputProps}
            fullWidth
            value={value ?? ''}
            type="number"
            status={error ? 'error' : 'default'}
            isDisabled={readOnly}
            label={isTranslationInput(label) ? translate(label) : label}
            tooltip={tooltip}
            InputProps={{
              readOnly,
            }}
            inputProps={{
              'data-cy': inputId,
              'aria-labelledby': sliderId,
              min,
              max,
              step,
            }}
            onChange={(nextValue) =>
              handleEnsuredChange(!nextValue ? 0 : Number(nextValue))
            }
            onBlur={() => handleEnsuredChange(value)}
            error={error?.message && <ErrorHelper label={error.message} />}
            errorDataCy={`${cy}-error`}
          />
        </Stack>
      </>
    )
  }
)

SliderController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
  defaultValue: PropTypes.string,
}

SliderController.displayName = 'SliderController'
