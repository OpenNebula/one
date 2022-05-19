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
/* eslint-disable jsdoc/require-jsdoc */
import {
  Fragment,
  createElement,
  useMemo,
  useCallback,
  isValidElement,
} from 'react'
import PropTypes from 'prop-types'

import { useFormContext } from 'react-hook-form'
import { FormControl, Accordion, AccordionSummary, Grid } from '@mui/material'

import * as FC from 'client/components/FormControl'
import Legend from 'client/components/Forms/Legend'
import { INPUT_TYPES } from 'client/constants'

const NOT_DEPEND_ATTRIBUTES = [
  'watcher',
  'transform',
  'getRowId',
  'renderValue',
]

const INPUT_CONTROLLER = {
  [INPUT_TYPES.TEXT]: FC.TextController,
  [INPUT_TYPES.PASSWORD]: FC.PasswordController,
  [INPUT_TYPES.SELECT]: FC.SelectController,
  [INPUT_TYPES.SLIDER]: FC.SliderController,
  [INPUT_TYPES.SWITCH]: FC.SwitchController,
  [INPUT_TYPES.CHECKBOX]: FC.CheckboxController,
  [INPUT_TYPES.AUTOCOMPLETE]: FC.AutocompleteController,
  [INPUT_TYPES.FILE]: FC.FileController,
  [INPUT_TYPES.TIME]: FC.TimeController,
  [INPUT_TYPES.TABLE]: FC.TableController,
  [INPUT_TYPES.TOGGLE]: FC.ToggleController,
}

const FormWithSchema = ({
  accordion = false,
  id,
  cy,
  fields,
  rootProps,
  className,
  legend,
  legendTooltip,
}) => {
  const formContext = useFormContext()
  const { control, watch } = formContext

  const { sx: sxRoot, ...restOfRootProps } = rootProps ?? {}

  const RootWrapper = useMemo(
    () =>
      accordion && legend
        ? ({ children }) => (
            <Accordion
              variant="transparent"
              TransitionProps={{ unmountOnExit: false }}
            >
              {children}
            </Accordion>
          )
        : Fragment,
    [accordion, legend]
  )

  const LegendWrapper = useMemo(
    () => (accordion && legend ? AccordionSummary : Fragment),
    [accordion, legend]
  )

  const getFields = useMemo(
    () => (typeof fields === 'function' ? fields() : fields),
    [fields?.length]
  )

  if (!getFields || getFields?.length === 0) return null

  const addIdToName = useCallback(
    (name) =>
      name.startsWith('$')
        ? name.slice(1) // removes character '$' and returns
        : id
        ? `${id}.${name}` // concat form ID if exists
        : name,
    [id]
  )

  return (
    <FormControl
      component="fieldset"
      className={className}
      sx={{ width: '100%', ...sxRoot }}
      {...restOfRootProps}
    >
      <RootWrapper>
        <LegendWrapper>
          {legend && (
            <Legend
              data-cy={`legend-${cy}`}
              title={legend}
              tooltip={legendTooltip}
              disableGutters={accordion}
            />
          )}
        </LegendWrapper>
        <Grid container spacing={1} alignContent="flex-start">
          {getFields?.map?.(({ dependOf, ...attributes }) => {
            let valueOfDependField = null
            let nameOfDependField = null

            if (dependOf) {
              nameOfDependField = Array.isArray(dependOf)
                ? dependOf.map(addIdToName)
                : addIdToName(dependOf)

              valueOfDependField = watch(nameOfDependField)
            }

            const { name, type, htmlType, grid, ...fieldProps } =
              Object.entries(attributes).reduce((field, attribute) => {
                const [key, value] = attribute
                const isNotDependAttribute = NOT_DEPEND_ATTRIBUTES.includes(key)

                const finalValue =
                  typeof value === 'function' &&
                  !isNotDependAttribute &&
                  !isValidElement(value())
                    ? value(valueOfDependField, formContext)
                    : value

                return { ...field, [key]: finalValue }
              }, {})

            const dataCy = `${cy}-${name}`.replaceAll('.', '-')
            const inputName = addIdToName(name)

            const isHidden = htmlType === INPUT_TYPES.HIDDEN

            if (isHidden) return null

            return (
              INPUT_CONTROLLER[type] && (
                <Grid key={dataCy} item xs={12} md={6} {...grid}>
                  {createElement(INPUT_CONTROLLER[type], {
                    control,
                    cy: dataCy,
                    formContext,
                    dependencies: nameOfDependField,
                    name: inputName,
                    type: htmlType === false ? undefined : htmlType,
                    ...fieldProps,
                  })}
                </Grid>
              )
            )
          })}
        </Grid>
      </RootWrapper>
    </FormControl>
  )
}

FormWithSchema.propTypes = {
  accordion: PropTypes.bool,
  id: PropTypes.string,
  cy: PropTypes.string,
  fields: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(PropTypes.object),
  ]),
  legend: PropTypes.any,
  legendTooltip: PropTypes.string,
  rootProps: PropTypes.object,
  className: PropTypes.string,
}

export default FormWithSchema
