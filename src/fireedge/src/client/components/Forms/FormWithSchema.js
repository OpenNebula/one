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
import {
  Fragment,
  ReactElement,
  createElement,
  isValidElement,
  memo,
  useCallback,
  useMemo,
  useEffect,
} from 'react'

import { Accordion, AccordionSummary, FormControl, Grid } from '@mui/material'
import { useFormContext, useWatch, useFormState } from 'react-hook-form'

import * as FC from 'client/components/FormControl'
import { useDisableStep } from 'client/components/FormStepper'
import Legend from 'client/components/Forms/Legend'
import { INPUT_TYPES } from 'client/constants'
import { Field, deepStringify, simpleHash } from 'client/utils'

import { get, set, merge, startsWith } from 'lodash'
import { useSelector } from 'react-redux'
import { isDeeplyEmpty } from 'client/utils/parser'
import { useGeneralApi } from 'client/features/General'

const NOT_DEPEND_ATTRIBUTES = [
  'watcher',
  'transform',
  'getRowId',
  'renderValue',
  'selectValues',
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
  [INPUT_TYPES.DOCKERFILE]: FC.DockerfileController,
  [INPUT_TYPES.UNITS]: FC.InformationUnitController,
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
 * @param {boolean} props.saveState - Save form state to redux
 * @param {string} props.fieldPath - Field path to set after touched or dirty fields change
 * @param {boolean} props.hiddenLegend - Hide the legend of the form
 * @returns {ReactElement} - The form component
 */
const FormWithSchema = ({
  accordion = false,
  id,
  cy,
  fields,
  rootProps,
  legend,
  hiddenLegend = false,
  legendTooltip,
  saveState,
  fieldPath,
}) => {
  const { setModifiedFields, setFieldPath } = useGeneralApi()
  const { sx: sxRoot, ...restOfRootProps } = rootProps ?? {}
  const formContext = useFormContext()
  const { touchedFields, dirtyFields } = useFormState({
    control: formContext.control,
  })

  useEffect(
    () => () => {
      if (saveState) {
        // Fields to add to the modifiedFields
        let fieldsToMerge = {}

        // Get the fields that are dirty
        const touchedDirtyFields = dirtyFields

        // Add to the fieldsToMerge
        if (!isDeeplyEmpty(touchedDirtyFields)) {
          fieldsToMerge = touchedDirtyFields
        }

        // Check hidden fields that have a dependOf that is a field touched or dirty so the hidden field has to be add to the modifiedFields
        const fieldsHiddenMerge = {}

        // Fields that have a value on dependOf attribute (if depend is in a different schema, the name of the field will contain the step id and starts with $)
        const fieldWithDepend = fields.filter((item) =>
          item.dependOf && Array.isArray(item.dependOf)
            ? item.dependOf.some((dependItem) =>
                get(
                  id ? fieldsToMerge[id] : fieldsToMerge,
                  startsWith(dependItem, '$' + id)
                    ? dependItem.substring(id.length + 2)
                    : dependItem
                )
              )
            : get(
                id ? fieldsToMerge[id] : fieldsToMerge,
                startsWith(item.dependOf, '$' + id)
                  ? item.dependOf.substring(id.length + 2)
                  : item.dependOf
              )
        )

        // The fields that has a dependOf and has htmlType hidden has to be deleted
        fieldWithDepend
          .filter((field) => {
            const htmlTypeFunction = typeof field.htmlType === 'function'

            const valueDependOf = Array.isArray(field.dependOf)
              ? field.dependOf.map((depend) =>
                  formContext?.getValues(
                    `${id}.` +
                      (startsWith(depend, '$' + id)
                        ? depend.substring(id.length + 2)
                        : depend)
                  )
                )
              : formContext?.getValues(
                  `${id}.` +
                    (startsWith(field.dependOf, '$' + id)
                      ? field.dependOf.substring(id.length + 2)
                      : field.dependOf)
                )

            const hidden =
              (htmlTypeFunction &&
                field.htmlType(valueDependOf, formContext) === 'hidden') ||
              (!htmlTypeFunction && field.htmlType === 'hidden')

            return field.htmlType && hidden
          })
          .map((item) => item.name)
          .forEach((element) => {
            set(fieldsHiddenMerge, id ? `${id}.${element}` : `${element}`, {
              __delete__: true,
            })
          })

        // The fields that has a dependOf and has htmlType different that hidden has to be added
        fieldWithDepend
          .filter((field) => {
            const htmlTypeFunction = typeof field.htmlType === 'function'

            const valueDependOf = Array.isArray(field.dependOf)
              ? field.dependOf.map((depend) =>
                  formContext?.getValues(
                    `${id}.` +
                      (startsWith(depend, '$' + id)
                        ? depend.substring(id.length + 2)
                        : depend)
                  )
                )
              : formContext?.getValues(
                  `${id}.` +
                    (startsWith(field.dependOf, '$' + id)
                      ? field.dependOf.substring(id.length + 2)
                      : field.dependOf)
                )

            const notHidden =
              (htmlTypeFunction &&
                field.htmlType(valueDependOf, formContext) !== 'hidden') ||
              (!htmlTypeFunction && field.htmlType !== 'hidden')

            // return field.htmlType && notHidden
            return notHidden
          })
          .map((item) => item.name)
          .forEach((element) => {
            set(fieldsHiddenMerge, id ? `${id}.${element}` : `${element}`, true)
          })

        const fieldsToMergeinSchema = {}

        // Add only the fields of the FormWithSchema component that is being checking
        fields.forEach(
          (field) =>
            get(fieldsToMerge, `${id}.${field.name}`) &&
            set(
              fieldsToMergeinSchema,
              `${id}.${field.name}`,
              get(fieldsToMerge, `${id}.${field.name}`)
            )
        )

        // Set modified fields
        const mix = merge({}, fieldsToMergeinSchema, fieldsHiddenMerge)
        setModifiedFields(mix)

        // If fieldPath exists, set in the store
        if (fieldPath) {
          setFieldPath(fieldPath)
        }
      }
    },
    [touchedFields, dirtyFields]
  )

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
    [accordion, legend, hiddenLegend]
  )

  const LegendWrapper = useMemo(
    () => (accordion && legend ? AccordionSummary : Fragment),
    [accordion, legend, hiddenLegend]
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
          {legend && !hiddenLegend && (
            <Legend
              data-cy={`legend-${cy}`}
              title={legend}
              tooltip={legendTooltip}
              disableGutters={accordion}
              hiddenLegend={hiddenLegend}
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
  saveState: PropTypes.bool,
  fieldPath: PropTypes.string,
  hiddenLegend: PropTypes.bool,
}

const FieldComponent = memo(
  ({ id, cy, dependOf, stepControl, ...attributes }) => {
    const formContext = useFormContext()

    const disableSteps = useDisableStep()

    const currentState = useSelector((state) => state)

    const addIdToName = useCallback(
      (n) => {
        // removes character '$' and returns
        if (n?.startsWith('$')) return n.slice(1)

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
    })

    const handleConditionChange = useCallback(
      (value) => {
        // Ensure step control as an array
        const ensureStepControl = Array.isArray(stepControl)
          ? stepControl
          : stepControl
          ? [stepControl]
          : []

        // Iterate over each step control to evaluate it
        ensureStepControl.forEach((stepControlItem) => {
          // eslint-disable-next-line no-shadow
          const { condition, statePaths, steps } = stepControlItem || {}

          // Exit if no condition
          if (!condition) return

          // Decide if disable or not a step
          const stateValues =
            statePaths?.map((path) => get(currentState, path)) || []
          const conditionResult = condition(value, ...stateValues)
          disableSteps && disableSteps(steps, conditionResult)
        })
      },
      [stepControl, disableSteps, currentState]
    )

    const { name, type, htmlType, grid, condition, ...fieldProps } =
      Object.entries(attributes).reduce((field, attribute) => {
        const [attrKey, value] = attribute
        const isNotDependAttribute = NOT_DEPEND_ATTRIBUTES.includes(attrKey)

        const finalValue =
          typeof value === 'function' &&
          !isNotDependAttribute &&
          !isValidElement(value())
            ? value(valueOfDependField, formContext)
            : value

        return { ...field, [attrKey]: finalValue }
      }, {})

    const dataCy = useMemo(
      () => `${cy}-${name ?? ''}`.replaceAll('.', '-'),
      [cy]
    )
    const inputName = useMemo(() => addIdToName(name), [addIdToName, name])
    const isHidden = useMemo(() => htmlType === INPUT_TYPES.HIDDEN, [htmlType])
    // Key is computed in first hand based on it's type, meaning we re-render if type changes.
    const key = useMemo(
      () =>
        fieldProps
          ? `${name}-${simpleHash(
              deepStringify(
                fieldProps?.type ??
                  fieldProps?.values ??
                  Object.values(fieldProps),
                3 // Max object depth
              )
            )}`
          : undefined,
      [fieldProps]
    )

    if (isHidden) return null

    return (
      INPUT_CONTROLLER[type] && (
        <Grid item xs={12} md={6} {...grid}>
          {createElement(INPUT_CONTROLLER[type], {
            key,
            control: formContext.control,
            cy: dataCy,
            dependencies: nameOfDependField,
            name: inputName,
            type: htmlType === false ? undefined : htmlType,
            dependOf,
            onConditionChange: handleConditionChange,
            ...fieldProps,
          })}
        </Grid>
      )
    )
  }
)

FieldComponent.propTypes = {
  id: PropTypes.string,
  cy: PropTypes.string,
  dependOf: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  stepControl: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        condition: PropTypes.func,
        steps: PropTypes.arrayOf(PropTypes.string),
        statePaths: PropTypes.arrayOf(PropTypes.string),
      })
    ),
    PropTypes.shape({
      condition: PropTypes.func,
      steps: PropTypes.arrayOf(PropTypes.string),
      statePaths: PropTypes.arrayOf(PropTypes.string),
    }),
  ]),
}

FieldComponent.displayName = 'FieldComponent'

export default FormWithSchema
