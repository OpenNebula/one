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
import { lazy, string, object, number } from 'yup'
import { getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'
import { INPUT_TYPES } from '@ConstantsModule'
import { VnsTable, VnTemplatesTable } from '@modules/components/Tables'

// Define the network types
export const NETWORK_TYPES = {
  template_id: 'Create',
  reserve_from: 'Reserve',
  id: 'Existing',
}

// Network Type Field
const NETWORK_TYPE = (required = false) => ({
  name: 'type',
  type: INPUT_TYPES.TOGGLE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(NETWORK_TYPES), {
    addEmpty: false,
    getText: (key) => NETWORK_TYPES?.[key],
    getValue: (key) => key,
  }),
  validation: string()
    .trim()
    .nullable(true)
    [required ? 'required' : 'notRequired']()
    .default(() => undefined),
  grid: { md: 12 },
})

// Network Name Field
const NAME = {
  name: 'name',
  label: 'Name',
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { md: 12 },
}

// Network Description Field
const DESCRIPTION = {
  name: 'description',
  label: 'Description',
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

const SIZE = {
  name: 'size',
  label: 'Size',
  dependOf: NETWORK_TYPE.name,
  type: INPUT_TYPES.TEXT,
  htmlType: (TYPE) => (!TYPE || TYPE !== 'reserve_from') && INPUT_TYPES.HIDDEN,
  validation: lazy((_, { parent } = {}) => {
    const isRequired = parent?.type === 'reserve_from'

    return number()
      ?.nullable(true)
      ?.[isRequired ? 'required' : 'notRequired']?.()
  }),
  fieldProps: {
    type: 'number',
  },
  grid: { md: 12 },
}

// Network Selection Field (for 'reserve' or 'existing')
/**
 * @param {boolean} required - Is schema required
 * @returns {object} Input field
 */
const NETWORK_SELECTION = (required = false) => ({
  name: 'value',
  label: 'Network',
  type: INPUT_TYPES.TABLE,
  Table: (TYPE) =>
    TYPE === 'template_id' ? VnTemplatesTable.Table : VnsTable.Table,
  dependOf: NETWORK_TYPE.name,
  validation: string().trim()[required ? 'required' : 'notRequired'](),
  grid: { md: 12 },
  singleSelect: true,
  fieldProps: {
    preserveState: true,
  },
})

/**
 * @param {boolean} required - Is schema required
 * @returns {Array} Input fields
 */
export const NETWORK_INPUT_FIELDS = (required = false) => [
  NETWORK_TYPE(required),
  NAME,
  DESCRIPTION,
  SIZE,
]

/**
 * @param {boolean} required - Is schema required
 * @returns {object} YUP Schema
 */
export const NETWORK_INPUT_SCHEMA = (required) =>
  object().concat(
    getObjectSchemaFromFields([
      ...NETWORK_INPUT_FIELDS(required),
      NETWORK_SELECTION(required),
    ])
  )

export { NETWORK_SELECTION }
