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
import { object, ObjectSchema } from 'yup'

import { USER_INPUTS_SCHEMA } from './userInputsSchema'
import { CONFIGURATION_SCHEMA } from './configurationSchema'
import { FILES_SCHEMA } from './filesSchema'

/**
 * @param {string} [hypervisor] - VM hypervisor
 * @param {boolean} isUpdate - If it's an update of the form
 * @returns {ObjectSchema} Context schema
 */
export const SCHEMA = (hypervisor, isUpdate) =>
  object()
    .concat(CONFIGURATION_SCHEMA(isUpdate))
    .concat(USER_INPUTS_SCHEMA)
    .concat(FILES_SCHEMA(hypervisor))

export * from './userInputsSchema'
export * from './configurationSchema'
export * from './filesSchema'
