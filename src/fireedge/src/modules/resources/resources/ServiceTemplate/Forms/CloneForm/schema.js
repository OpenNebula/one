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
import { string, boolean, object, ObjectSchema } from 'yup'
import { Field, getValidationFromFields } from '@UtilsModule'
import { T, INPUT_TYPES } from '@ConstantsModule'

const NAME = {
  name: 'name',
  label: T.Name,
  tooltip: T.NewTemplateNameConcept,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .required()
    .default(() => undefined),
  grid: { md: 12 },
}

const RECURSIVE = {
  name: 'recursive',
  label: T.CloneRecursive,
  tooltip: T.CloneRecursiveConcept,
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

/**
 * @param {object} [stepProps] - Step props
 * @returns {Field[]} Fields
 */
export const FIELDS = [NAME, RECURSIVE]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = (stepProps) => object(getValidationFromFields(FIELDS))
