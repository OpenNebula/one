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

import { useController } from 'react-hook-form'
import { TextField } from '@mui/material'
import DateTimePicker from '@mui/lab/DateTimePicker'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Translate } from 'client/components/HOC'
import { generateKey } from 'client/utils'
import { T } from 'client/constants'

const TimeController = memo(
  ({
    control,
    cy = `input-date-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    fieldProps: { defaultValue, ...fieldProps } = {},
    ...props
  }) => {
    const {
      field: { value, ...controllerProps },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    return (
      <DateTimePicker
        {...controllerProps}
        {...fieldProps}
        value={value}
        label={<Translate word={label} />}
        cancelText={<Translate word={T.Cancel} />}
        clearText={<Translate word={T.Clear} />}
        todayText={<Translate word={T.Today} />}
        InputProps={{
          autoComplete: 'off',
          startAdornment: tooltip && <Tooltip title={tooltip} />,
        }}
        renderInput={({ inputProps, ...dateTimePickerProps }) => (
          <TextField
            {...dateTimePickerProps}
            fullWidth
            inputProps={{ ...inputProps, 'data-cy': cy }}
            error={Boolean(error)}
            helperText={
              Boolean(error) && <ErrorHelper label={error?.message} />
            }
            FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
          />
        )}
      />
    )
  },
  (prevProps, nextProps) =>
    prevProps.label === nextProps.label &&
    prevProps.tooltip === nextProps.tooltip
)

TimeController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  fieldProps: PropTypes.object,
}

TimeController.displayName = 'TimeController'

export default TimeController
