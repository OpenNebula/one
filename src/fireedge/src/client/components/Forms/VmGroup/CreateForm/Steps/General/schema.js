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
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getObjectSchemaFromFields } from 'client/utils'
import { string } from 'yup'

/** @type {Field} Name field */
const NAME_FIELD = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .min(3, 'Template name less than 3 characters')
    .max(128, 'Template name over 128 characters')
    .required('Name cannot be empty')
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Description field */
const DESCRIPTION_FIELD = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .max(128, 'Description over 128 characters')
    .default(() => undefined),
  grid: { md: 12 },
}

const SCHEMA = getObjectSchemaFromFields([NAME_FIELD, DESCRIPTION_FIELD])

export { SCHEMA, NAME_FIELD, DESCRIPTION_FIELD }
