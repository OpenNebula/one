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
import { object, string, ObjectSchema } from 'yup'
import { Field, getValidationFromFields } from 'client/utils'

import { INPUT_TYPES } from 'client/constants'

/** @type {Field} Isolation field */
const ISOLATION = {
  name: 'ISOLATION',
  type: INPUT_TYPES.TEXT,
  validation: string().default(() => ''),
  grid: { md: 12 },
}

/** @type {Field[]} List of fields */
export const FORM_FIELDS_ISOLATION = [ISOLATION]

/** @type {ObjectSchema} Schema */
export const FORM_SCHEMA_ISOLATION = object(
  getValidationFromFields(FORM_FIELDS_ISOLATION)
)
