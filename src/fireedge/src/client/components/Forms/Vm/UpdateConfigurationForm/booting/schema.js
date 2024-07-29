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
import { ObjectSchema } from 'yup'

import * as bootingSchema from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/schema'

import {
  Field,
  Section,
  getObjectSchemaFromFields,
  filterFieldsByHypervisor,
  disableFields,
} from 'client/utils'
import { T, HYPERVISORS, ATTR_CONF_CAN_BE_UPDATED } from 'client/constants'

const getFields = (section) =>
  section.map((attr) => bootingSchema[attr]).filter(Boolean)

// Supported fields
const OS_FIELDS = getFields(ATTR_CONF_CAN_BE_UPDATED.OS)
const FEATURES_FIELDS = getFields(ATTR_CONF_CAN_BE_UPDATED.FEATURES)
const RAW_FIELDS = getFields(ATTR_CONF_CAN_BE_UPDATED.RAW)

/**
 * @param {object} [formProps] - Form props
 * @param {HYPERVISORS} [formProps.hypervisor] - VM hypervisor
 * @param {object} formProps.oneConfig - Config of oned.conf
 * @param {boolean} formProps.adminGroup - User is admin or not
 * @returns {Section[]} Sections
 */
const SECTIONS = ({ hypervisor, oneConfig, adminGroup }) => [
  {
    id: 'os-boot',
    legend: T.Boot,
    fields: disableFields(
      filterFieldsByHypervisor(OS_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'os-features',
    legend: T.Features,
    fields: disableFields(
      filterFieldsByHypervisor(FEATURES_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
  {
    id: 'os-raw',
    legend: T.RawData,
    legendTooltip: T.RawDataConcept,
    fields: disableFields(
      filterFieldsByHypervisor(RAW_FIELDS, hypervisor),
      'OS',
      oneConfig,
      adminGroup
    ),
  },
]

/**
 * @param {object} [formProps] - Form props
 * @param {HYPERVISORS} [formProps.hypervisor] - VM hypervisor
 * @returns {Field[]} OS fields
 */
const FIELDS = ({ hypervisor }) => [
  ...SECTIONS({ hypervisor })
    .map(({ fields }) => fields)
    .flat(),
]

/**
 * @param {object} [formProps] - Form props
 * @param {HYPERVISORS} [formProps.hypervisor] - VM hypervisor
 * @returns {ObjectSchema} Step schema
 */
const SCHEMA = ({ hypervisor }) =>
  getObjectSchemaFromFields(FIELDS({ hypervisor }))

export { SECTIONS, FIELDS, SCHEMA }
