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

import { TextField } from '@mui/material'
import { Controller } from 'react-hook-form'

import { Tr } from 'client/components/HOC'
import { ErrorHelper } from 'client/components/FormControl'

const TimeController = memo(
  ({ control, cy, name, type, label, error, fieldProps }) => (
    <Controller
      render={({ value, ...props }) =>
        <TextField
          {...props}
          fullWidth
          value={value}
          {...(label && { label: Tr(label) })}
          type={type}
          inputProps={{ 'data-cy': cy, ...fieldProps }}
          InputLabelProps={{ shrink: true }}
          error={Boolean(error)}
          helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
          FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
        />
      }
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label
)

TimeController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  multiline: PropTypes.bool,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  type: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ]),
  fieldProps: PropTypes.object,
  formContext: PropTypes.shape({
    setValue: PropTypes.func,
    setError: PropTypes.func,
    clearErrors: PropTypes.func,
    watch: PropTypes.func,
    register: PropTypes.func
  })
}

TimeController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  type: 'datetime-local',
  error: false,
  fieldProps: undefined
}

TimeController.displayName = 'TimeController'

export default TimeController
