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

import {
  FormControl,
  FormControlLabel,
  Checkbox,
  Tooltip
} from '@material-ui/core'
import { Controller } from 'react-hook-form'

import { ErrorHelper } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC/Translate'

const CheckboxController = memo(
  ({ control, cy, name, label, tooltip, error, fieldProps }) => (
    <Controller
      render={({ onChange, value = false }) => (
        <Tooltip title={Tr(tooltip) ?? ''}>
          <FormControl error={Boolean(error)}>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={e => onChange(e.target.checked)}
                  name={name}
                  checked={Boolean(value)}
                  color="secondary"
                  inputProps={{ 'data-cy': cy }}
                  {...fieldProps}
                />
              }
              label={Tr(label)}
              labelPlacement="end"
            />
            {Boolean(error) && <ErrorHelper label={error?.message} />}
          </FormControl>
        </Tooltip>
      )}
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) => prevProps.error === nextProps.error
)

CheckboxController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  tooltip: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.objectOf(PropTypes.any)
  ]),
  fieldProps: PropTypes.object
}

CheckboxController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  tooltip: undefined,
  values: [],
  error: false,
  fieldProps: undefined
}

CheckboxController.displayName = 'CheckboxController'

export default CheckboxController
