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
import { Box, FormControl, FormHelperText } from '@mui/material'
import { useController } from 'react-hook-form'
import { TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { ButtonGroup } from '@modules/components/primitives/Buttons/Group'
import { Text } from '@modules/components/primitives/Text'
import { ErrorHelper } from '@modules/components/composed/Forms/FormControl/ErrorHelper'
import { AdornmentWithTooltip as Tooltip } from '@modules/components/composed/Forms/FormControl/Tooltip'
import { generateKey, renderIcon } from '@UtilsModule'

export const ButtonGroupController = memo(
  ({
    control,
    cy = `button-group-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    values = [],
    multiple = false,
    notNull = false,
    readOnly = false,
    fieldProps = {},
    defaultValue,
    onConditionChange,
  }) => {
    const {
      field: { ref, value, onChange, onBlur },
      fieldState: { error },
    } = useController({ name, control, defaultValue })
    const isDisabled = readOnly || fieldProps.disabled

    useEffect(() => {
      const selectedValues = Array.isArray(value) ? value : [value]
      const hasInvalidValue = selectedValues.some(
        (selected) =>
          selected != null &&
          !values.some((option) => option.value === selected)
      )

      if (hasInvalidValue) {
        onChange(multiple ? [] : null)
      }
    }, [multiple, onChange, value, values])

    const handleSelectionChange = useCallback(
      (selected) => {
        if (isDisabled || (notNull && selected.size === 0)) {
          return
        }

        const selectedValues = [...selected]
        const nextValue = multiple ? selectedValues : selectedValues[0] ?? null

        onBlur()
        onChange(nextValue)
        onConditionChange?.(nextValue)
      },
      [isDisabled, multiple, notNull, onBlur, onChange, onConditionChange]
    )

    return (
      <FormControl
        component="fieldset"
        fullWidth
        margin="dense"
        error={Boolean(error)}
      >
        {label && (
          <Box
            component="legend"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
          >
            <Text
              id={`${cy}-label`}
              component="span"
              value={label}
              variant={TEXT_VARIANTS.BODY_SMALL}
              weight={TEXT_WEIGHTS.MEDIUM}
            />
            {tooltip && <Tooltip title={tooltip} />}
          </Box>
        )}
        <Box sx={{ display: 'flex', maxWidth: '100%', overflowX: 'auto' }}>
          <ButtonGroup
            ref={ref}
            id={cy}
            dataCy={cy}
            tabIndex={-1}
            aria-invalid={Boolean(error)}
            onBlur={onBlur}
            selected={value ?? []}
            isMultipleSelectable={multiple}
            onSelectionChange={handleSelectionChange}
            buttons={values.map(
              ({
                text,
                value: optionValue,
                description,
                isDisabled: optionDisabled,
                startIcon,
              }) => ({
                title: text,
                value: optionValue,
                tooltip: description,
                startIcon: renderIcon(startIcon, { width: 16, height: 16 }),
                isDisabled: isDisabled || optionDisabled,
                dataCy: `${cy}-${optionValue}`,
              })
            )}
          />
        </Box>
        {error && (
          <FormHelperText id={`${cy}-error`} data-cy={`${cy}-error`}>
            <ErrorHelper label={error.message} />
          </FormHelperText>
        )}
      </FormControl>
    )
  }
)

ButtonGroupController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  values: PropTypes.arrayOf(PropTypes.object).isRequired,
  multiple: PropTypes.bool,
  notNull: PropTypes.bool,
  readOnly: PropTypes.bool,
  fieldProps: PropTypes.object,
  defaultValue: PropTypes.any,
  onConditionChange: PropTypes.func,
}

ButtonGroupController.displayName = 'ButtonGroupController'
