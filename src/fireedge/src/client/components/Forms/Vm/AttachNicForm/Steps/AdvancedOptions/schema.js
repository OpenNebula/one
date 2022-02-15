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
import { boolean, number, string, ObjectSchema } from 'yup'

import {
  Field,
  Section,
  filterFieldsByHypervisor,
  filterFieldsByDriver,
  getObjectSchemaFromFields,
} from 'client/utils'
import { T, INPUT_TYPES, HYPERVISORS, VN_DRIVERS, Nic } from 'client/constants'

const { firecracker } = HYPERVISORS
const { ovswitch, vcenter } = VN_DRIVERS

const filterByHypAndDriver = (fields, { hypervisor, driver }) =>
  filterFieldsByDriver(filterFieldsByHypervisor(fields, hypervisor), driver)

/**
 * @param {object} [data] - VM or VM Template data
 * @param {Nic[]} [data.nics] - Current NICs
 * @returns {Field[]} List of general fields
 */
const GENERAL_FIELDS = ({ nics = [] } = {}) =>
  [
    {
      name: 'RDP',
      label: T.RdpConnection,
      type: INPUT_TYPES.SWITCH,
      validation: boolean().yesOrNo(),
      grid: { sm: 6 },
    },
    {
      name: 'SSH',
      label: T.SshConnection,
      type: INPUT_TYPES.SWITCH,
      validation: boolean().yesOrNo(),
      grid: { sm: 6 },
    },
    !!nics?.length && {
      name: 'PARENT',
      label: T.AsAnAlias,
      dependOf: 'NAME',
      type: (name) => {
        const hasAlias = nics?.some((nic) => nic.PARENT === name)

        return name && hasAlias ? INPUT_TYPES.HIDDEN : INPUT_TYPES.SELECT
      },
      values: (name) => [
        { text: '', value: '' },
        ...nics
          .filter(({ PARENT }) => !PARENT) // filter nic alias
          .filter(({ NAME }) => NAME !== name || !name) // filter it self
          .map((nic) => {
            const { NAME, IP = '', NETWORK = '', NIC_ID = '' } = nic
            const text = [NAME ?? NIC_ID, NETWORK, IP]
              .filter(Boolean)
              .join(' - ')

            return { text, value: NAME }
          }),
      ],
      validation: string()
        .trim()
        .notRequired()
        .default(() => undefined),
      grid: { sm: 6 },
    },
    {
      name: 'EXTERNAL',
      label: T.External,
      tooltip: T.ExternalConcept,
      type: INPUT_TYPES.SWITCH,
      dependOf: 'PARENT',
      htmlType: (parent) => !parent?.length && INPUT_TYPES.HIDDEN,
      validation: boolean().yesOrNo(),
      grid: { sm: 6 },
    },
  ].filter(Boolean)

/** @type {Field[]} List of IPv4 fields */
const OVERRIDE_IPV4_FIELDS = [
  {
    name: 'IP',
    label: T.IP,
    tooltip: T.IPv4Concept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'MAC',
    label: T.MAC,
    tooltip: T.MACConcept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'NETWORK_MASK',
    label: T.NetworkMask,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
    fieldProps: { placeholder: '255.255.255.0' },
  },
  {
    name: 'NETWORK_ADDRESS',
    label: T.NetworkAddress,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
    fieldProps: { placeholder: '192.168.1.0' },
  },
  {
    name: 'GATEWAY',
    label: T.Gateway,
    tooltip: T.GatewayConcept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'SEARCH_DOMAIN',
    label: T.SearchDomainForDNSResolution,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'METHOD',
    label: T.NetworkMethod,
    tooltip: T.NetworkMethod4Concept,
    type: INPUT_TYPES.SELECT,
    values: [
      { text: 'static (Based on context)', value: 'static' },
      { text: 'dhcp (DHCPv4)', value: 'dhcp' },
      { text: 'skip (Do not configure IPv4)', value: 'skip' },
    ],
    validation: string().trim().notRequired().default('static'),
  },
]

