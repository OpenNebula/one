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
const NAME = {
  name: 'NAME',
  label: T['cluster.create.name'],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Description field */
const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T['cluster.create.description'],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
  grid: { md: 12 },
}

const FIELDS = [NAME, DESCRIPTION]

const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { SCHEMA, FIELDS }
