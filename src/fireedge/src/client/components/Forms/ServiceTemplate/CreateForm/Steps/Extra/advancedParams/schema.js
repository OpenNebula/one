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
import { string, boolean } from 'yup'
import { INPUT_TYPES, T } from 'client/constants'
import { getObjectSchemaFromFields, arrayToOptions } from 'client/utils'

// Define the CA types
const STRATEGY_TYPES = {
  straight: 'Straight',
  none: 'None',
}

const VM_SHUTDOWN_TYPES = {
  terminate: 'Terminate',
  terminateHard: 'Terminate hard',
}

const STRATEGY_TYPE = {
  label: T.Strategy,
  name: 'ADVANCED.DEPLOYMENT',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(STRATEGY_TYPES), {
    addEmpty: false,
    getText: (key) => STRATEGY_TYPES[key],
    getValue: (key) => key,
  }),

  validation: string()
    .trim()
    .required()
    .oneOf(Object.keys(STRATEGY_TYPES))
    .default(() => Object.keys(STRATEGY_TYPES)[0]),
  grid: { sm: 2, md: 2 },
}

const VM_SHUTDOWN_TYPE = {
  label: T.VMShutdownAction,
  name: 'ADVANCED.VMSHUTDOWN',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.values(VM_SHUTDOWN_TYPES), { addEmpty: false }),
  validation: string()
    .trim()
    .required()
    .oneOf(Object.values(VM_SHUTDOWN_TYPES))
    .default(() => Object.values(VM_SHUTDOWN_TYPES)[0]),
  grid: { sm: 2, md: 2 },
}

const WAIT_VMS = {
  label: T.WaitVmsReport,
  name: 'ADVANCED.READY_STATUS_GATE',
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { sd: 4, md: 4 },
}

const AUTO_DELETE = {
  label: T.ServiceAutoDelete,
  name: 'ADVANCED.AUTOMATIC_DELETION',
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { sd: 4, md: 4 },
}

export const ADVANCED_PARAMS_FIELDS = [
  STRATEGY_TYPE,
  VM_SHUTDOWN_TYPE,
  WAIT_VMS,
  AUTO_DELETE,
]

export const ADVANCED_PARAMS_SCHEMA = getObjectSchemaFromFields(
  ADVANCED_PARAMS_FIELDS
)
