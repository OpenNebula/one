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
import { string, object, ObjectSchema } from 'yup'
import { INPUT_TYPES, T } from 'client/constants'
import { Field, getValidationFromFields } from 'client/utils'

const NAME = {
  name: 'name',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().min(1).trim().required().default(''),
}

const DESCRIPTION = {
  name: 'description',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim().default(''),
}

/**
 * @param {object} config - Form configuration
 * @param {boolean} [config.isUpdate] - Form is updating the provider
 * @returns {Field[]} - List of fields
 */
export const FORM_FIELDS = ({ isUpdate }) =>
  [!isUpdate && NAME, DESCRIPTION].filter(Boolean)

/**
 * @param {object} config - Form configuration
 * @param {boolean} [config.isUpdate] - Form is updating the provider
 * @returns {ObjectSchema} - Schema
 */
export const STEP_FORM_SCHEMA = ({ isUpdate }) =>
  object(getValidationFromFields(FORM_FIELDS({ isUpdate })))
