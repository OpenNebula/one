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
import { useController } from 'react-hook-form'

import { ErrorHelper } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const TimeController = memo(
  ({
    control,
    cy = `datetime-${generateKey()}`,
    name = '',
    label = '',
    type = 'datetime-local',
    fieldProps = {}
  }) => {
    const {
      field: { ref, value, ...inputProps },
      fieldState: { error }
    } = useController({ name, control })

    return (
      <TextField
        {...inputProps}
        fullWidth
        label={labelCanBeTranslated(label) ? Tr(label) : label}
        inputRef={ref}
        type={type}
        inputProps={{ 'data-cy': cy, ...fieldProps }}
        InputLabelProps={{ shrink: true }}
        error={Boolean(error)}
        helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
        FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
      />
    )
  },
  (prevProps, nextProps) =>
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label
)

TimeController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  multiline: PropTypes.bool,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  type: PropTypes.string,
  fieldProps: PropTypes.object,
  formContext: PropTypes.shape({
    setValue: PropTypes.func,
    setError: PropTypes.func,
    clearErrors: PropTypes.func,
    watch: PropTypes.func,
    register: PropTypes.func
  })
}

TimeController.displayName = 'TimeController'

export default TimeController
