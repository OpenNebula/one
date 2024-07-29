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
import { string, boolean, number } from 'yup'
import {
  getObjectSchemaFromFields,
  arrayToOptions,
  sentenceCase,
} from 'client/utils'
import { INPUT_TYPES, T } from 'client/constants'

const getTypeProp = (type) => {
  switch (type) {
    case CA_TYPES.boolean:
      return INPUT_TYPES.SWITCH
    case CA_TYPES.text:
    case CA_TYPES.text64:
    case CA_TYPES.number:
    case CA_TYPES.numberfloat:
      return INPUT_TYPES.TEXT
    default:
      return INPUT_TYPES.TEXT
  }
}

const getFieldProps = (type) => {
  switch (type) {
    case CA_TYPES.text:
    case CA_TYPES.text64:
      return { type: 'text' }
    case CA_TYPES.number:
    case CA_TYPES.numberfloat:
      return { type: 'number' }
    default:
      return {}
  }
}

// Define the CA types
const CA_TYPES = {
  text64: 'text64',
  password: 'password',
  number: 'number',
  numberfloat: 'number-float',
  range: 'range',
  rangefloat: 'range-float',
  list: 'list',
  listmultiple: 'list-multiple',
  boolean: 'boolean',
  text: 'text',
}

const CA_TYPE = {
  name: 'type',
  label: T.Type,
  type: INPUT_TYPES.AUTOCOMPLETE,
  values: arrayToOptions(Object.values(CA_TYPES), {
    addEmpty: false,
    getText: (type) => sentenceCase(type),
  }),

  defaultValueProp: CA_TYPES.text,
  validation: string()
    .trim()
    .required()
    .oneOf(Object.values(CA_TYPES))
    .default(() => CA_TYPES.text),
  grid: {
    sm: 1.5,
    md: 1.5,
  },
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
    .required()
    .default(() => ''),
  grid: { sm: 2.5, md: 2.5 },
}

const DESCRIPTION = {
  name: 'description',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { sm: 2.5, md: 2.5 },
}

const DEFAULT_VALUE_TEXT = {
  name: 'defaultvalue',
  label: T.DefaultValue,
  dependOf: CA_TYPE.name,

  htmlType: (type) => type === CA_TYPES.password && INPUT_TYPES.HIDDEN,

  type: getTypeProp,

  fieldProps: getFieldProps,

  validation: string(),

  grid: { sm: 2.5, md: 2.5 },
}

const DEFAULT_VALUE_RANGE_MIN = {
  name: 'defaultvaluerangemin',
  label: T.MinRange,
  dependOf: CA_TYPE.name,

  htmlType: (type) =>
    ![CA_TYPES.range, CA_TYPES.rangefloat].includes(type) && INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  fieldProps: {
    type: 'number',
  },
  validation: number(),
  grid: { sm: 4, md: 4.5 },
}

const DEFAULT_VALUE_RANGE_MAX = {
  name: 'defaultvaluerangemax',
  label: T.MaxRange,
  dependOf: CA_TYPE.name,
  htmlType: (type) =>
    ![CA_TYPES.range, CA_TYPES.rangefloat].includes(type) && INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  fieldProps: {
    type: 'number',
  },
  validation: number(),
  grid: { sm: 4, md: 4.5 },
}

const DEFAULT_VALUE_LIST = {
  name: 'defaultvaluelist',
  label: T.UIOptionsConcept,
  dependOf: CA_TYPE.name,
  htmlType: (type) =>
    ![CA_TYPES.listmultiple, CA_TYPES.list].includes(type) &&
    INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  fieldProps: {
    type: 'text',
  },
  validation: string(),
  grid: { sm: 9, md: 9 },
}

const MANDATORY = {
  name: 'mandatory',
  label: T.Mandatory,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().yesOrNo(),
  grid: { sm: 2, md: 2 },
}

export const CUSTOM_ATTRIBUTES_FIELDS = [
  CA_TYPE,
  NAME,
  DESCRIPTION,
  DEFAULT_VALUE_TEXT,
  MANDATORY,
  DEFAULT_VALUE_RANGE_MIN,
  DEFAULT_VALUE_RANGE_MAX,
  DEFAULT_VALUE_LIST,
]

export const CUSTOM_ATTRIBUTES_SCHEMA = getObjectSchemaFromFields(
  CUSTOM_ATTRIBUTES_FIELDS
)
