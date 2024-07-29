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
import { array, object, ObjectSchema } from 'yup'

import { HYPERVISORS } from 'client/constants'
import { getObjectSchemaFromFields } from 'client/utils'
import { FIELDS as PLACEMENT_FIELDS } from './placement/schema'
import { FIELDS as BACKUP_FIELDS } from './backup/schema'
import { FIELDS as OS_FIELDS, BOOT_ORDER_FIELD } from './booting/schema'
import {
  SCHEMA as NUMA_SCHEMA,
  FIELDS as NUMA_FIELDS,
  VCPU_SCHEMA,
} from './numa/schema'
import { SCHEMA as IO_SCHEMA } from './inputOutput/schema'
import { SCHEMA as CONTEXT_SCHEMA } from './context/schema'
import { SCHEMA as STORAGE_SCHEMA } from './storage/schema'
import { SCHEMA as NETWORK_SCHEMA } from './networking/schema'
import { SCHEMA as PCI_SCHEMA } from './pci/schema'

/**
 * Map name attribute if not exists.
 *
 * @param {string} prefixName - Prefix to add in name
 * @returns {object[]} Resource object
 */
const mapNameByIndex = (prefixName) => (resource, idx) => ({
  ...resource,
  NAME:
    resource?.NAME?.startsWith(prefixName) || !resource?.NAME
      ? `${prefixName}${idx}`
      : resource?.NAME,
})

const SCHED_ACTION_SCHEMA = object({
  SCHED_ACTION: array()
    .ensure()
    .transform((actions) => actions.map(mapNameByIndex('SCHED_ACTION'))),
})

/**
 * @param {HYPERVISORS} hypervisor - VM hypervisor
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @param {boolean} isUpdate - The form is being updated
 * @param {object} modifiedFields - Map with the fields modified by the user
 * @returns {ObjectSchema} Extra configuration schema
 */
export const SCHEMA = (
  hypervisor,
  oneConfig,
  adminGroup,
  isUpdate,
  modifiedFields
) =>
  object()
    .concat(SCHED_ACTION_SCHEMA)
    .concat(NETWORK_SCHEMA)
    .concat(STORAGE_SCHEMA)
    .concat(CONTEXT_SCHEMA(hypervisor, isUpdate))
    .concat(IO_SCHEMA(hypervisor, oneConfig, adminGroup, isUpdate))
    .concat(
      getObjectSchemaFromFields([
        ...PLACEMENT_FIELDS({ isUpdate, modifiedFields }),
        ...OS_FIELDS(hypervisor),
      ])
    )
    .concat(getObjectSchemaFromFields([...BACKUP_FIELDS]))
    .concat(VCPU_SCHEMA)
    .concat(PCI_SCHEMA)
    .concat(NUMA_SCHEMA(hypervisor))

export {
  mapNameByIndex,
  SCHED_ACTION_SCHEMA,
  STORAGE_SCHEMA,
  NETWORK_SCHEMA,
  IO_SCHEMA,
  CONTEXT_SCHEMA,
  PLACEMENT_FIELDS,
  OS_FIELDS,
  BOOT_ORDER_FIELD,
  NUMA_FIELDS,
}
