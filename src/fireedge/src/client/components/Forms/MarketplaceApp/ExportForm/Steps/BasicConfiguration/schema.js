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
import { boolean, string, lazy, object, ObjectSchema } from 'yup'

import { Field, getValidationFromFields } from 'client/utils'
import { T, INPUT_TYPES } from 'client/constants'

/** @type {Field} Name field */
const NAME_FIELD = {
  name: 'name',
  label: T.Name,
  tooltip: T.ExportAppNameConcept,
  type: INPUT_TYPES.TEXT,
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .required()
      .default(() => context.app.NAME)
  ),
}

/** @type {Field} Template name field */
const TEMPLATE_NAME_FIELD = {
  name: 'vmname',
  label: T.VMTemplate,
  tooltip: T.ExportTemplateNameConcept,
  type: INPUT_TYPES.TEXT,
  validation: lazy((_, { context }) =>
    string()
      .trim()
      .required()
      .default(() => context.app.NAME)
  ),
}

/** @type {Field} Associate field */
const ASSOCIATED_FIELD = {
  name: 'associated',
  label: T.ExportAssociateApp,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

/** @type {Field[]} List of fields */
export const FIELDS = [NAME_FIELD, TEMPLATE_NAME_FIELD, ASSOCIATED_FIELD]

/** @type {ObjectSchema} Advanced options schema */
export const SCHEMA = object(getValidationFromFields(FIELDS))
