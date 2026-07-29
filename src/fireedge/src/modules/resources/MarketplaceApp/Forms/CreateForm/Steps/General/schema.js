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
import { boolean, ObjectSchema, string } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getObjectSchemaFromFields } from '@UtilsModule'

/** @type {Field} App name field */
const NAME = {
  name: 'vmname',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Description field */
const DESCRIPTION = {
  name: 'image.DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Import image/templates field */
const IMPORT = {
  name: 'associated',
  label: T.ImportAssociateApp,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

/** @type {Field[]} General fields */
export const FIELDS = [NAME, DESCRIPTION, IMPORT]

/** @type {ObjectSchema} General schema */
export const SCHEMA = getObjectSchemaFromFields(FIELDS)
