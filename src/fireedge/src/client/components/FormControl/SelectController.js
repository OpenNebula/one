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
import { memo, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'

import { TextField } from '@mui/material'
import { useController } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const SelectController = memo(
  ({
    control,
    cy = `select-${generateKey()}`,
    name = '',
    label = '',
    multiple = false,
    values = [],
    renderValue,
    tooltip,
    fieldProps = {},
  }) => {
    const firstValue = values?.[0]?.value ?? ''
    const defaultValue = multiple ? [firstValue] : firstValue

    const {
      field: { ref, value: optionSelected, onChange, ...inputProps },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    const needShrink = useMemo(
      () =>
        multiple || values.find((v) => v.value === optionSelected)?.text !== '',
      [optionSelected]
    )

    useEffect(() => {
      if (multiple && !Array.isArray(optionSelected)) {
        onChange([optionSelected])
      }
    }, [multiple])

    return (
      <TextField
        {...inputProps}
        inputRef={ref}
        value={optionSelected}
        onChange={
          !multiple
            ? onChange
            : (evt) => {
                const {
                  target: { options },
                } = evt
                const newValue = []

                for (const option of options) {
                  option.selected && newValue.push(option.value)
                }

                onChange(newValue)
              }
        }
        select
        fullWidth
        SelectProps={{ native: true, multiple }}
        label={labelCanBeTranslated(label) ? Tr(label) : label}
        InputLabelProps={{ shrink: needShrink }}
        InputProps={{
          startAdornment:
            (optionSelected && renderValue?.(optionSelected)) ||
            (tooltip && <Tooltip title={tooltip} position="start" />),
        }}
        inputProps={{ 'data-cy': cy }}
        error={Boolean(error)}
        helperText={Boolean(error) && <ErrorHelper label={error?.message} />}
        FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
        {...fieldProps}
      >
        {values?.map(({ text, value = '' }) => (
          <option key={`${name}-${value}`} value={value}>
            {text}
          </option>
        ))}
      </TextField>
    )
  },
  (prev, next) =>
    prev.error === next.error &&
    prev.values.length === next.values.length &&
    prev.label === next.label &&
    prev.tooltip === next.tooltip &&
    prev.multiple === next.multiple
)

SelectController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  multiple: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  renderValue: PropTypes.func,
  fieldProps: PropTypes.object,
}

SelectController.displayName = 'SelectController'

export default SelectController
