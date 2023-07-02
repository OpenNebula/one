/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import { TextField, Slider, FormHelperText, Stack } from '@mui/material'
import { useController, useWatch } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const SliderController = memo(
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
  }) => {
    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const { min, max, step } = fieldProps ?? {}

    const {
      field: { value, onChange, ...inputProps },
      fieldState: { error },
    } = useController({ name, control })

    const handleEnsuredChange = useCallback(
      (newValue) => {
        if (min && newValue < min) return onChange(min)
        if (max && newValue > max) return onChange(max)
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
            color="secondary"
            value={typeof value === 'number' ? value : 0}
            aria-labelledby={sliderId}
            valueLabelDisplay="auto"
            disabled={readOnly}
            data-cy={sliderId}
            onChange={(_, val) => onChange(val)}
            {...fieldProps}
          />
          <TextField
            {...inputProps}
            fullWidth
            value={value}
            type="number"
            error={Boolean(error)}
            label={labelCanBeTranslated(label) ? Tr(label) : label}
            InputProps={{
              readOnly,
              endAdornment: tooltip && <Tooltip title={tooltip} />,
            }}
            inputProps={{
              'data-cy': inputId,
              'aria-labelledby': sliderId,
              min,
              max,
              step,
            }}
            onChange={(evt) =>
              handleEnsuredChange(
                !evt.target.value ? '0' : Number(evt.target.value)
              )
            }
            onBlur={() => handleEnsuredChange(value)}
          />
        </Stack>
        {Boolean(error) && (
          <FormHelperText data-cy={`${cy}-error`}>
            <ErrorHelper label={error?.message} />
          </FormHelperText>
        )}
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
}

SliderController.displayName = 'SliderController'

export default SliderController
