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
import { number, ObjectSchema } from 'yup'

import {
  Field,
  Section,
  filterFieldsByHypervisor,
  filterFieldsByDriver,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS, VN_DRIVERS } from 'client/constants'

const { ovswitch } = VN_DRIVERS

const filterByHypAndDriver = (fields, { hypervisor, driver }) =>
  filterFieldsByDriver(filterFieldsByHypervisor(fields, hypervisor), driver)

/** @type {Field[]} List of Inbound traffic QoS fields */
const OVERRIDE_IN_QOS_FIELDS = [
  {
    name: 'INBOUND_AVG_BW',
    label: T.AverageBandwidth,
    tooltip: T.InboundAverageBandwidthConcept,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'INBOUND_PEAK_BW',
    label: T.PeakBandwidth,
    tooltip: T.InboundPeakBandwidthConcept,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'INBOUND_PEAK_KB',
    label: T.PeakBurst,
    tooltip: T.PeakBurstConcept,
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
]

/** @type {Field[]} List of Outbound traffic QoS fields */
const OVERRIDE_OUT_QOS_FIELDS = [
  {
    name: 'OUTBOUND_AVG_BW',
    label: T.AverageBandwidth,
    tooltip: T.OutboundAverageBandwidthConcept,
    type: INPUT_TYPES.TEXT,
    notOnDrivers: [ovswitch],
    htmlType: 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'OUTBOUND_PEAK_BW',
    label: T.PeakBandwidth,
    tooltip: T.OutboundPeakBandwidthConcept,
    type: INPUT_TYPES.TEXT,
    notOnDrivers: [ovswitch],
    htmlType: 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'OUTBOUND_PEAK_KB',
    label: T.PeakBurst,
    tooltip: T.PeakBurstConcept,
    type: INPUT_TYPES.TEXT,
    notOnDrivers: [ovswitch],
    htmlType: 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
]

/**
 * @param {object} data - VM or VM Template data
 * @param {VN_DRIVERS} [data.driver] - Virtual network driver
 * @param {HYPERVISORS} [data.hypervisor] - VM Hypervisor
 * @param {object} data.oneConfig - Config of oned.conf
 * @param {boolean} data.adminGroup - User is admin or not
 * @returns {Section[]} Sections
 */
const SECTIONS = ({
  driver,
  hypervisor = HYPERVISORS.kvm,
  oneConfig,
  adminGroup,
} = {}) => {
  const filters = { driver, hypervisor }

  return [
    {
      id: 'override-in-qos',
      legend: T.OverrideNetworkInboundTrafficQos,
      fields: disableFields(
        filterByHypAndDriver(OVERRIDE_IN_QOS_FIELDS, filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'override-out-qos',
      legend: T.OverrideNetworkOutboundTrafficQos,
      fields: disableFields(
        filterByHypAndDriver(OVERRIDE_OUT_QOS_FIELDS, filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
  ]
}

/**
 * @param {object} data - VM or VM Template data
 * @returns {Field[]} Advanced options schema
 */
const FIELDS = (data) =>
  SECTIONS(data)
    .map(({ fields }) => fields)
    .flat()

/**
 * @param {object} data - VM or VM Template data
 * @returns {ObjectSchema} Advanced options schema
 */
const SCHEMA = (data) => getObjectSchemaFromFields(FIELDS(data))

export { SECTIONS, FIELDS, SCHEMA }
