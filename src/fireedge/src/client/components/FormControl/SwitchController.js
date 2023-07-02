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
import { memo } from 'react'
import PropTypes from 'prop-types'

import {
  styled,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
} from '@mui/material'
import { useController } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const Label = styled('span')({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5em',
})

const SwitchController = memo(
  ({
    control,
    cy = `switch-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    fieldProps = {},
    readOnly = false,
  }) => {
    const {
      field: { value = false, onChange },
      fieldState: { error },
    } = useController({ name, control })

    return (
      <FormControl error={Boolean(error)} margin="dense">
        <FormControlLabel
          control={
            <Switch
              readOnly={readOnly}
              onChange={(e) => onChange(e.target.checked)}
              name={name}
              checked={Boolean(value)}
              color="secondary"
              inputProps={{ 'data-cy': cy }}
              {...fieldProps}
            />
          }
          label={
            <Label>
              {labelCanBeTranslated(label) ? Tr(label) : label}
              {tooltip && <Tooltip title={tooltip} />}
            </Label>
          }
          labelPlacement="end"
        />
        {Boolean(error) && (
          <FormHelperText data-cy={`${cy}-error`}>
            <ErrorHelper label={error?.message} />
          </FormHelperText>
        )}
      </FormControl>
    )
  }
)

SwitchController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
}

SwitchController.displayName = 'SwitchController'

export default SwitchController
