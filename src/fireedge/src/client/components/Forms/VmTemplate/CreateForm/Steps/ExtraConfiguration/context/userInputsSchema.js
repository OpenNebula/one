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
import { object, array, string, boolean, number, ref, ObjectSchema } from 'yup'

import { userInputsToObject, userInputsToArray } from 'client/models/Helper'
import {
  UserInputType,
  T,
  INPUT_TYPES,
  USER_INPUT_TYPES,
} from 'client/constants'
import {
  Field,
  arrayToOptions,
  sentenceCase,
  getObjectSchemaFromFields,
} from 'client/utils'

const {
  password: uiPassword,
  list: uiList,
  listMultiple: uiListMultiple,
  number: uiNumber,
  numberFloat: uiNumberFloat,
  range: uiRange,
  rangeFloat: uiRangeFloat,
  boolean: uiBoolean,
} = USER_INPUT_TYPES

const { array: _array, fixed: _fixed, ...userInputTypes } = USER_INPUT_TYPES

/** @type {UserInputType[]} User inputs types */
const valuesOfUITypes = Object.values(userInputTypes)

/** @type {Field} Type field */
const TYPE = {
  name: 'type',
  label: T.Type,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(valuesOfUITypes, {
    addEmpty: false,
    getText: (type) => sentenceCase(type),
  }),
  validation: string()
    .trim()
    .required()
    .oneOf(valuesOfUITypes)
    .default(() => valuesOfUITypes[0]),
  grid: { sm: 6, md: 4 },
}

/** @type {Field} Name field */
const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { sm: 6, md: 4 },
}

/** @type {Field} Description field */
const DESCRIPTION = {
  name: 'description',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { sm: 6, md: 4 },
}

/** @type {Field} Options field */
const OPTIONS = {
  name: 'options',
  label: T.Options,
  tooltip: [T.PressKeysToAddAValue, ['ENTER']],
  dependOf: TYPE.name,
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  htmlType: (type) =>
    ![uiList, uiListMultiple].includes(type) && INPUT_TYPES.HIDDEN,
  validation: array(string().trim())
    .default(() => [])
    .when(TYPE.name, (type, schema) =>
      [uiList, uiListMultiple].includes(type)
        ? schema.required().min(1)
        : schema.strip().notRequired()
    ),
  fieldProps: {
    freeSolo: true,
    placeholder: 'optA,optB,optC',
  },
  grid: { md: 8 },
}

/** @type {{ MIN: Field, MAX: Field }} Range fields */
const { MIN, MAX } = (() => {
  const validation = number()
    .positive()
    .default(() => undefined)
    .when(TYPE.name, (type, schema) =>
      [uiRange, uiRangeFloat].includes(type)
        ? schema.required()
        : schema.strip().notRequired()
    )

  const common = {
    dependOf: TYPE.name,
    type: INPUT_TYPES.TEXT,
    htmlType: (type) =>
      [uiRange, uiRangeFloat].includes(type) ? 'number' : INPUT_TYPES.HIDDEN,
    grid: { sm: 6, md: 4 },
    fieldProps: (type) => ({ step: type === uiRangeFloat ? 0.01 : 1 }),
  }

  return {
    MIN: {
      ...common,
      name: 'min',
      label: T.Min,
      validation: validation.lessThan(ref('max')),
    },
    MAX: {
      ...common,
      name: 'max',
      label: T.Max,
      validation: validation.moreThan(ref('min')),
    },
  }
})()

/** @type {Field} Default value field */
const DEFAULT_VALUE = {
  name: 'default',
  label: T.DefaultValue,
  dependOf: [TYPE.name, OPTIONS.name],
  type: ([type] = []) =>
    [uiBoolean, uiList, uiListMultiple].includes(type)
      ? INPUT_TYPES.SELECT
      : INPUT_TYPES.TEXT,
  htmlType: ([type] = []) =>
    ({
      [uiNumber]: 'number',
      [uiNumberFloat]: 'number',
      [uiPassword]: INPUT_TYPES.HIDDEN,
    }[type]),
  multiple: ([type] = []) => type === uiListMultiple,
  values: ([type, options = []] = []) =>
    type === uiBoolean
      ? arrayToOptions(['NO', 'YES'])
      : arrayToOptions(options),
  validation: string()
    .trim()
    .default(() => undefined)
    .when(
      [TYPE.name, OPTIONS.name],
      (type, options = [], schema) =>
        ({
          [uiList]: schema.oneOf(options).notRequired(),
          [uiListMultiple]: schema.includesInOptions(options),
          [uiRange]: number().min(ref(MIN.name)).max(ref(MAX.name)).integer(),
          [uiRangeFloat]: number().min(ref(MIN.name)).max(ref(MAX.name)),
          [uiPassword]: schema.strip().notRequired(),
        }[type] ?? schema)
    ),
  grid: { sm: 6, md: 4 },
}

/** @type {Field} Mandatory field */
const MANDATORY = {
  name: 'mandatory',
  label: T.Mandatory,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

/** @type {Field[]} List of User Inputs fields */
export const USER_INPUT_FIELDS = [
  TYPE,
  NAME,
  DESCRIPTION,
  DEFAULT_VALUE,
  OPTIONS,
  MIN,
  MAX,
  MANDATORY,
]

/** @type {ObjectSchema} User Input object schema */
export const USER_INPUT_SCHEMA = getObjectSchemaFromFields(USER_INPUT_FIELDS)

/** @type {ObjectSchema} User Inputs schema */
export const USER_INPUTS_SCHEMA = object({
  USER_INPUTS: array(USER_INPUT_SCHEMA)
    .ensure()
    .afterSubmit((userInputs, { context }) => {
      const capacityInputs = userInputsToArray(context?.general?.MODIFICATION, {
        filterCapacityInputs: false,
      })
        .map(({ name, ...userInput }) => ({
          name,
          ...userInput,
          // set default value from MEMORY, CPU and VCPU fields
          default: context.general?.[name],
          ...(['MEMORY', 'CPU'].includes(name) && { mandatory: true }),
        }))
        .filter((capacityInput) => capacityInput.type)

      return userInputsToObject([...capacityInputs, ...userInputs])
    }),
  INPUTS_ORDER: string()
    .trim()
    .afterSubmit((_inputsOrder_, { context }) => {
      const userInputs = context?.extra?.USER_INPUTS

      return userInputs
        ?.filter(({ name }) => !['MEMORY', 'CPU', 'VCPU'].includes(name))
        ?.map(({ name }) => String(name).toUpperCase())
        .join(',')
    }),
})
