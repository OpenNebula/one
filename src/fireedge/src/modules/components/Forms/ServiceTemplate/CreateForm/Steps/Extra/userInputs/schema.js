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
import { string, boolean, number, array, lazy } from 'yup'
import {
  getObjectSchemaFromFields,
  arrayToOptions,
  sentenceCase,
} from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'

// Define the UI types
const UI_TYPES = {
  password: 'password',
  number: 'number',
  numberfloat: 'number-float',
  range: 'range',
  rangefloat: 'range-float',
  list: 'list',
  listmultiple: 'list-multiple',
  boolean: 'boolean',
  text: 'text',
  text64: 'text64',
}

const SPLITS = 2

const DISPLAY_OPTIONS = [
  UI_TYPES.range,
  UI_TYPES.rangefloat,
  UI_TYPES.list,
  UI_TYPES.listmultiple,
]

const getType = (type) => {
  switch (type) {
    case UI_TYPES.boolean:
      return {
        html: 'text',
        type: INPUT_TYPES.AUTOCOMPLETE,
        values: ['YES', 'NO'],
        optionsOnly: true,
        validation: string()
          .trim()
          .notRequired()
          .default(() => undefined),
      }
    case UI_TYPES.list:
    case UI_TYPES.listmultiple:
      return {
        html: 'text',
        type: INPUT_TYPES.AUTOCOMPLETE,
        multiple: true,
        hasOptions: true,
        validation: array()
          .of(string().trim())
          .notRequired()
          .default(() => []),
      }
    case UI_TYPES.range:
      return {
        html: 'number',
        label: `${T.Min}/${T.Max}`,
        type: INPUT_TYPES.TEXT,
        split: SPLITS,
        grid: { md: 6 },
        hasOptions: true,
        validation: number()
          .min(0)
          .isFinite()
          .notRequired()
          .default(() => undefined),
      }
    case UI_TYPES.rangefloat:
      return {
        html: 'number',
        label: `${T.Min}/${T.Max}`,
        type: INPUT_TYPES.TEXT,
        split: 2,
        grid: { md: 6 },
        hasOptions: true,
        validation: number()
          .min(0)
          .isFloat()
          .notRequired()
          .default(() => undefined),
      }
    case UI_TYPES.text:
      return {
        html: 'text',
        type: INPUT_TYPES.TEXT,
        multiline: false,
        identifier: UI_TYPES.text,
        validation: string()
          .trim()
          .notRequired()
          .default(() => ''),
      }
    case UI_TYPES.text64:
      return {
        html: 'text',
        type: INPUT_TYPES.TEXT,
        multiline: true,
        identifier: UI_TYPES.text64,
        validation: string()
          .trim()
          .isBase64()
          .notRequired()
          .default(() => ''),
      }
    case UI_TYPES.number:
      return {
        html: 'number',
        type: INPUT_TYPES.TEXT,
        validation: number()
          .isFinite()
          .notRequired()
          .default(() => undefined),
      }
    case UI_TYPES.numberfloat:
      return {
        html: 'number',
        type: INPUT_TYPES.TEXT,
        validation: number()
          .isFloat()
          .notRequired()
          .default(() => undefined),
      }
    case UI_TYPES.password:
      return {
        html: 'password',
        type: INPUT_TYPES.TEXT,
        validation: string()
          .trim()
          .notRequired()
          .default(() => ''),
      }
    default:
      return {
        html: 'text',
        type: INPUT_TYPES.TEXT,
        validation: string()
          .trim()
          .notRequired()
          .default(() => ''),
      }
  }
}

const UI_TYPE = {
  name: 'type',
  label: T.Type,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: arrayToOptions(Object.values(UI_TYPES), {
    addEmpty: false,
    getText: (type) => sentenceCase(type),
  }),
  grid: { md: 12 },
  validation: string()
    .trim()
    .notRequired()
    .oneOf(Object.values(UI_TYPES))
    .default(() => undefined),
}

const MANDATORY = {
  name: 'mandatory',
  label: T.Mandatory,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .uppercase()
    .matches(/^[A-Z0-9_]*$/, {
      message:
        'Name must only contain uppercase alphanumeric characters and no spaces',
      excludeEmptyString: true,
    })
    .notRequired()
    .default(() => ''),
  grid: { md: 12 },
}

const DESCRIPTION = {
  name: 'description',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

const OPTIONS = {
  name: 'options',
  label: (type) => getType(type)?.label ?? T.Options,
  tooltip: [T.PressKeysToAddAValue, ['ENTER']],
  dependOf: UI_TYPE.name,
  type: (type) => getType(type)?.type,
  htmlType: (type) =>
    DISPLAY_OPTIONS?.includes(type) ? getType(type)?.html : INPUT_TYPES.HIDDEN,
  values: (type) =>
    arrayToOptions(getType(type)?.values ?? [], { addEmpty: false }),
  splits: (type) => getType(type)?.split,
  identifier: (type) => getType(type)?.identifier,
  multiple: (type) => getType(type)?.multiple,
  optionsOnly: (type) => getType(type)?.optionsOnly,
  multiline: (type) => getType(type)?.multiline,
  grid: (type) => getType(type)?.grid ?? { md: 12 },
  watcher: (() => {
    let previousName = null
    let previousType = null

    return (type, context) => {
      const { name, formContext: { setValue } = {} } = context

      if (previousName !== name) {
        previousType = type
        previousName = name
      }

      if (previousType !== type) {
        setValue?.(name, undefined)
        previousType = type
      }
    }
  })(),
  validation: lazy((_, { parent: { type } = {} } = {}) => {
    const validation = getType(type)?.hasOptions
      ? getType(type)?.validation
      : string().notRequired()

    return validation
  }),
}

const DEFAULT_VALUE = {
  name: 'default',
  label: T.DefaultValue,
  dependOf: UI_TYPE.name,
  type: (type) => getType(type)?.type,
  htmlType: (type) => getType(type)?.html,
  values: (type) =>
    arrayToOptions(getType(type)?.values ?? [], { addEmpty: false }),
  multiple: (type) => getType(type)?.multiple,
  optionsOnly: (type) => getType(type)?.optionsOnly,
  multiline: (type) => getType(type)?.multiline,
  validation: lazy((_, { parent: { type } = {} } = {}) => {
    const validation = getType(type)?.validation

    return validation
  }),

  grid: { md: 12 },
}
export const USER_INPUTS_FIELDS = [
  UI_TYPE,
  MANDATORY,
  NAME,
  DESCRIPTION,
  OPTIONS,
  DEFAULT_VALUE,
]

export const USER_INPUTS_SCHEMA = getObjectSchemaFromFields([
  ...USER_INPUTS_FIELDS,
  { ...OPTIONS, name: 'options_1' }, // matches split field name
])
