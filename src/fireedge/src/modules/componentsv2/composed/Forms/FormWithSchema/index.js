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
import PropTypes from 'prop-types'
import {
  Fragment,
  ReactElement,
  createElement,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { v4 as uuidv4 } from 'uuid'

import { Box, FormControl, Grid } from '@mui/material'
import { useFormContext, useFormState, useWatch } from 'react-hook-form'

import { INPUT_TYPES } from '@ConstantsModule'
import { Field, deepStringify, isDeeplyEmpty, simpleHash } from '@UtilsModule'
import { Accordion } from '@modules/componentsv2/primitives/Accordion'
import { TextController } from '@modules/componentsv2/composed/Forms/FormControl/TextController'
import { PasswordController } from '@modules/componentsv2/composed/Forms/FormControl/PasswordController'
import { OtpController } from '@modules/componentsv2/composed/Forms/FormControl/OtpController'
import { SelectController } from '@modules/componentsv2/composed/Forms/FormControl/SelectController'
import { SliderController } from '@modules/componentsv2/composed/Forms/FormControl/SliderController'
import { SwitchController } from '@modules/componentsv2/composed/Forms/FormControl/SwitchController'
import { CheckboxController } from '@modules/componentsv2/composed/Forms/FormControl/CheckboxController'
import { AutocompleteController } from '@modules/componentsv2/composed/Forms/FormControl/AutocompleteController'
import { FileController } from '@modules/componentsv2/composed/Forms/FormControl/FileController'
import { TimeController } from '@modules/componentsv2/composed/Forms/FormControl/TimeController'
import { TableController } from '@modules/componentsv2/composed/Forms/FormControl/TableController'
import { ToggleController } from '@modules/componentsv2/composed/Forms/FormControl/ToggleController'
import { DockerfileController } from '@modules/componentsv2/composed/Forms/FormControl/DockerfileController'
import { InformationUnitController } from '@modules/componentsv2/composed/Forms/FormControl/InformationUnitController'
import { InformationUnitControllerKB } from '@modules/componentsv2/composed/Forms/FormControl/InformationUnitControllerKB'
import { TypographyController } from '@modules/componentsv2/composed/Forms/FormControl/TypographyController'
import { RadioController } from '@modules/componentsv2/composed/Forms/FormControl/RadioController'
import {
  useDisableStep,
  useRegisterModifiedFields,
  Legend,
} from '@modules/componentsv2/composed/Forms/FormStepper'

import { useGeneralApi } from '@FeaturesModule'
import { get, merge, set, startsWith } from 'lodash'
import { useSelector } from 'react-redux'

const NOT_DEPEND_ATTRIBUTES = [
  'watcher',
  'transform',
  'getRowId',
  'filterData',
  'renderValue',
  'selectValues',
  'text',
]

const INPUT_CONTROLLER = {
  [INPUT_TYPES.TEXT]: TextController,
  [INPUT_TYPES.PASSWORD]: PasswordController,
  [INPUT_TYPES.OTP]: OtpController,
  [INPUT_TYPES.SELECT]: SelectController,
  [INPUT_TYPES.SLIDER]: SliderController,
  [INPUT_TYPES.SWITCH]: SwitchController,
  [INPUT_TYPES.CHECKBOX]: CheckboxController,
  [INPUT_TYPES.AUTOCOMPLETE]: AutocompleteController,
  [INPUT_TYPES.FILE]: FileController,
  [INPUT_TYPES.TIME]: TimeController,
  [INPUT_TYPES.TABLE]: TableController,
  [INPUT_TYPES.TOGGLE]: ToggleController,
  [INPUT_TYPES.DOCKERFILE]: DockerfileController,
  [INPUT_TYPES.UNITS]: InformationUnitController,
  [INPUT_TYPES.UNITSKB]: InformationUnitControllerKB,
  [INPUT_TYPES.TYPOGRAPHY]: TypographyController,
  [INPUT_TYPES.RADIO]: RadioController,
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
 * @param {object} props.gridContainerSx - Styles to use in the grid container
 * @param {object} props.gridItemSx - Styles to use in the grid items
 * @param {Field[][]} props.columns - Fields grouped by columns
 * @returns {ReactElement} - The form component
 */
export const FormWithSchema = ({
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
  gridContainerSx,
  gridItemSx,
  columns,
}) => {
  const { setModifiedFields, setFieldPath } = useGeneralApi()
  const { sx: sxRoot, ...restOfRootProps } = rootProps ?? {}
  const formContext = useFormContext()
  const registerModifiedFields = useRegisterModifiedFields()
  const saveModifiedFieldsRef = useRef(() => {})
  const { touchedFields, dirtyFields } = useFormState({
    control: formContext.control,
  })

  const getFields = useMemo(
    () => (typeof fields === 'function' ? fields() : fields),
    [fields]
  )

  const saveModifiedFields = useCallback(() => {
    if (!saveState) return

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
    const ensuredFields = getFields ?? []

    // Fields that have a value on dependOf attribute (if depend is in a different schema, the name of the field will contain the step id and starts with $)
    const fieldWithDepend = ensuredFields.filter((item) =>
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
    const fieldPathOverrides = {}

    ensuredFields.forEach((field) => {
      const value = get(fieldsToMerge, `${id}.${field.name}`)
      if (value) {
        if (field?.fieldPath) {
          set(fieldPathOverrides, field.fieldPath, value)
        } else {
          set(fieldsToMergeinSchema, `${id}.${field.name}`, value)
        }
      }
    })

    const mix = merge({}, fieldsToMergeinSchema, fieldsHiddenMerge)
    if (!isDeeplyEmpty(mix)) {
      setModifiedFields(mix)
    }

    if (!isDeeplyEmpty(fieldPathOverrides)) {
      setModifiedFields(fieldPathOverrides, { direct: true })
    }

    if (fieldPath) {
      setFieldPath(fieldPath)
    }
  }, [
    dirtyFields,
    fieldPath,
    formContext,
    getFields,
    id,
    saveState,
    setFieldPath,
    setModifiedFields,
  ])

  saveModifiedFieldsRef.current = saveModifiedFields

  useEffect(
    () => () => {
      saveModifiedFieldsRef.current()
    },
    [touchedFields, dirtyFields]
  )

  useEffect(() => {
    if (!saveState) return undefined

    return registerModifiedFields(() => saveModifiedFieldsRef.current())
  }, [registerModifiedFields, saveState])

  const fieldsByName = useMemo(
    () => new Map(getFields?.map?.((field) => [field?.name, field]) ?? []),
    [getFields]
  )

  const getColumns = useMemo(() => {
    const rawColumns = typeof columns === 'function' ? columns() : columns

    if (!Array.isArray(rawColumns) || rawColumns.length === 0) return []

    return rawColumns.map((column) =>
      [].concat(column).map((field) => {
        if (typeof field === 'string') return fieldsByName.get(field)

        return field
      })
    )
  }, [columns, fieldsByName])

  const hasColumns = getColumns.length > 0
  const columnFields = useMemo(
    () =>
      getColumns.flatMap((column, columnIndex) =>
        column
          .map((field, rowIndex) => ({ columnIndex, field, rowIndex }))
          .filter(({ field }) => Boolean(field))
      ),
    [getColumns]
  )

  const columnFieldNames = useMemo(
    () =>
      new Set(
        columnFields.map(({ field }) => field?.name).filter((name) => name)
      ),
    [columnFields]
  )

  const fieldsOutsideColumns = useMemo(
    () =>
      getFields?.filter?.((field) => {
        if (!field?.name) return true

        return !columnFieldNames.has(field.name)
      }) ?? [],
    [getFields, columnFieldNames]
  )

  const getColumnFieldGrid = (rowIndex, columnIndex) => ({
    xs: 12,
    sm: 12,
    md: 12,
    lg: 12,
    xl: 12,
    sx: {
      alignSelf: 'center',
      gridColumn: { md: `${columnIndex + 1}` },
      gridRow: { md: `${rowIndex + 1}` },
      minWidth: 0,
      width: '100%',
    },
  })

  const getFieldOutsideColumnGrid = () => ({
    xs: 12,
    sm: 12,
    md: 12,
    lg: 12,
    xl: 12,
    sx: {
      gridColumn: { md: '1 / -1' },
      minWidth: 0,
      width: '100%',
    },
  })

  const renderField = (field, grid) => (
    <FieldComponent
      key={field?.name}
      cy={cy}
      id={id}
      {...field}
      grid={grid ?? field?.grid}
      gridItemSx={gridItemSx}
    />
  )

  if (!getFields || getFields?.length === 0) return null

  const legendContent = legend && !hiddenLegend && (
    <Legend
      className="form-legend"
      data-cy={`legend-${cy}`}
      title={legend}
      tooltip={legendTooltip}
      disableGutters={accordion}
      hiddenLegend={hiddenLegend}
    />
  )

  const fieldsContent = hasColumns ? (
    <Box
      sx={(theme) => ({
        alignItems: 'center',
        display: 'grid',
        gap: `${theme.scale[600]}px`,
        gridTemplateColumns: {
          xs: '1fr',
          md: `repeat(${getColumns.length}, minmax(0, 1fr))`,
        },
        minWidth: 0,
        width: '100%',
        ...gridContainerSx,
      })}
    >
      {columnFields.map(({ columnIndex, field, rowIndex }) =>
        renderField(field, getColumnFieldGrid(rowIndex, columnIndex))
      )}
      {fieldsOutsideColumns.map((field) =>
        renderField(field, getFieldOutsideColumnGrid())
      )}
    </Box>
  ) : (
    <Grid
      container
      spacing={1}
      alignContent="flex-start"
      alignItems="flex-start"
      sx={gridContainerSx}
    >
      {getFields?.map?.((field) => renderField(field))}
    </Grid>
  )

  return (
    <FormControl
      component="fieldset"
      sx={{ width: '100%', ...sxRoot }}
      {...restOfRootProps}
    >
      {accordion && legend ? (
        <Accordion
          options={[{ title: legendContent, description: fieldsContent }]}
        />
      ) : (
        <>
          {legendContent}
          {fieldsContent}
        </>
      )}
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
  gridContainerSx: PropTypes.object,
  gridItemSx: PropTypes.object,
  columns: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.arrayOf(
      PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.object])
      )
    ),
  ]),
}

