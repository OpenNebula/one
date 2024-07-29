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
import { Field, arrayToOptions, getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES, SEVERITIES } from 'client/constants'

/** @type {Field} name field */
export const SUBJECT = {
  name: 'SUBJECT',
  label: T.Subject,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Description field */
export const BODY = {
  name: 'BODY',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim().required(),
  grid: { xs: 12, md: 12 },
}

/** @type {Field} Description field */
export const SEVERITY = {
  name: 'SEVERITY',
  label: T.Severity,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.entries(SEVERITIES), {
    addEmpty: false,
    getText: ([_, value]) => value,
    getValue: ([key]) => key,
  }),
  validation: string().trim().default('severity_4').required(),
  grid: { xs: 12, md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [SUBJECT, BODY, SEVERITY]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
