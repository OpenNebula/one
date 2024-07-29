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

import { FIELDS as CAPACITY_FIELDS } from './capacitySchema'
import { FIELDS as INFORMATION_FIELDS } from './informationSchema'
// import { FIELDS as DISK_FIELDS, SCHEMA as DISK_SCHEMA } from './diskSchema'

// get schemas from VmTemplate/CreateForm
import { FIELDS as OWNERSHIP_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/ownershipSchema'
import { FIELDS as VM_GROUP_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/vmGroupSchema'

import { T, VmTemplate, VmTemplateFeatures } from 'client/constants'
import {
  Field,
  Section,
  disableFields,
  filterFieldsByHypervisor,
  getObjectSchemaFromFields,
} from 'client/utils'

/**
 * @param {VmTemplate} [vmTemplate] - VM Template
 * @param {VmTemplateFeatures} [features] - Features
 * @param {object} oneConfig - Config of oned.conf
 * @param {boolean} adminGroup - User is admin or not
 * @returns {Section[]} Sections
 */
const SECTIONS = (vmTemplate, features, oneConfig, adminGroup) => {
  const hypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR

  return [
    {
      id: 'information',
      legend: T.Information,
      fields: disableFields(
        filterFieldsByHypervisor(INFORMATION_FIELDS, hypervisor),
        '',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'capacity',
      legend: T.Capacity,
      fields: disableFields(
        filterFieldsByHypervisor(
          CAPACITY_FIELDS(vmTemplate, features),
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
        filterFieldsByHypervisor(OWNERSHIP_FIELDS, hypervisor),
        '',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'vm_group',
      legend: T.VMGroup,
      fields: disableFields(
        filterFieldsByHypervisor(VM_GROUP_FIELDS, hypervisor),
        '',
        oneConfig,
        adminGroup
      ),
    },
  ]
}

/**
 * @param {VmTemplate} [vmTemplate] - VM Template
 * @param {boolean} [hideCpu] - If `true`, the CPU fields is hidden
 * @returns {Field[]} Basic configuration fields
 */
const FIELDS = (vmTemplate, hideCpu) =>
  SECTIONS(vmTemplate, hideCpu)
    .map(({ fields }) => fields)
    .flat()

/**
 * @param {VmTemplate} [vmTemplate] - VM Template
 * @param {boolean} [hideCpu] - If `true`, the CPU fields is hidden
 * @returns {BaseSchema} Step schema
 */
const SCHEMA = (vmTemplate, hideCpu) =>
  getObjectSchemaFromFields(FIELDS(vmTemplate, hideCpu))

export { FIELDS, SCHEMA, SECTIONS }
