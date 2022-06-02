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
import {
  ReactElement,
  Fragment,
  createElement,
  memo,
  useMemo,
  useCallback,
  isValidElement,
} from 'react'
import PropTypes from 'prop-types'

import { useFormContext, useWatch } from 'react-hook-form'
import { FormControl, Accordion, AccordionSummary, Grid } from '@mui/material'

import * as FC from 'client/components/FormControl'
import Legend from 'client/components/Forms/Legend'
import { Field } from 'client/utils'
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

/**
 * Renders a form with a schema and a legend for each section.
 *
 * @param {object} props - Component props
 * @param {boolean} [props.accordion] - If true, the accordion will be rendered
 * @param {string} [props.id] - The form id to be used as a prefix for the field name
 * @param {string} [props.cy] - The id to be used on testing purposes
 * @param {function():Field[]|Field[]} [props.fields] - The fields to be rendered
 * @param {object} props.rootProps - The props to be passed to the root element
 * @param {*} props.legend - The legend
 * @param {string} props.legendTooltip - The legend tooltip
 * @returns {ReactElement} - The form component
 */
const FormWithSchema = ({
  accordion = false,
  id,
  cy,
  fields,
  rootProps,
  legend,
  legendTooltip,
}) => {
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
    [fields]
  )

  if (!getFields || getFields?.length === 0) return null

  return (
    <FormControl
      component="fieldset"
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
          {getFields?.map?.((field) => (
            <FieldComponent key={field?.name} cy={cy} id={id} {...field} />
          ))}
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
}

const FieldComponent = memo(({ id, cy, dependOf, ...attributes }) => {
  const formContext = useFormContext()

  const addIdToName = useCallback(
    (n) => {
      // removes character '$' and returns
      if (n.startsWith('$')) return n.slice(1)

      // concat form ID if exists
      return id ? `${id}.${n}` : n
    },
    [id]
  )

  const nameOfDependField = useMemo(() => {
    if (!dependOf) return null

    return Array.isArray(dependOf)
      ? dependOf.map(addIdToName)
      : addIdToName(dependOf)
  }, [dependOf, addIdToName])

  const valueOfDependField = useWatch({
    name: nameOfDependField,
    disabled: dependOf === undefined,
    defaultValue: Array.isArray(dependOf) ? [] : undefined,
  })

  /*   const valueOfDependField = useMemo(() => {
    if (!dependOf) return null

    return watch(nameOfDependField)
  }, [dependOf, watch, nameOfDependField]) */

  const { name, type, htmlType, grid, ...fieldProps } = Object.entries(
    attributes
  ).reduce((field, attribute) => {
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

  const dataCy = useMemo(() => `${cy}-${name ?? ''}`.replaceAll('.', '-'), [cy])
  const inputName = useMemo(() => addIdToName(name), [addIdToName, name])
  const isHidden = useMemo(() => htmlType === INPUT_TYPES.HIDDEN, [htmlType])

  if (isHidden) return null

  return (
    INPUT_CONTROLLER[type] && (
      <Grid item xs={12} md={6} {...grid}>
        {createElement(INPUT_CONTROLLER[type], {
          control: formContext.control,
          cy: dataCy,
          dependencies: nameOfDependField,
          name: inputName,
          type: htmlType === false ? undefined : htmlType,
          ...fieldProps,
        })}
      </Grid>
    )
  )
})

FieldComponent.propTypes = {
  id: PropTypes.string,
  cy: PropTypes.string,
  dependOf: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
}

FieldComponent.displayName = 'FieldComponent'

export default FormWithSchema
