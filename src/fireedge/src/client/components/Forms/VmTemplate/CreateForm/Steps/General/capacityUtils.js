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
import {
  boolean,
  number,
  lazy,
  string,
  array,
  ref,
  BaseSchema,
  NumberSchema,
} from 'yup'

import { getUserInputParams } from 'client/models/Helper'
import { Field, arrayToOptions, sentenceCase } from 'client/utils'
import { T, INPUT_TYPES, USER_INPUT_TYPES } from 'client/constants'

const { fixed, range, rangeFloat, list } = USER_INPUT_TYPES

const MODIFICATION_TRANSLATES = {
  MEMORY: {
    label: T.MemoryModification,
    tooltip: T.AllowUsersToModifyMemory,
  },
  CPU: {
    label: T.CpuModification,
    tooltip: T.AllowUsersToModifyCpu,
  },
  VCPU: {
    label: T.VirtualCpuModification,
    tooltip: T.AllowUsersToModifyVirtualCpu,
  },
}

const isRangeType = (type) => [range, rangeFloat].includes(type)

/** @typedef {'MEMORY'|'CPU'|'VCPU'} CapacityFieldName */
/** @typedef {{ type: string, min: string, max: string, options: string }} ModificationIds */

/**
 * @param {CapacityFieldName} fieldName - Capacity field name
 * @returns {ModificationIds} - Modification ids
 */
const getModificationIdsByFieldName = (fieldName) => ({
  type: `MODIFICATION.${fieldName}.type`,
  min: `MODIFICATION.${fieldName}.min`,
  max: `MODIFICATION.${fieldName}.max`,
  options: `MODIFICATION.${fieldName}.options`,
})

/**
 * @param {CapacityFieldName} fieldName - Capacity field name
 * @param {ModificationIds} [modificationIds] - Modification ids
 * @returns {Field} - Type field for capacity modification
 */
const modificationTypeInput = (fieldName, { type: typeId }) => ({
  name: typeId,
  ...MODIFICATION_TRANSLATES[fieldName],
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions([fixed, range, list], {
    addEmpty: 'Any value',
    getValue: (type) =>
      // allow float numbers on CPU and VCPU
      ['CPU', 'VCPU'].includes(fieldName) && type === range ? rangeFloat : type,
    getText: (type) => sentenceCase(type),
  }),
  validation: lazy((_, { context }) =>
    string()
      .default(() => {
        const capacityUserInput = context.extra?.USER_INPUTS?.[fieldName]
        const { type } = getUserInputParams(capacityUserInput)

        return type
      })
      // Modification type is not required in template
      .afterSubmit(() => undefined)
  ),
  grid: { sm: 12, md: 12 },
})

/**
 * @param {CapacityFieldName} fieldName - Capacity field name
 * @param {ModificationIds} [modificationIds] - Modification ids
 * @returns {Field[]} - Range fields for capacity modification
 */
const modificationRangeInputs = (fieldName, { type, min, max }) => {
  // Common attributes for range inputs (min, max)
  const commonRangeAttributes = {
    type: INPUT_TYPES.TEXT,
    dependOf: type,
    htmlType: (modificationType) =>
      isRangeType(modificationType) ? 'number' : INPUT_TYPES.HIDDEN,
    grid: { sm: 12, md: 6 },
  }

  /**
   * Generates validation for range inputs.
   *
   * @param {object} config - Validation config
   * @param {NumberSchema} config.thenFn - Schema validation when the modification type is range
   * @param {'min'|'max'} config.rangeParam - Range parameter: min or max
   * @returns {BaseSchema} Schema validation for range inputs
   */
  const commonRangeValidation = ({ thenFn, rangeParam }) =>
    lazy((_, { context }) =>
      number()
        .positive()
        .transform((value) => (!isNaN(value) ? value : null))
        .when(`$general.${type}`, {
          is: isRangeType,
          then: thenFn,
          otherwise: (schema) => schema.optional().nullable(),
        })
        .default(() => {
          const capacityUserInput = context.extra?.USER_INPUTS?.[fieldName]
          const params = getUserInputParams(capacityUserInput)

          return params[rangeParam]
        })
    )

  return [
    {
      name: min,
      label: T.Min,
      ...commonRangeAttributes,
      validation: commonRangeValidation({
        thenFn: (schema) => schema.required().lessThan(ref(`$general.${max}`)),
        rangeParam: 'min',
      }),
    },
    {
      name: max,
      label: T.Max,
      ...commonRangeAttributes,
      validation: commonRangeValidation({
        thenFn: (schema) => schema.required().moreThan(ref(`$general.${min}`)),
        rangeParam: 'max',
      }),
    },
  ]
}

