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
import { string, ObjectSchema } from 'yup'

import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'
import {
  Field,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
} from 'client/utils'

const { vcenter } = HYPERVISORS

/** @type {Field} Files field */
export const FILES_DS = {
  name: 'CONTEXT.FILES_DS',
  label: T.ContextFiles,
  tooltip: T.ContextFilesConcept,
  notOnHypervisors: [vcenter],
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired().ensure(),
  grid: { md: 12 },
}

/** @type {Field} Init scripts field */
export const INIT_SCRIPTS = {
  name: 'CONTEXT.INIT_SCRIPTS',
  label: T.InitScripts,
  tooltip: T.InitScriptsConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired().ensure(),
  grid: { md: 12 },
}

/** @type {Field[]} List of Context Files fields */
export const FILES_FIELDS = (hypervisor) =>
  filterFieldsByHypervisor([FILES_DS, INIT_SCRIPTS], hypervisor)

/** @type {ObjectSchema} Context Files schema */
export const FILES_SCHEMA = (hypervisor) =>
  getObjectSchemaFromFields(FILES_FIELDS(hypervisor))
