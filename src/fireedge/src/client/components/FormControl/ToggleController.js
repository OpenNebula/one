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
import { memo, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import {
  styled,
  FormControl,
  ToggleButtonGroup,
  ToggleButton,
  FormHelperText,
} from '@mui/material'
import { useController } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const Label = styled('label')(({ theme, error }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '1em',
  ...(error && {
    color: theme.palette.error.main,
  }),
}))

const ToggleController = memo(
  ({
    control,
    cy = `toggle-${generateKey()}`,
    name = '',
    label = '',
    multiple = false,
    values = [],
    tooltip,
    fieldProps = {},
    notNull = false,
    readOnly = false,
    onConditionChange,
  }) => {
    const {
      field: { ref, value: optionSelected, onChange },
      fieldState: { error: { message } = {} },
    } = useController({ name, control })

    useEffect(() => {
      if (optionSelected) {
        const exists = values?.find((option) => option.value === optionSelected)
        !exists && onChange()
      }
    }, [])
    const handleChange = useCallback(
      (_, newValues) => {
        if (!readOnly && (!notNull || newValues)) {
          onChange(newValues)
          if (typeof onConditionChange === 'function') {
            onConditionChange(newValues)
          }
        }
      },
      [onChange, onConditionChange, readOnly, notNull]
    )

    return (
      <FormControl fullWidth margin="dense">
        {label && (
          <Label htmlFor={cy} error={message}>
            {labelCanBeTranslated(label) ? Tr(label) : label}
            {tooltip && <Tooltip title={tooltip} />}
          </Label>
        )}
        <ToggleButtonGroup
          fullWidth
          ref={ref}
          id={cy}
          onChange={handleChange}
          value={optionSelected}
          exclusive={!multiple}
          data-cy={cy}
          {...fieldProps}
        >
          {values?.map(({ text, value = '' }) => (
            <ToggleButton key={`${name}-${value}`} value={value} sx={{ p: 1 }}>
              {text}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {Boolean(message) && (
          <FormHelperText data-cy={`${cy}-error`}>
            <ErrorHelper label={message} />
          </FormHelperText>
        )}
      </FormControl>
    )
  },
  (prevProps, nextProps) =>
    prevProps.values.length === nextProps.values.length &&
    prevProps.label === nextProps.label &&
    prevProps.tooltip === nextProps.tooltip
)

ToggleController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  multiple: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  renderValue: PropTypes.func,
  fieldProps: PropTypes.object,
  notNull: PropTypes.bool,
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
}

ToggleController.displayName = 'ToggleController'

export default ToggleController
