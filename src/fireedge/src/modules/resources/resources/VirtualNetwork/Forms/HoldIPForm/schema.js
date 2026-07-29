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
import { BaseSchema, string } from 'yup'

import { Field, getObjectSchemaFromFields, REG_ADDR } from '@UtilsModule'
import { T, INPUT_TYPES } from '@ConstantsModule'

/** @type {Field} Address field */
const ADDR_FIELD = {
  name: 'ADDR',
  label: T.FirstAddress,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .matches(REG_ADDR, { message: T.InvalidAddress })
    .default(() => undefined),
  fieldProps: { placeholder: '10.0.0.4' },
  grid: { md: 12 },
}

/** @type {Field[]} Fields */
const FIELDS = [ADDR_FIELD]

/** @type {BaseSchema} Schema */
const SCHEMA = getObjectSchemaFromFields(FIELDS)

export { ADDR_FIELD, FIELDS, SCHEMA }
