/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { styled, FormControl, FormHelperText, Box } from '@mui/material'
import { useController } from 'react-hook-form'
import { Text } from '@modules/components/primitives/Text'
import { CardButton } from '@modules/components/primitives/Buttons/Card'
import { ErrorHelper } from '@modules/components/composed/Forms/FormControl/ErrorHelper'
import { AdornmentWithTooltip as Tooltip } from '@modules/components/composed/Forms/FormControl/Tooltip'
import { generateKey } from '@UtilsModule'

const Label = styled('label')(({ theme, error }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '1em',
  '& .toggle-controller-label': {
    color: error ? theme.palette.text.error : theme.palette.text.headings,
  },
  ...(error && {
    color: theme.palette.error.main,
  }),
}))

export const ToggleController = memo(
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
    defaultValue,
  }) => {
    const {
      field: { ref, value: optionSelected, onChange, onBlur },
      fieldState: { error: { message } = {} },
    } = useController({ name, control })

    useEffect(() => {
      if (optionSelected) {
        const selectedValues = Array.isArray(optionSelected)
          ? optionSelected
          : [optionSelected]
        const exists = selectedValues.every((selectedValue) =>
          values?.some((option) => option.value === selectedValue)
        )
        !exists && onChange()
      }
    }, [])
    const handleChange = useCallback(
      (newValues) => {
        onBlur()
        const hasSelection = Array.isArray(newValues)
          ? newValues.length > 0
          : newValues !== null && newValues !== undefined

        if (!readOnly && (!notNull || hasSelection)) {
          onChange(newValues)
          if (typeof onConditionChange === 'function') {
            onConditionChange(newValues)
          }
        }
      },
      [onChange, onConditionChange, readOnly, notNull]
    )

    const handleCardChange = useCallback(
      (optionValue) => {
        const selectedValues = Array.isArray(optionSelected)
          ? optionSelected
          : []

        const isSelected = multiple
          ? selectedValues.includes(optionValue)
          : optionSelected === optionValue

        const newValues = multiple
          ? isSelected
            ? selectedValues.filter((value) => value !== optionValue)
            : [...selectedValues, optionValue]
          : isSelected
          ? null
          : optionValue

        handleChange(newValues)
      },
      [handleChange, multiple, optionSelected]
    )

    // Safe loading of default value
    useEffect(() => {
      if (
        defaultValue &&
        values?.some(({ text, value }) => [text, value]?.includes(defaultValue))
      ) {
        onChange(defaultValue)
      }
    }, [])

    return (
      <FormControl fullWidth margin="dense">
        {label && (
          <Label htmlFor={cy} error={message}>
            <Text
              className="toggle-controller-label"
              component="span"
              value={label}
              variant={TEXT_VARIANTS.BODY_SMALL}
              weight={TEXT_WEIGHTS.MEDIUM}
            />
            {tooltip && <Tooltip title={tooltip} />}
          </Label>
        )}
        <Box
          id={cy}
          role="group"
          data-cy={cy}
          sx={(theme) => ({
            display: 'flex',
            gap: `${theme.scale[500]}px`,
          })}
        >
          {values?.map(
            (
              { text, value = '', description, startIcon, isDisabled = false },
              index
            ) => (
              <CardButton
                key={`${name}-${value}`}
                ref={index === 0 ? ref : undefined}
                value={value}
                text={text}
                description={description}
                startIcon={startIcon}
                startIconSize="small"
                isSelected={
                  multiple
                    ? Array.isArray(optionSelected) &&
                      optionSelected.includes(value)
                    : optionSelected === value
                }
                isDisabled={fieldProps.disabled || isDisabled || readOnly}
                onBlur={onBlur}
                onClick={() => handleCardChange(value)}
              />
            )
          )}
        </Box>
        {Boolean(message) && (
          <FormHelperText data-cy={`${cy}-error`}>
            <ErrorHelper label={message} />
          </FormHelperText>
        )}
      </FormControl>
    )
  }
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
  defaultValue: PropTypes.any,
}

ToggleController.displayName = 'ToggleController'
