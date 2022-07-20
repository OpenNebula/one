/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { string, object, ObjectSchema } from 'yup'
import { Field, getValidationFromFields, encodeBase64 } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

/** @type {Field} Dockerfile field */
export const DOCKERFILE = {
  name: 'PATH',
  label: T.Dockerfile,
  type: INPUT_TYPES.DOCKERFILE,
  cy: 'dockerfile',
  validation: string()
    .trim()
    .required()
    .afterSubmit((value) => encodeBase64(value)),
  grid: { md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [DOCKERFILE]

/**
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
