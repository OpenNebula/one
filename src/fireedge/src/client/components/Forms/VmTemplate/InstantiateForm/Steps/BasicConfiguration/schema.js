/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { BaseSchema } from 'yup'

import { FIELDS as INFORMATION_FIELDS } from './informationSchema'
import { FIELDS as CAPACITY_FIELDS } from './capacitySchema'
// import { FIELDS as DISK_FIELDS, SCHEMA as DISK_SCHEMA } from './diskSchema'
import { FIELDS as VM_GROUP_FIELDS } from './vmGroupSchema'
import { FIELDS as OWNERSHIP_FIELDS } from './ownershipSchema'
import { FIELDS as VCENTER_FIELDS } from './vcenterSchema'

import { filterFieldsByHypervisor, getObjectSchemaFromFields, Field } from 'client/utils'
import { T, HYPERVISORS } from 'client/constants'

/**
 * @param {HYPERVISORS} [hypervisor] - Template hypervisor
 * @returns {function(string):{ id: string, legend: string, fields: Field[] }[]} Fields
 */
const FIELDS = hypervisor => [
  {
    id: 'information',
    legend: T.Information,
    fields: filterFieldsByHypervisor(INFORMATION_FIELDS, hypervisor)
  },
  {
    id: 'capacity',
    legend: T.Capacity,
    fields: filterFieldsByHypervisor(CAPACITY_FIELDS, hypervisor)
  },
  {
    id: 'ownership',
    legend: T.Ownership,
    fields: filterFieldsByHypervisor(OWNERSHIP_FIELDS, hypervisor)
  },
  {
    id: 'vm_group',
    legend: T.VMGroup,
    fields: filterFieldsByHypervisor(VM_GROUP_FIELDS, hypervisor)
  },
  {
    id: 'vcenter',
    legend: T.vCenterDeployment,
    fields: filterFieldsByHypervisor(VCENTER_FIELDS, hypervisor)
  }
]

/**
 * @param {HYPERVISORS} [hypervisor] - Template hypervisor
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = hypervisor => getObjectSchemaFromFields(
  FIELDS(hypervisor).map(({ fields }) => fields).flat()
)

export { FIELDS, SCHEMA }
