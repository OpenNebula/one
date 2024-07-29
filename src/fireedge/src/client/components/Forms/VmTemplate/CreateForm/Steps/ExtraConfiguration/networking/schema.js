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
import { object, string, array, ObjectSchema } from 'yup'

import { T, INPUT_TYPES } from 'client/constants'
import { Field, getObjectSchemaFromFields } from 'client/utils'
import { mapNameByIndex } from '../schema'

/** @returns {Field} NIC filter field */
const FILTER = {
  name: 'NIC_DEFAULT.FILTER',
  label: T.DefaultNicFilter,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @returns {Field} NIC model field */
const MODEL = {
  name: 'NIC_DEFAULT.MODEL',
  label: T.DefaultNicModel,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field[]} List of Network defaults fields */
const FIELDS = [FILTER, MODEL]

/** @type {ObjectSchema} Network schema */
const SCHEMA = object({
  NIC: array()
    .ensure()
    .transform((nics) => nics.map(mapNameByIndex('NIC'))),
  NIC_ALIAS: array()
    .ensure()
    .transform((alias) => alias.map(mapNameByIndex('ALIAS'))),
  PCI: array()
    .ensure()
    .transform((nics) => nics.map(mapNameByIndex('PCI'))),
}).concat(getObjectSchemaFromFields(FIELDS))

export { FIELDS, SCHEMA }