const FieldComponent = memo(
  ({ id, cy, dependOf, stepControl, gridItemSx, legend, ...attributes }) => {
    const formContext = useFormContext()

    const disableSteps = useDisableStep()

    const currentState = useSelector((state) => state)

    // Potentially prefixes form ID + split ID
    const addIdToName = useCallback(
      (fieldName, formId, split = 0) => {
        if (fieldName?.startsWith('$')) return fieldName.slice(1)

        return `${formId ? `${formId}.` : ''}${fieldName}${
          split > 0 ? `_${split}` : ''
        }`
      },
      [id]
    )

    const nameOfDependField = useMemo(() => {
      if (!dependOf) return null

      return Array.isArray(dependOf)
        ? dependOf.map((fieldName) => addIdToName(fieldName, id))
        : addIdToName(dependOf, id)
    }, [dependOf, addIdToName])

    const valueOfDependField = useWatch({
      name: nameOfDependField,
      disabled: dependOf === undefined,
    })

    const handleConditionChange = useCallback(
      (value) => {
        const ensureStepControl = [].concat(stepControl)

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

    const {
      name,
      type,
      htmlType,
      grid,
      condition,
      splits = 1,
      ...fieldProps
    } = Object.entries(attributes).reduce((field, [attrKey, attrValue]) => {
      const isNotDependAttribute = NOT_DEPEND_ATTRIBUTES.includes(attrKey)

      const finalValue =
        !isNotDependAttribute &&
        typeof attrValue === 'function' &&
        !isValidElement(attrValue())
          ? attrValue(valueOfDependField, formContext)
          : attrValue

      return { ...field, [attrKey]: finalValue }
    }, {})

    const dataCy = useMemo(
      () => `${cy}-${name ?? ''}`.replaceAll('.', '-'),
      [cy]
    )
    const isHidden = useMemo(() => htmlType === INPUT_TYPES.HIDDEN, [htmlType])
    // Key is computed in first hand based on it's type, meaning we re-render if type changes.
    const key = useMemo(
      () =>
        `${name}_${simpleHash(
          deepStringify(
            fieldProps?.type ??
              fieldProps?.identifier ??
              fieldProps?.values ??
              Object.values(fieldProps),
            3 // Max object depth
          )
        )}` || uuidv4(),
      [(name, type, htmlType, condition, fieldProps)]
    )

    if (isHidden) return null

    const { sx: gridSx, ...gridProps } = grid ?? {}

    function* generateInputs() {
      for (let i = 0; i < splits; i++) {
        yield (
          <Fragment key={`${key}-split-${i}`}>
            {legend && (
              <Legend
                data-cy={`legend-${cy}`}
                title={legend}
                disableGutters={false}
                marginTop="1em"
              />
            )}
            <Grid
              key={`split-${i}`}
              item
              xs={12}
              md={6}
              {...gridProps}
              sx={[gridSx, gridItemSx].filter(Boolean)}
            >
              {createElement(INPUT_CONTROLLER[type], {
                key: `${key}-${i}`,
                control: formContext.control,
                cy: dataCy,
                dependencies: nameOfDependField,
                name: addIdToName(name, id, i),
                type: htmlType === false ? undefined : htmlType,
                dependOf,
                onConditionChange: handleConditionChange,
                ...fieldProps,
              })}
            </Grid>
          </Fragment>
        )
      }
    }

    return INPUT_CONTROLLER[type] && <>{[...generateInputs()]}</>
  }
)

FieldComponent.propTypes = {
  id: PropTypes.string,
  cy: PropTypes.string,
  dependOf: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  legend: PropTypes.string,
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
  gridItemSx: PropTypes.object,
}

FieldComponent.displayName = 'FieldComponent'
