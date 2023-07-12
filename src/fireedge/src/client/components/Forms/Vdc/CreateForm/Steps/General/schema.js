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
import { Field, getValidationFromFields } from 'client/utils'
import { ObjectSchema, object, string } from 'yup'

/** @type {Field} name field */
const NAME = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Description field */
const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim(),
  grid: { xs: 12, md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [NAME, DESCRIPTION]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
