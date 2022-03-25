/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { TextField, Slider, FormHelperText, Stack } from '@mui/material'
import { useController } from 'react-hook-form'

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
    fieldProps = {},
  }) => {
    const {
      field: { value, onChange, ...inputProps },
      fieldState: { error },
    } = useController({ name, control })

    const sliderId = `${cy}-slider`
    const inputId = `${cy}-input`

    return (
      <>
        <Stack direction="row" mt="0.5rem" spacing={2} alignItems="center">
          <Slider
            color="secondary"
            value={typeof value === 'number' ? value : 0}
            aria-labelledby={sliderId}
            valueLabelDisplay="auto"
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
              endAdornment: tooltip && <Tooltip title={tooltip} />,
            }}
            inputProps={{
              'data-cy': inputId,
              'aria-labelledby': sliderId,
              ...fieldProps,
            }}
            onChange={(evt) =>
              onChange(!evt.target.value ? '0' : Number(evt.target.value))
            }
            onBlur={() => {
              const { min, max } = fieldProps ?? {}

              if (min && value < min) {
                onChange(min)
              } else if (max && value > max) {
                onChange(max)
              }
            }}
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
  fieldProps: PropTypes.object,
}

SliderController.displayName = 'SliderController'

export default SliderController
