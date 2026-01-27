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
import { object, ObjectSchema, number } from 'yup'

import { INPUT_TYPES, T } from '@ConstantsModule'
import { Field, getValidationFromFields } from '@UtilsModule'

/** @type {Field} Host field */
const AMOUNT = () => ({
  name: 'amount',
  label: T.NumberOfIPsToAdd,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  fieldProps: { min: 1 },
  grid: { md: 12 },
  validation: number()
    .integer()
    .positive()
    .required()
    .default(() => 1),
})

/** @type {Field[]} List of fields */
export const FIELDS = () => [AMOUNT()]

/** @type {ObjectSchema} Schema */
export const SCHEMA = () => object(getValidationFromFields(FIELDS()))
