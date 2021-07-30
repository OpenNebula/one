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
import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { TextField } from '@material-ui/core'
import { Controller } from 'react-hook-form'
import { Tr } from 'client/components/HOC'

import { ErrorHelper } from 'client/components/FormControl'

const TextController = memo(
  ({ control, cy, type, multiline, name, label, error, fieldProps }) => (
    <Controller
      render={({ value, ...props }) =>
        <TextField
          fullWidth
          multiline={multiline}
          color='secondary'
          value={value ?? ''}
          type={type}
          variant='outlined'
          margin='dense'
          {...(label && { label: Tr(label) })}
          inputProps={{ 'data-cy': cy }}
          error={Boolean(error)}
          helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
          FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
          {...props}
          {...fieldProps}
        />
      }
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.error === nextProps.error && prevProps.type === nextProps.type
)

TextController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  type: PropTypes.string,
  multiline: PropTypes.bool,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ]),
  fieldProps: PropTypes.object
}

TextController.defaultProps = {
  control: {},
  cy: 'cy',
  type: 'text',
  multiline: false,
  name: '',
  label: '',
  error: false,
  fieldProps: undefined
}

TextController.displayName = 'TextController'

export default TextController
