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
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getObjectSchemaFromFields } from 'client/utils'
import { string, number } from 'yup'

/** @type {Field} Name field */
const NAME_FIELD = {
  name: 'NAME',
  label: T.ServiceName,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .min(3, 'Service name less than 3 characters')
    .max(128, 'Service name over 128 characters')
    .required('Name cannot be empty')
    .default(() => undefined),
  grid: { md: 12 },
}

/** @type {Field} Description field */
const INSTANCE_FIELD = {
  name: 'INSTANCES',
  label: T.NumberOfInstances,
  type: INPUT_TYPES.TEXT,
  validation: number().required(),
  fieldProps: {
    type: 'number',
  },
  grid: { md: 12 },
}

const SCHEMA = getObjectSchemaFromFields([NAME_FIELD, INSTANCE_FIELD])

export { SCHEMA, NAME_FIELD, INSTANCE_FIELD }
