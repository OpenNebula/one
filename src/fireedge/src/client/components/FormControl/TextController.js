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

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'

const TextController = memo(
  ({ control, cy, type, multiline, name, label, tooltip, error, fieldProps }) => (
    <Controller
      render={({ value, ...controllerProps }) =>
        <TextField
          fullWidth
          multiline={multiline}
          value={value ?? ''}
          type={type}
          label={typeof label === 'string' ? Tr(label) : label}
          InputProps={{
            endAdornment: tooltip && <Tooltip title={tooltip} />
          }}
          inputProps={{ 'data-cy': cy, ...fieldProps }}
          error={Boolean(error)}
          helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
          FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
          {...controllerProps}
          {...fieldProps}
        />
      }
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.error === nextProps.error &&
    prevProps.type === nextProps.type &&
    prevProps.label === nextProps.label &&
    prevProps.tooltip === nextProps.tooltip
)

TextController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  type: PropTypes.string,
  multiline: PropTypes.bool,
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ]),
  tooltip: PropTypes.string,
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

TextController.defaultProps = {
  control: {},
  cy: 'cy',
  type: 'text',
  multiline: false,
  name: '',
  label: '',
  error: false
}

TextController.displayName = 'TextController'

export default TextController
