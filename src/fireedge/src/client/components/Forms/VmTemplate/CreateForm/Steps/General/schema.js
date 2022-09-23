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
import { BaseSchema } from 'yup'

import {
  FIELDS as INFORMATION_FIELDS,
  HYPERVISOR_FIELD,
  VROUTER_FIELD,
} from './informationSchema'
import {
  MEMORY_FIELDS,
  CPU_FIELDS,
  VCPU_FIELDS,
  SHOWBACK_FIELDS,
} from './capacitySchema'
import { FIELDS as VM_GROUP_FIELDS } from './vmGroupSchema'
import { FIELDS as OWNERSHIP_FIELDS } from './ownershipSchema'
import { FIELDS as VCENTER_FIELDS } from './vcenterSchema'

import {
  Section,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
} from 'client/utils'
import { T, HYPERVISORS, VmTemplateFeatures } from 'client/constants'

/**
 * @param {HYPERVISORS} [hypervisor] - Template hypervisor
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @param {VmTemplateFeatures} [features] - Features
 * @returns {Section[]} Fields
 */
const SECTIONS = (hypervisor, isUpdate, features) =>
  [
    {
      id: 'information',
      legend: T.Information,
      required: true,
      fields: INFORMATION_FIELDS(isUpdate),
    },
    {
      id: 'hypervisor',
      legend: T.Hypervisor,
      required: true,
      fields: [HYPERVISOR_FIELD, VROUTER_FIELD],
    },
    {
      id: 'capacity',
      legend: T.Memory,
      fields: filterFieldsByHypervisor(MEMORY_FIELDS, hypervisor),
    },
    !features?.hide_cpu && {
      id: 'capacity',
      legend: T.PhysicalCpu,
      fields: filterFieldsByHypervisor(CPU_FIELDS, hypervisor),
    },
    {
      id: 'capacity',
      legend: T.VirtualCpu,
      fields: filterFieldsByHypervisor(VCPU_FIELDS, hypervisor),
    },
    {
      id: 'showback',
      legend: T.Cost,
      fields: filterFieldsByHypervisor(SHOWBACK_FIELDS(features), hypervisor),
    },
    {
      id: 'ownership',
      legend: T.Ownership,
      fields: filterFieldsByHypervisor(OWNERSHIP_FIELDS, hypervisor),
    },
    {
      id: 'vm_group',
      legend: T.VMGroup,
      fields: filterFieldsByHypervisor(VM_GROUP_FIELDS, hypervisor),
    },
    {
      id: 'vcenter',
      legend: T.vCenterDeployment,
      fields: filterFieldsByHypervisor(VCENTER_FIELDS, hypervisor),
    },
  ].filter(Boolean)

/**
 * @param {HYPERVISORS} [hypervisor] - Template hypervisor
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @param {VmTemplateFeatures} [features] - Features
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (hypervisor, isUpdate, features) =>
  getObjectSchemaFromFields(
    SECTIONS(hypervisor, isUpdate, features)
      .map(({ fields }) => fields)
      .flat()
  )

export { SECTIONS, SCHEMA }
