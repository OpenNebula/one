/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { memo, useCallback, useEffect, useState } from 'react'

import { Grid, TextField } from '@mui/material'
import { useController, useWatch } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { T, UNITS } from 'client/constants'
import { generateKey, prettyBytes } from 'client/utils'

const ARRAY_UNITS = Object.values(UNITS)
ARRAY_UNITS.splice(0, 1) // remove KB
const DEFAULT_UNIT = ARRAY_UNITS[0]

const valueInMB = (value = 0, unit = DEFAULT_UNIT) => {
  const idxUnit = ARRAY_UNITS.indexOf(unit)
  const numberValue = +value

  return Math.round(numberValue * (idxUnit <= 0 ? 1 : 1024 ** idxUnit))
}

const InformationUnitController = memo(
  ({
    control,
    cy = `input-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    watcher,
    dependencies,
    fieldProps = {},
    readOnly = false,
    onConditionChange,
  }) => {
    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const {
      field: { ref, value = '', onChange, ...inputProps },
      fieldState: { error },
    } = useController({ name, control })

    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch)
      watcherValue !== undefined && onChange(watcherValue)
    }, [watch, watcher, dependencies])

    const [internalValue, setInternalValue] = useState(+value)
    const [unit, setUnit] = useState(DEFAULT_UNIT)

    useEffect(() => {
      const dataUnits = prettyBytes(value, DEFAULT_UNIT, 2, true)
      setInternalValue(dataUnits.value)
      setUnit(dataUnits.units)
    }, [value])

    const handleChange = useCallback(
      (internalType, valueInput) => {
        if (internalType === 'value') {
          setInternalValue(valueInput)
        } else {
          setUnit(valueInput)
        }

        const valueMB =
          internalType === 'value'
            ? valueInMB(valueInput, unit)
            : valueInMB(internalValue, valueInput)

        onChange(valueMB)
        if (typeof onConditionChange === 'function') {
          onConditionChange(valueMB)
        }
      },
      [onChange, onConditionChange]
    )

    return (
      <div>
        <Grid container spacing={1} width={1}>
          <Grid item style={{ flexGrow: 1 }}>
            <TextField
              {...inputProps}
              fullWidth
              inputRef={ref}
              value={internalValue}
              onChange={(e) => handleChange('value', e.target.value)}
              rows={3}
              type="number"
              label={labelCanBeTranslated(label) ? Tr(label) : label}
              InputProps={{
                readOnly,
                endAdornment: tooltip && <Tooltip title={tooltip} />,
              }}
              inputProps={{
                'data-cy': cy,
                ...{
                  min: fieldProps.min,
                  max: fieldProps.max,
                  step: fieldProps.step,
                },
              }}
              error={Boolean(error)}
              helperText={
                error ? (
                  <ErrorHelper label={error?.message} />
                ) : (
                  fieldProps.helperText
                )
              }
              FormHelperTextProps={{ 'data-cy': `${cy}-error` }}
              {...fieldProps}
            />
          </Grid>
          <Grid item>
            <TextField
              select
              value={unit}
              InputProps={{
                readOnly,
                'data-cy': `${cy}-unit`,
              }}
              label={Tr(T.MemoryUnit)}
              onChange={(e) => handleChange('unit', e.target.value)}
            >
              {ARRAY_UNITS.map((option, index) => (
                <option
                  key={`${option}-${index}`}
                  value={option}
                  data-cy={`${cy}-unit-${option}`}
                >
                  {option}
                </option>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </div>
    )
  },
  (prevProps, nextProps) =>
    prevProps.type === nextProps.type &&
    prevProps.label === nextProps.label &&
    prevProps.tooltip === nextProps.tooltip &&
    prevProps.fieldProps?.value === nextProps.fieldProps?.value &&
    prevProps.fieldProps?.helperText === nextProps.fieldProps?.helperText &&
    prevProps.readOnly === nextProps.readOnly
)

InformationUnitController.propTypes = {
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
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
}

InformationUnitController.displayName = 'InformationUnitController'

export default InformationUnitController
