/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { css } from '@emotion/css'
import { Tooltip } from '@modules/components/FormControl'
import { Tr, labelCanBeTranslated } from '@modules/components/HOC'
import {
  Box,
  FormControl,
  FormHelperText,
  Radio,
  RadioGroup,
  useTheme,
} from '@mui/material'
import { findClosestValue, generateKey } from '@UtilsModule'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { memo, useCallback, useEffect, useMemo } from 'react'
import { useController, useWatch } from 'react-hook-form'

const styles = ({ palette, typography }) => ({
  root: css({
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: '1rem',
  }),
  rootItem: css({
    display: 'inline-table',
    border: `${typography.pxToRem(1)} solid ${palette.grey[400]}`,
    backgroundColor: palette.background.paper,
    borderRadius: typography.pxToRem(8),
    cursor: 'pointer',
    transition: 'border 0.3s ease',
    maxWidth: `calc(33.333% - ${typography.pxToRem(16)})`,
    minWidth: `calc(33.333% - ${typography.pxToRem(16)})`,
    '@media (max-width: 600px)': {
      maxWidth: `calc(50% - ${typography.pxToRem(16)})`,
    },
  }),
  radio: css({
    color: palette.grey[400],
    '&.Mui-checked': {
      color: palette.info.dark,
    },
  }),
  itemSelected: css({
    border: `${typography.pxToRem(1)} solid ${palette.info.dark} !important`,
  }),
  padding: css({
    padding: typography.pxToRem(10),
  }),
  paddingSvg: css({
    padding: `${typography.pxToRem(10)} ${typography.pxToRem(10)} 0`,
  }),
  row: css({
    display: 'table-row',
    alignItems: 'flex-start',
    gap: `${typography.pxToRem(8)}`,
  }),
  cell: css({
    display: 'table-cell',
    verticalAlign: 'middle',
  }),
  cellFull: css({
    width: '100%',
  }),
  svg: css({
    width: '100%',
    height: 'auto',
    overflow: 'hidden',
    '& > svg': {
      width: '100%',
      height: 'auto',
      display: 'inline-block',
    },
  }),
})

const RadioController = memo(
  ({
    control,
    cy = `radio-${generateKey()}`,
    name = '',
    label = '',
    values = [],
    tooltip,
    watcher,
    dependencies,
    defaultValueProp,
    fieldProps = {},
    readOnly = false,
    onConditionChange,
  }) => {
    const theme = useTheme()
    const classes = useMemo(() => styles(theme), [theme])

    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const firstValue = defaultValueProp
      ? values.find((val) => val.value === defaultValueProp)?.value
      : values?.[0]?.value ?? ''

    const defaultValue =
      defaultValueProp !== undefined ? defaultValueProp : firstValue

    const {
      field: { ref, value: optionSelected, onChange, onBlur, ...inputProps },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    useEffect(() => {
      if (!optionSelected) return
      const exists = values.some((o) => `${o.value}` === `${optionSelected}`)
      !exists && onChange(firstValue)
    }, [])

    useEffect(() => {
      if (!watcher || !dependencies) return
      if (!watch) return onChange(defaultValue)

      const watcherValue = watcher(watch)
      const optionValues = values.map((o) => o.value)
      const ensuredWatcherValue = isNaN(watcherValue)
        ? optionValues.find((o) => `${o}` === `${watcherValue}`)
        : findClosestValue(watcherValue, optionValues)

      onChange(ensuredWatcherValue ?? defaultValue)
    }, [watch, watcher, dependencies])

    const handleChange = useCallback(
      (evt) => {
        onBlur()
        onChange(evt.currentTarget.getAttribute('data-value'))
        if (typeof onConditionChange === 'function') {
          onConditionChange(evt.currentTarget.getAttribute('data-value'))
        }
      },
      [onChange, onConditionChange]
    )

    return (
      <FormControl
        component="fieldset"
        error={Boolean(error)}
        {...fieldProps}
        sx={{ width: '100%' }}
      >
        {label && (
          <legend>{labelCanBeTranslated(label) ? Tr(label) : label}</legend>
        )}
        <RadioGroup
          {...inputProps}
          value={optionSelected}
          row
          className={classes.root}
          data-cy={cy}
        >
          {values.map(({ text, value, svg }) => (
            <Box
              key={`${name}-${value}`}
              data-value={value}
              onClick={handleChange}
              className={
                optionSelected === value
                  ? clsx(classes.rootItem, classes.itemSelected)
                  : classes.rootItem
              }
            >
              <Box className={svg ? classes.paddingSvg : classes.padding}>
                <Box className={classes.row}>
                  <Box className={classes.cell}>
                    <Radio
                      inputRef={ref}
                      disabled={readOnly}
                      checked={optionSelected === value}
                      className={classes.radio}
                      inputProps={{ 'data-value': value }}
                    />
                  </Box>
                  <Box className={clsx(classes.cell, classes.cellFull)}>
                    {Tr(text)}
                  </Box>
                </Box>
                {svg && (
                  <Box className={classes.row}>
                    <Box className={classes.cell} />
                    <Box className={clsx(classes.cell, classes.cellFull)}>
                      <div
                        className={classes.svg}
                        dangerouslySetInnerHTML={{ __html: svg }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </RadioGroup>
        {tooltip && <Tooltip title={tooltip} position="start" />}
        {error && <FormHelperText>{error?.message}</FormHelperText>}
      </FormControl>
    )
  },
  (prev, next) =>
    prev.error === next.error &&
    prev.values.length === next.values.length &&
    prev.label === next.label &&
    prev.tooltip === next.tooltip &&
    prev.readOnly === next.readOnly
)

RadioController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  values: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      svg: PropTypes.string,
    })
  ).isRequired,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  defaultValueProp: PropTypes.string,
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
}

RadioController.displayName = 'RadioController'

export default RadioController
