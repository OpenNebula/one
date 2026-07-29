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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getObjectSchemaFromFields, isValidRFC1123 } from '@UtilsModule'
import { string, ObjectSchema } from 'yup'

/** @type {Field} Name field */
export const NAME = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  multiline: false,
  validation: string()
    .trim()
    .max(63, T.RFC1123MaxLength)
    .required()
    .default(() => undefined)
    .test('rfc1123-check', T.RFC1123, isValidRFC1123),
  tooltip: T.RFC1123Tooltip,
  grid: { md: 12 },
}

/** @type {Field} Description field */
export const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim(),
  grid: { md: 12 },
}

/**
 * @returns {Field[]} Advanced options fields
 */
const FIELDS = () => [NAME, DESCRIPTION]

/**
 * @returns {ObjectSchema} Advanced options schema
 */
const SCHEMA = () => getObjectSchemaFromFields(FIELDS())

export { SCHEMA, FIELDS }
