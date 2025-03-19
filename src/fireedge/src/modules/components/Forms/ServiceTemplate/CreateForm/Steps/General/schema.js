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
import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getObjectSchemaFromFields } from '@UtilsModule'
import { string } from 'yup'

/** @type {Field} Name field */
const NAME_FIELD = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .min(3)
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Description field */
const DESCRIPTION_FIELD = {
  name: 'description',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .test(
      'is-not-numeric',
      'Description should not be a numeric value',
      (value) => isNaN(value) || value.trim() === ''
    )
    .default(() => undefined),
  grid: { md: 12 },
}

const SCHEMA = getObjectSchemaFromFields([NAME_FIELD, DESCRIPTION_FIELD])

export { SCHEMA, NAME_FIELD, DESCRIPTION_FIELD }