/** @type {Field[]} List of IPv6 fields */
const OVERRIDE_IPV6_FIELDS = [
  {
    name: 'IP6',
    label: T.IP,
    tooltip: T.IPv6Concept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'GATEWAY6',
    label: T.Gateway,
    tooltip: T.Gateway6Concept,
    type: INPUT_TYPES.TEXT,
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'IP6_METHOD',
    label: T.NetworkMethod,
    tooltip: T.NetworkMethod6Concept,
    type: INPUT_TYPES.SELECT,
    values: [
      { text: 'static (Based on context)', value: 'static' },
      { text: 'auto (SLAAC)', value: 'auto' },
      { text: 'dhcp (SLAAC and DHCPv6)', value: 'dhcp' },
      { text: 'disable (Do not use IPv6)', value: 'disable' },
      { text: 'skip (Do not configure IPv4)', value: 'skip' },
    ],
    validation: string().trim().notRequired().default('static'),
  },
]

/** @type {Field[]} List of Inbound traffic QoS fields */
const OVERRIDE_IN_QOS_FIELDS = [
  {
    name: 'INBOUND_AVG_BW',
    label: T.AverageBandwidth,
    tooltip: T.InboundAverageBandwidthConcept,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [firecracker],
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
    notOnHypervisors: [firecracker],
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
    notOnHypervisors: [firecracker],
    notOnDrivers: [vcenter],
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
    notOnHypervisors: [firecracker],
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
    notOnHypervisors: [firecracker],
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
    notOnHypervisors: [firecracker],
    notOnDrivers: [ovswitch, vcenter],
    htmlType: 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
]

/** @type {Field[]} List of hardware fields */
const HARDWARE_FIELDS = [
  {
    name: 'MODEL',
    label: T.HardwareModelToEmulate,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [firecracker],
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
  {
    name: 'VIRTIO_QUEUES',
    label: T.TransmissionQueue,
    tooltip: T.OnlySupportedForVirtioDriver,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [firecracker],
    htmlType: 'number',
    validation: number()
      .notRequired()
      .default(() => undefined),
  },
]

/** @type {Field[]} List of guest option fields */
const GUEST_FIELDS = [
  {
    name: 'GUEST_MTU',
    label: T.GuestMTU,
    tooltip: T.GuestMTUConcept,
    type: INPUT_TYPES.TEXT,
    notOnHypervisors: [firecracker],
    validation: string()
      .trim()
      .notRequired()
      .default(() => undefined),
  },
]

/**
 * @param {object} data - VM or VM Template data
 * @param {Nic[]} [data.nics] - Current nics on resource
 * @param {VN_DRIVERS} [data.driver] - Virtual network driver
 * @param {HYPERVISORS} [data.hypervisor] - VM Hypervisor
 * @returns {Section[]} Sections
 */
const SECTIONS = ({ nics, driver, hypervisor = HYPERVISORS.kvm } = {}) => {
  const filters = { driver, hypervisor }

  return [
    {
      id: 'general',
      legend: T.General,
      fields: filterByHypAndDriver(GENERAL_FIELDS({ nics }), filters),
    },
    {
      id: 'override-ipv4',
      legend: T.OverrideNetworkValuesIPv4,
      fields: filterByHypAndDriver(OVERRIDE_IPV4_FIELDS, filters),
    },
    {
      id: 'override-ipv6',
      legend: T.OverrideNetworkValuesIPv6,
      fields: filterByHypAndDriver(OVERRIDE_IPV6_FIELDS, filters),
    },
    {
      id: 'override-in-qos',
      legend: T.OverrideNetworkInboundTrafficQos,
      fields: filterByHypAndDriver(OVERRIDE_IN_QOS_FIELDS, filters),
    },
    {
      id: 'override-out-qos',
      legend: T.OverrideNetworkOutboundTrafficQos,
      fields: filterByHypAndDriver(OVERRIDE_OUT_QOS_FIELDS, filters),
    },
    {
      id: 'hardware',
      legend: T.Hardware,
      fields: filterByHypAndDriver(HARDWARE_FIELDS, filters),
    },
    {
      id: 'guest',
      legend: T.GuestOptions,
      fields: filterByHypAndDriver(GUEST_FIELDS, filters),
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
