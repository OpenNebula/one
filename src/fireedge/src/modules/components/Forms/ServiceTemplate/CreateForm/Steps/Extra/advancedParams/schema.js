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
import { string, boolean } from 'yup'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { getObjectSchemaFromFields, arrayToOptions } from '@UtilsModule'

// Define the CA types
const STRATEGY_TYPES = {
  straight: 'Straight',
  none: 'None',
}

const VM_SHUTDOWN_TYPES = {
  terminate: 'Terminate',
  'terminate-hard': 'Terminate hard',
  shutdown: 'Shutdown',
  'shutdown-hard': 'Shutdown hard',
}

const STRATEGY_TYPE = {
  label: T.Strategy,
  name: 'deployment',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  tooltip: T.StraightStrategyConcept,
  values: arrayToOptions(Object.keys(STRATEGY_TYPES), {
    addEmpty: false,
    getText: (key) => STRATEGY_TYPES[key],
    getValue: (key) => key,
  }),

  validation: string()
    .trim()
    .notRequired()
    .oneOf(Object.keys(STRATEGY_TYPES))
    .default(() => undefined),
  grid: { md: 12 },
}

const VM_SHUTDOWN_TYPE = {
  label: T.VMShutdownAction,
  name: 'shutdown_action',
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(VM_SHUTDOWN_TYPES), {
    addEmpty: false,
    getText: (key) => VM_SHUTDOWN_TYPES[key],
    getValue: (key) => key,
  }),
  validation: string()
    .trim()
    .notRequired()
    .oneOf(Object.keys(VM_SHUTDOWN_TYPES))
    .default(() => undefined),
  grid: { md: 12 },
}

const WAIT_VMS = {
  label: T.WaitVmsReport,
  name: 'ready_status_gate',
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

const AUTO_DELETE = {
  label: T.ServiceAutoDelete,
  name: 'automatic_deletion',
  type: INPUT_TYPES.CHECKBOX,
  validation: boolean().default(() => false),
  grid: { md: 12 },
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
