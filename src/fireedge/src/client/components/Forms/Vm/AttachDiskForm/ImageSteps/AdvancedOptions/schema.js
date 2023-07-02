/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { number, ObjectSchema } from 'yup'

import {
  GENERAL_FIELDS,
  VCENTER_FIELDS,
  EDGE_CLUSTER_FIELDS,
  THROTTLING_BYTES_FIELDS,
  THROTTLING_IOPS_FIELDS,
} from 'client/components/Forms/Vm/AttachDiskForm/CommonFields'
import { T, INPUT_TYPES, HYPERVISORS } from 'client/constants'
import {
  Field,
  Section,
  getObjectSchemaFromFields,
  filterFieldsByHypervisor,
} from 'client/utils'

const { vcenter } = HYPERVISORS

/** @type {Field} Size field */
const SIZE = {
  name: 'SIZE',
  label: T.SizeOnInstantiate,
  tooltip: T.SizeOnInstantiateConcept,
  notOnHypervisors: [vcenter],
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .notRequired()
    .default(() => undefined),
}

/**
 * @param {HYPERVISORS} hypervisor - Hypervisor
 * @returns {Section[]} Sections
 */
const SECTIONS = (hypervisor) => [
  {
    id: 'general',
    legend: T.General,
    fields: filterFieldsByHypervisor([SIZE, ...GENERAL_FIELDS], hypervisor),
  },
  {
    id: 'vcenter',
    legend: 'vCenter',
    fields: filterFieldsByHypervisor(VCENTER_FIELDS, hypervisor),
  },
  {
    id: 'throttling-bytes',
    legend: T.ThrottlingBytes,
    fields: filterFieldsByHypervisor(THROTTLING_BYTES_FIELDS, hypervisor),
  },
  {
    id: 'throttling-iops',
    legend: T.ThrottlingIOPS,
    fields: filterFieldsByHypervisor(THROTTLING_IOPS_FIELDS, hypervisor),
  },
  {
    id: 'edge-cluster',
    legend: T.EdgeCluster,
    fields: filterFieldsByHypervisor(EDGE_CLUSTER_FIELDS, hypervisor),
  },
]

/**
 * @param {HYPERVISORS} hypervisor - Hypervisor
 * @returns {Field[]} Advanced options fields
 */
const FIELDS = (hypervisor) =>
  SECTIONS(hypervisor)
    .map(({ fields }) => fields)
    .flat()

/**
 * @param {HYPERVISORS} hypervisor - Hypervisor
 * @returns {ObjectSchema} Advanced options schema
 */
const SCHEMA = (hypervisor) => getObjectSchemaFromFields(FIELDS(hypervisor))

export { SECTIONS, FIELDS, SCHEMA }
