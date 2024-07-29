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

import { HYPERVISORS } from 'client/constants'
import { SCHEMA as OS_SCHEMA } from './booting/schema'
import { SCHEMA as IO_SCHEMA } from './inputOutput/schema'
import { SCHEMA as CONTEXT_SCHEMA } from './context/schema'
import { SCHEMA as BACKUP_SCHEMA } from './backup/schema'

/**
 * @param {object} [formProps] - Form props
 * @param {HYPERVISORS} [formProps.hypervisor] - VM hypervisor
 * @returns {ObjectSchema} Configuration schema
 */
export const SCHEMA = ({ hypervisor }) =>
  object()
    .concat(IO_SCHEMA({ hypervisor }))
    .concat(OS_SCHEMA({ hypervisor }))
    .concat(CONTEXT_SCHEMA({ hypervisor }))
    .concat(BACKUP_SCHEMA())

export { IO_SCHEMA, OS_SCHEMA, CONTEXT_SCHEMA, BACKUP_SCHEMA }
