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
import { ObjectSchema, object, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getValidationFromFields, isValidRFC1123 } from '@UtilsModule'

/** @type {Field} Name field */
export const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  multiline: false,
  validation: string()
    .trim()
    .max(63, T.RFC1123MaxLength)
    .test('rfc1123-check', T.RFC1123, isValidRFC1123),
  tooltip: T.RFC1123Tooltip,
  grid: { md: 12 },
}

/** @type {Field} Description field */
export const DESCRIPTION = {
  name: 'description',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim().default(''),
  grid: { md: 12 },
}

/** @type {Field[]} List of fields */
export const FIELDS = [NAME, DESCRIPTION]

/** @type {ObjectSchema} Schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