/**
 * @param {CapacityFieldName} fieldName - Capacity field name
 * @param {ModificationIds} [modificationIds] - Modification ids
 * @returns {Field} - Options field for capacity modification
 */
const modificationOptionsInput = (fieldName, { type, options: optionsId }) => ({
  name: optionsId,
  label: T.Options,
  tooltip: [T.PressKeysToAddAValue, ['ENTER']],
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  dependOf: type,
  htmlType: (modificationType) =>
    modificationType !== list && INPUT_TYPES.HIDDEN,
  validation: lazy((_, { context }) =>
    array(number().positive())
      .when(`$general.${type}`, {
        is: (modificationType) => modificationType === list,
        then: (schema) => schema.required().min(1),
        otherwise: (schema) => schema.notRequired().nullable(),
      })
      .default(() => {
        const capacityUserInput = context.extra?.USER_INPUTS?.[fieldName]
        const { options = [] } = getUserInputParams(capacityUserInput)
        const numberOpts = options?.filter((opt) => opt !== ' ' && !isNaN(+opt))

        return numberOpts
      })
  ),
  fieldProps: { freeSolo: true },
  grid: { sm: 12, md: 12 },
})

/**
 * @param {CapacityFieldName} fieldName - Capacity field name
 * @returns {Field[]} - Fields for capacity modification
 */
export const generateModificationInputs = (fieldName) => {
  const modificationIds = getModificationIdsByFieldName(fieldName)

  return [
    modificationTypeInput(fieldName, modificationIds),
    modificationOptionsInput(fieldName, modificationIds),
    ...modificationRangeInputs(fieldName, modificationIds),
  ]
}

/**
 * @param {Field} hrField - Hot resize field
 * @param {CapacityFieldName} hrField.fieldName - Capacity field name
 * @param {Field} maxField - Max field
 * @returns {Field[]} Hot resize fields
 */
export const generateHotResizeInputs = (
  { name: hrFieldName, ...hrField },
  maxField
) => [
  {
    ...hrField,
    name: `HOT_RESIZE.${hrFieldName}`,
    dependOf: `HOT_RESIZE.${hrFieldName}`,
    label: T.EnableHotResize,
    type: INPUT_TYPES.SWITCH,
    validation: boolean().yesOrNo(),
    grid: { sm: 12, md: 5 },
  },
  {
    ...maxField,
    dependOf: `HOT_RESIZE.${hrFieldName}`,
    type: INPUT_TYPES.TEXT,
    htmlType: (enabledHr) => (enabledHr ? 'number' : INPUT_TYPES.HIDDEN),
    validation: number()
      .positive()
      .default(() => undefined)
      .when(`HOT_RESIZE.${hrFieldName}`, (enabledHr, schema) =>
        enabledHr ? schema.required() : schema.notRequired()
      ),
    grid: { sm: 12, md: 7 },
  },
]

/**
 * @param {Field} config - Configuration
 * @param {CapacityFieldName} config.name - Capacity field name
 * @param {BaseSchema} config.validation - Validation schema
 * @returns {Field} - Field with validation modification conditions
 */
export const generateCapacityInput = ({ validation, ...field }) => ({
  ...field,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: validation
    .when(`$general.MODIFICATION.${field.name}.type`, {
      is: (modificationType) =>
        modificationType === range || modificationType === rangeFloat,
      then: (schema) =>
        schema
          .max(ref(`$general.MODIFICATION.${field.name}.max`))
          .min(ref(`$general.MODIFICATION.${field.name}.min`)),
      otherwise: (schema) => schema,
    })
    .when(
      [
        `$general.MODIFICATION.${field.name}.type`,
        `$general.MODIFICATION.${field.name}.options`,
      ],
      (modificationType, options = [], schema) => {
        const optionsNumber = options.map((option) => parseFloat(option))

        return modificationType === list ? schema.oneOf(optionsNumber) : schema
      }
    ),
  grid: { sm: 12, md: 12 },
  fieldProps: { min: 0 },
})

/**
 * @param {Field} config - Configuration
 * @param {CapacityFieldName} config.name - Capacity field name
 * @param {BaseSchema} config.validation - Validation schema
 * @returns {Field} - Field with validation modification conditions
 */
export const generateCostCapacityInput = ({ validation, grid, ...field }) => ({
  ...field,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation:
    typeof validation === 'function'
      ? lazy((_, { context }) => validation(context.extra))
      : validation,
  grid: { sm: 12, md: 12 },
})
