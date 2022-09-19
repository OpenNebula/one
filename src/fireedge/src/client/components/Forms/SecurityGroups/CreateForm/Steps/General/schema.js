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
import { Field, getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

export const IMAGE_LOCATION_TYPES = {
  PATH: 'path',
  UPLOAD: 'upload',
}

/** @type {Field} name field */
export const NAME = (isUpdate) => ({
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { xs: 12, md: 6 },
  ...(isUpdate && { fieldProps: { disabled: true } }),
})

/** @type {Field} Description field */
export const DESCRIPTION = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim(),
  grid: { xs: 12, md: 6 },
}

/**
 * @param {boolean} isUpdate - is update.
 * @returns {Field[]} Fields
 */
export const FIELDS = (isUpdate) => [NAME(isUpdate), DESCRIPTION]

/**
 * @param {boolean} isUpdate - is update.
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (isUpdate) =>
  object(getValidationFromFields(FIELDS(isUpdate)))
