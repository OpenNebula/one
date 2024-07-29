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
import { object, string } from 'yup'
import { getValidationFromFields, arrayToOptions } from 'client/utils'
import { INPUT_TYPES, T } from 'client/constants'
import { SECTION_ID as ADVANCED_SECTION_ID } from 'client/components/Forms/ServiceTemplate/CreateForm/Steps/RoleConfig/AdvancedParameters'

const SHUTDOWN_TYPES = {
  none: '',
  terminate: 'Terminate',
  terminateHard: 'Terminate hard',
}

const SHUTDOWN_ENUMS_ONEFLOW = {
  [SHUTDOWN_TYPES.terminate]: 'shutdown',
  [SHUTDOWN_TYPES.terminateHard]: 'shutdown-hard',
}

const RDP_FIELD = {
  name: 'rdp',
  label: T.Rdp,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

const SHUTDOWN_TYPE = {
  name: `${ADVANCED_SECTION_ID}.SHUTDOWNTYPE`,
  label: T.VMShutdownAction,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.keys(SHUTDOWN_TYPES), {
    addEmpty: false,
    getText: (key) => SHUTDOWN_TYPES[key],
    getValue: (key) => SHUTDOWN_ENUMS_ONEFLOW[key],
  }),
  validation: string()
    .trim()
    .notRequired()
    .oneOf(Object.values(SHUTDOWN_TYPES))
    .default(() => Object.values(SHUTDOWN_TYPES)[0]),
  grid: { xs: 12, sm: 12, md: 12 },
}

export const ADVANCED_PARAMS_FIELDS = [SHUTDOWN_TYPE]

export const ADVANCED_PARAMS_SCHEMA = object(
  getValidationFromFields([...ADVANCED_PARAMS_FIELDS, RDP_FIELD])
)
