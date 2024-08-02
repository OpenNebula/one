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
  MEMORY_RESIZE_FIELDS,
} from './capacitySchema'
import { FIELDS as VM_GROUP_FIELDS } from './vmGroupSchema'
import { FIELDS as OWNERSHIP_FIELDS } from './ownershipSchema'

import {
  Section,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import { T, HYPERVISORS, VmTemplateFeatures } from 'client/constants'

/**
 * @param {HYPERVISORS} [hypervisor] - Template hypervisor
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @param {VmTemplateFeatures} [features] - Features
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @param {boolean} isVrouter - VRouter template
 * @returns {Section[]} Fields
 */
const SECTIONS = (
  hypervisor,
  isUpdate,
  features,
  oneConfig,
  adminGroup,
  isVrouter
) =>
  [
    {
      id: 'hypervisor',
      legend: T.Hypervisor,
      required: true,
      fields: disableFields(
        [HYPERVISOR_FIELD(isUpdate), VROUTER_FIELD],
        '',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'information',
      legend: T.Information,
      required: true,
      fields: disableFields(
        INFORMATION_FIELDS(isUpdate),
        '',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'capacity',
      legend: T.Memory,
      fields: disableFields(
        filterFieldsByHypervisor(
          [...MEMORY_FIELDS, ...MEMORY_RESIZE_FIELDS],
          hypervisor
        ),
        '',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'ownership',
      legend: T.Ownership,
      fields: disableFields(
        filterFieldsByHypervisor(
          [...OWNERSHIP_FIELDS, ...VM_GROUP_FIELDS],
          hypervisor
        ),
        '',
        oneConfig,
        adminGroup
      ),
    },
    !features?.hide_cpu && {
      id: 'capacity',
      legend: T.PhysicalCpu,
      fields: disableFields(
        filterFieldsByHypervisor(CPU_FIELDS, hypervisor),
        '',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'showback',
      legend: T.Cost,
      fields: disableFields(
        filterFieldsByHypervisor(SHOWBACK_FIELDS(features), hypervisor),
        '',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'capacity',
      legend: T.VirtualCpu,
      fields: disableFields(
        filterFieldsByHypervisor(VCPU_FIELDS, hypervisor),
        '',
        oneConfig,
        adminGroup
      ),
    },
  ].filter(Boolean)

/**
 * @param {HYPERVISORS} [hypervisor] - Template hypervisor
 * @param {boolean} [isUpdate] - If `true`, the form is being updated
 * @param {VmTemplateFeatures} [features] - Features
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @param {boolean} isVrouter - VRouter template
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (
  hypervisor,
  isUpdate,
  features,
  oneConfig,
  adminGroup,
  isVrouter
) =>
  getObjectSchemaFromFields(
    SECTIONS(hypervisor, isUpdate, features, oneConfig, adminGroup, isVrouter)
      .map(({ fields }) => fields)
      .flat()
  )

export { SECTIONS, SCHEMA }
