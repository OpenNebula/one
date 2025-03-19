/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { string } from 'yup'
import { getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'
import { INPUT_TYPES, T } from '@ConstantsModule'

const SHUTDOWN_TYPES = {
  terminate: 'Terminate',
  'terminate-hard': 'Terminate hard',
}

const SHUTDOWN_TYPE = {
  name: 'shutdown',
  label: T.VMShutdownAction,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(SHUTDOWN_TYPES), {
    addEmpty: false,
    getText: (key) => SHUTDOWN_TYPES[key],
    getValue: (key) => key,
  }),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
    .afterSubmit((value) => (value === '' ? undefined : value)),
  grid: { md: 12 },
}

export const ADVANCED_PARAMS_FIELDS = [SHUTDOWN_TYPE]

export const ADVANCED_PARAMS_SCHEMA = getObjectSchemaFromFields(
  ADVANCED_PARAMS_FIELDS
)
