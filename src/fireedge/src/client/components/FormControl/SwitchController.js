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

import { FormControl, FormControlLabel, Switch } from '@material-ui/core'
import { Controller } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'

const SwitchController = memo(
  ({ control, cy, name, label, tooltip, error, fieldProps }) => (
    <Controller
      render={({ onChange, value = false }) => (
        <FormControl error={Boolean(error)} margin='dense'>
          <FormControlLabel
            control={
              <Switch
                onChange={e => onChange(e.target.checked)}
                name={name}
                checked={Boolean(value)}
                color='secondary'
                inputProps={{ 'data-cy': cy }}
                {...fieldProps}
              />
            }
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                {Tr(label)}
                {tooltip && <Tooltip title={tooltip} />}
              </span>
            }
            labelPlacement='end'
          />
          {Boolean(error) && <ErrorHelper label={error?.message} />}
        </FormControl>
      )}
      name={name}
      control={control}
    />
  ),
  (prevProps, nextProps) => prevProps.error === nextProps.error
)

SwitchController.propTypes = {
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

SwitchController.defaultProps = {
  control: {},
  cy: 'cy',
  name: '',
  label: '',
  values: [],
  error: false
}

SwitchController.displayName = 'SwitchController'

export default SwitchController
