/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { string, ObjectSchema } from 'yup'

import {
  Field,
  Section,
  filterFieldsByHypervisor,
  filterFieldsByDriver,
  getObjectSchemaFromFields,
  arrayToOptions,
  disableFields,
} from '@UtilsModule'
import {
  T,
  INPUT_TYPES,
  HYPERVISORS,
  VN_DRIVERS,
  IPV4_METHODS,
  IPV6_METHODS,
} from '@ConstantsModule'

const filterByHypAndDriver = (fields, { hypervisor, driver }) =>
  filterFieldsByDriver(filterFieldsByHypervisor(fields, hypervisor), driver)

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
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: arrayToOptions(Object.keys(IPV4_METHODS), {
      getText: (key) => key,
      getValue: (key) => IPV4_METHODS[key],
      addEmpty: true,
    }),
    validation: string().trim().notRequired().default(undefined),
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
    type: INPUT_TYPES.AUTOCOMPLETE,
    optionsOnly: true,
    values: arrayToOptions(Object.keys(IPV6_METHODS), {
      getText: (key) => key,
      getValue: (key) => IPV6_METHODS[key],
      addEmpty: true,
    }),
    validation: string().trim().notRequired().default(undefined),
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

  let sections = []

  sections = [
    {
      id: 'override-ipv4',
      legend: T.OverrideNetworkValuesIPv4,
      fields: disableFields(
        filterByHypAndDriver(OVERRIDE_IPV4_FIELDS, filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
    {
      id: 'override-ipv6',
      legend: T.OverrideNetworkValuesIPv6,
      fields: disableFields(
        filterByHypAndDriver(OVERRIDE_IPV6_FIELDS, filters),
        'NIC',
        oneConfig,
        adminGroup
      ),
    },
  ]

  return sections
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
