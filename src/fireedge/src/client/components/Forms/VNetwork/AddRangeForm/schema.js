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
import { BaseSchema, string, number } from 'yup'

import {
  Field,
  getObjectSchemaFromFields,
  OPTION_SORTERS,
  arrayToOptions,
  REG_V4,
  REG_V6,
  REG_MAC,
  disableFields,
} from 'client/utils'
import { T, INPUT_TYPES, RESTRICTED_ATTRIBUTES_TYPE } from 'client/constants'

const AR_TYPES = {
  IP4: 'IP4',
  IP4_6: 'IP4_6',
  IP6: 'IP6',
  IP6_STATIC: 'IP6_STATIC',
  ETHER: 'ETHER',
}

const AR_TYPES_STR = {
  [AR_TYPES.IP4]: 'IPv4',
  [AR_TYPES.IP6]: 'IPv6',
  [AR_TYPES.IP6_STATIC]: 'IPv6 (no-SLAAC)',
  [AR_TYPES.IP4_6]: 'IPv4/6',
  [AR_TYPES.ETHER]: 'Ethernet',
}

/** @type {Field} Type field */
const TYPE_FIELD = {
  name: 'TYPE',
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions(Object.keys(AR_TYPES), {
      addEmpty: false,
      getText: (type) => AR_TYPES_STR[type],
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => 'IP4'),
  notNull: true,
  grid: { xs: 12, md: 12 },
}

/** @type {Field} IP field */
const IP_FIELD = {
  name: 'IP',
  label: T.FirstIPv4Address,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE_FIELD.name,
  htmlType: (arType) =>
    [AR_TYPES.IP6, AR_TYPES.IP6_STATIC, AR_TYPES.ETHER].includes(arType) &&
    INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(TYPE_FIELD.name, {
      is: (arType) =>
        [AR_TYPES.IP6, AR_TYPES.IP6_STATIC, AR_TYPES.ETHER].includes(arType),
      then: (schema) => schema.strip().notRequired(),
      otherwise: (schema) =>
        schema.required().matches(REG_V4, { message: T.InvalidIPv4 }),
    }),
}

/** @type {Field} IPv6 field */
const IP6_FIELD = {
  name: 'IP6',
  label: T.FirstIPv6Address,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE_FIELD.name,
  htmlType: (arType) =>
    ![AR_TYPES.IP6_STATIC, AR_TYPES.IP4_6].includes(arType) &&
    INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(TYPE_FIELD.name, {
      is: (arType) => ![AR_TYPES.IP6_STATIC, AR_TYPES.IP4_6].includes(arType),
      then: (schema) => schema.strip(),
      otherwise: (schema) =>
        schema.required().matches(REG_V6, { message: T.InvalidIPv6 }),
    }),
}

/** @type {Field} Prefix length field */
const PREFIX_LENGTH_FIELD = {
  name: 'PREFIX_LENGTH',
  label: T.PrefixLength,
  tooltip: T.PrefixLengthConcept,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE_FIELD.name,
  htmlType: (arType) => AR_TYPES.IP6_STATIC !== arType && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(TYPE_FIELD.name, {
      is: (arType) => AR_TYPES.IP6_STATIC !== arType,
      then: (schema) => schema.strip(),
      otherwise: (schema) => schema.required(),
    }),
}

/** @type {Field} MAC field */
const MAC_FIELD = {
  name: 'MAC',
  label: T.FirstMacAddress,
  tooltip: T.MacConcept,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .transform((_, value) => (value === '' ? undefined : value))
    .matches(REG_MAC, { message: T.InvalidMAC })
    .default(() => undefined),
}

/** @type {Field} Size field */
const SIZE_FIELD = {
  name: 'SIZE',
  label: T.Size,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: number()
    .integer()
    .required()
    .positive()
    .default(() => 1),
}

/** @type {Field} IPv6 Global prefix field */
const GLOBAL_PREFIX_FIELD = {
  name: 'GLOBAL_PREFIX',
  label: T.IPv6GlobalPrefix,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE_FIELD.name,
  htmlType: (arType) =>
    [AR_TYPES.IP4, AR_TYPES.ETHER].includes(arType) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
    .when(TYPE_FIELD.name, {
      is: (arType) => [AR_TYPES.IP4, AR_TYPES.ETHER].includes(arType),
      then: (schema) => schema.strip(),
    }),
}

/** @type {Field} IPv6 ULA prefix field */
const ULA_PREFIX_FIELD = {
  name: 'ULA_PREFIX',
  label: T.IPv6ULAPrefix,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE_FIELD.name,
  htmlType: (arType) =>
    [AR_TYPES.IP4, AR_TYPES.ETHER].includes(arType) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
    .when(TYPE_FIELD.name, {
      is: (arType) => [AR_TYPES.IP4, AR_TYPES.ETHER].includes(arType),
      then: (schema) => schema.strip(),
    }),
}

/** @type {Field[]} Fields */
const FIELDS = (oneConfig, adminGroup) =>
  disableFields(
    [
      TYPE_FIELD,
      IP_FIELD,
      MAC_FIELD,
      IP6_FIELD,
      SIZE_FIELD,
      GLOBAL_PREFIX_FIELD,
      PREFIX_LENGTH_FIELD,
      ULA_PREFIX_FIELD,
    ],
    'AR',
    oneConfig,
    adminGroup,
    RESTRICTED_ATTRIBUTES_TYPE.VNET
  )

/**
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {Array} - Mutable fields
 */
const MUTABLE_FIELDS = (oneConfig, adminGroup) =>
  disableFields(
    [SIZE_FIELD],
    'AR',
    oneConfig,
    adminGroup,
    RESTRICTED_ATTRIBUTES_TYPE.VNET
  )

/**
 * @param {object} stepProps - Step props
 * @param {boolean} stepProps.isUpdate - If true the form is to update the AR
 * @param {object} stepProps.oneConfig - Open Nebula configuration
 * @param {boolean} stepProps.adminGroup - If the user belongs to oneadmin group
 * @returns {BaseSchema} Schema
 */
const SCHEMA = ({ isUpdate, oneConfig, adminGroup }) =>
  getObjectSchemaFromFields([
    ...(isUpdate
      ? MUTABLE_FIELDS(oneConfig, adminGroup)
      : FIELDS(oneConfig, adminGroup)),
  ])

export { FIELDS, MUTABLE_FIELDS, SCHEMA }
