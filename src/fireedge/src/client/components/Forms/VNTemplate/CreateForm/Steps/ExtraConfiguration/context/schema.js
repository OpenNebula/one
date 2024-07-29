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
import { string } from 'yup'

import {
  Field,
  arrayToOptions,
  getObjectSchemaFromFields,
  disableFields,
} from 'client/utils'
import {
  T,
  INPUT_TYPES,
  VNET_METHODS,
  VNET_METHODS6,
  RESTRICTED_ATTRIBUTES_TYPE,
} from 'client/constants'

/** @type {Field} Network address field */
const NETWORK_ADDRESS_FIELD = {
  name: 'NETWORK_ADDRESS',
  label: T.NetworkAddress,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Field} Network mask field */
const NETWORK_MASK_FIELD = {
  name: 'NETWORK_MASK',
  label: T.NetworkMask,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Field} Gateway field */
const GATEWAY_FIELD = {
  name: 'GATEWAY',
  label: T.Gateway,
  tooltip: T.GatewayConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Field} Gateway for IPv6 field */
const GATEWAY6_FIELD = {
  name: 'GATEWAY6',
  label: T.Gateway6,
  tooltip: T.Gateway6Concept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Field} DNS field */
const DNS_FIELD = {
  name: 'DNS',
  label: T.DNS,
  tooltip: T.DNSConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Field} Guest MTU field */
const GUEST_MTU_FIELD = {
  name: 'GUEST_MTU',
  label: T.GuestMTU,
  tooltip: T.GuestMTUConcept,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().notRequired(),
}

/** @type {Field} Method field */
const METHOD_FIELD = {
  name: 'METHOD',
  label: T.NetMethod,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.entries(VNET_METHODS), {
    addEmpty: 'none (Use default)',
    getText: ([, text]) => text,
    getValue: ([value]) => value,
  }),
  validation: string().trim().notRequired(),
}

/** @type {Field} Method for IPv6 field */
const IP6_METHOD_FIELD = {
  name: 'IP6_METHOD',
  label: T.NetMethod6,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.entries(VNET_METHODS6), {
    addEmpty: 'none (Use default)',
    getText: ([, text]) => text,
    getValue: ([value]) => value,
  }),
  validation: string().trim().notRequired(),
}

/**
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {Array} Fields
 */
export const FIELDS = (oneConfig, adminGroup) =>
  disableFields(
    [
      NETWORK_ADDRESS_FIELD,
      NETWORK_MASK_FIELD,
      GATEWAY_FIELD,
      GATEWAY6_FIELD,
      DNS_FIELD,
      GUEST_MTU_FIELD,
      METHOD_FIELD,
      IP6_METHOD_FIELD,
    ],
    '',
    oneConfig,
    adminGroup,
    RESTRICTED_ATTRIBUTES_TYPE.VNET
  )

/**
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {object} Schema
 */
export const SCHEMA = (oneConfig, adminGroup) =>
  getObjectSchemaFromFields(FIELDS(oneConfig, adminGroup))
