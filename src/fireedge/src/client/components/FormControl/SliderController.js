/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

import {
  Typography,
  TextField,
  Slider,
  FormHelperText,
  Grid,
} from '@mui/material'
import { useController } from 'react-hook-form'

import { ErrorHelper } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const SliderController = memo(
  ({
    control,
    cy = `slider-${generateKey()}`,
    name = '',
    label = '',
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
        <Typography id={sliderId} gutterBottom>
          {labelCanBeTranslated(label) ? Tr(label) : label}
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Slider
              color="secondary"
              value={typeof value === 'number' ? value : 0}
              aria-labelledby={sliderId}
              valueLabelDisplay="auto"
              data-cy={sliderId}
              onChange={(_, val) => onChange(val)}
              {...fieldProps}
            />
          </Grid>
          <Grid item>
            <TextField
              {...inputProps}
              fullWidth
              value={value}
              error={Boolean(error)}
              type="number"
              inputProps={{
                'data-cy': inputId,
                'aria-labelledby': sliderId,
                ...fieldProps,
              }}
              onChange={(evt) =>
                onChange(
                  evt.target.value === '' ? '0' : Number(evt.target.value)
                )
              }
            />
          </Grid>
        </Grid>
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
  multiple: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  fieldProps: PropTypes.object,
}

SliderController.displayName = 'SliderController'

export default SliderController
