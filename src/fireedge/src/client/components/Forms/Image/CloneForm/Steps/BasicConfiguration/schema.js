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
import { Field, getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

const PREFIX = {
  name: 'prefix',
  label: T.Prefix,
  tooltip: T.PrefixMultipleConcept,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => T.CopyOf),
}

const NAME = {
  name: 'name',
  label: T.Name,
  tooltip: T.NewTemplateNameConcept,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
}

/**
 * @param {object} [stepProps] - Step props
 * @param {boolean} [stepProps.isMultiple]
 * - If true, the prefix will be added to the name of the new template
 * @returns {Field[]} Fields
 */
export const FIELDS = ({ isMultiple } = {}) => [isMultiple ? PREFIX : NAME]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (stepProps) =>
  object(getValidationFromFields(FIELDS(stepProps)))
