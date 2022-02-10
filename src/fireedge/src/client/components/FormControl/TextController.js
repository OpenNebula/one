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
import { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import { TextField } from '@mui/material'
import { useController, useWatch } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const TextController = memo(
  ({
    control,
    cy = `input-${generateKey()}`,
    name = '',
    label = '',
    type = 'text',
    multiline = false,
    tooltip,
    watcher,
    dependencies,
    fieldProps = {},
  }) => {
    const watch =
      dependencies &&
      useWatch({
        control,
        name: dependencies,
        disabled: dependencies === null,
      })

    const {
      field: { ref, value = '', onChange, ...inputProps },
      fieldState: { error },
    } = useController({ name, control })

    useEffect(() => {
      if (watch && watcher) {
        const watcherValue = watcher(watch)
        watcherValue && onChange(watcherValue)
      }
    }, [watch])

    return (
      <TextField
        {...inputProps}
        fullWidth
        inputRef={ref}
        value={value}
        onChange={onChange}
        multiline={multiline}
        rows={3}
        type={type}
        label={labelCanBeTranslated(label) ? Tr(label) : label}
        InputProps={{
          endAdornment: tooltip && <Tooltip title={tooltip} />,
        }}
        inputProps={{ 'data-cy': cy }}
        error={Boolean(error)}
        helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
        FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
        {...fieldProps}
      />
    )
  },
  (prevProps, nextProps) =>
    prevProps.type === nextProps.type &&
    prevProps.label === nextProps.label &&
    prevProps.tooltip === nextProps.tooltip &&
    prevProps.fieldProps?.value === nextProps.fieldProps?.value
)

TextController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  type: PropTypes.string,
  multiline: PropTypes.bool,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  fieldProps: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
}

TextController.displayName = 'TextController'

export default TextController
