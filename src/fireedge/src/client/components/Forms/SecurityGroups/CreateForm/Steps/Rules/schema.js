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
import { string, object, ObjectSchema, mixed } from 'yup'
import {
  Field,
  arrayToOptions,
  getValidationFromFields,
  upperCaseFirst,
} from 'client/utils'
import { VNetworksTable } from 'client/components/Tables'
import {
  T,
  RULE_TYPE_STRING,
  INPUT_TYPES,
  PROTOCOL_STRING,
  ICMP_STRING,
  ICMP_V6_STRING,
} from 'client/constants'

/** @type {Field} Rule type field */
export const RULE_TYPE = {
  name: 'RULE_TYPE',
  label: T.Traffic,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Object.values(RULE_TYPE_STRING), {
    addEmpty: false,
    getText: (ruleType) => {
      switch (ruleType) {
        case RULE_TYPE_STRING.OUTBOUND:
          return T.Outbound
        case RULE_TYPE_STRING.INBOUND:
          return T.Inbound
        default:
          return upperCaseFirst(ruleType.toLowerCase())
      }
    },
    getValue: (ruleType) => ruleType,
  }),
  validation: string()
    .trim()
    .default(() => RULE_TYPE_STRING.OUTBOUND)
    .afterSubmit((value) => value.toLowerCase()),
  grid: { md: 12 },
}

/** @type {Field} Protocol field */
export const PROTOCOL = {
  name: 'PROTOCOL',
  label: T.Protocol,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(Object.values(PROTOCOL_STRING), {
    addEmpty: false,
    getText: (protocol) => {
      switch (protocol) {
        case PROTOCOL_STRING.TCP:
          return T.TCP
        case PROTOCOL_STRING.UDP:
          return T.UDP
        case PROTOCOL_STRING.ICMP:
          return T.ICMP
        case PROTOCOL_STRING.ICMPV6:
          return T.ICMPV6
        case PROTOCOL_STRING.IPSEC:
          return T.IPSEC
        case PROTOCOL_STRING.ALL:
          return T.All
        default:
          return upperCaseFirst(protocol.toLowerCase())
      }
    },
    getValue: (protocol) => protocol,
  }),
  validation: string()
    .trim()
    .default(() => PROTOCOL_STRING.TCP),
  grid: { md: 12 },
}

/** @type {Field} ICMP_TYPE field */
export const ICMP_TYPE = {
  name: 'ICMP_TYPE',
  dependOf: PROTOCOL.name,
  label: T.ICMP,
  type: INPUT_TYPES.SELECT,
  htmlType: (protocol) =>
    protocol !== PROTOCOL_STRING.ICMP && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(Object.entries(ICMP_STRING), {
    addEmpty: false,
    getText: ([_, value]) => value,
    getValue: ([key]) => key,
  }),
  validation: mixed().when(PROTOCOL.name, {
    is: (protocol) => protocol === PROTOCOL_STRING.ICMP,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  grid: { md: 12 },
}

/** @type {Field} ICMPv6 field */
export const ICMPV6_TYPE = {
  name: 'ICMPv6_TYPE',
  dependOf: PROTOCOL.name,
  label: T.ICMPV6,
  type: INPUT_TYPES.SELECT,
  htmlType: (protocol) =>
    protocol !== PROTOCOL_STRING.ICMPV6 && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(Object.entries(ICMP_V6_STRING), {
    addEmpty: false,
    getText: ([_, value]) => value,
    getValue: ([key]) => key,
  }),
  validation: mixed().when(PROTOCOL.name, {
    is: (protocol) => protocol === PROTOCOL_STRING.ICMPV6,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  grid: { md: 12 },
}

/** @type {Field} RANGE, TYPE field */
export const RANGE_TYPE = {
  name: 'RANGE_TYPE',
  label: T.PortRange,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions([T.All, T.PortRange], {
    addEmpty: false,
  }),
  validation: string()
    .trim()
    .afterSubmit((value) => undefined),
  grid: { xs: 12 },
}

/** @type {Field} Range field */
export const RANGE = {
  name: 'RANGE',
  dependOf: RANGE_TYPE.name,
  label: T.PortRange,
  type: INPUT_TYPES.TEXT,
  htmlType: (range) => range !== T.PortRange && INPUT_TYPES.HIDDEN,
  validation: mixed().when(RANGE_TYPE.name, {
    is: (protocol) => protocol === T.PortRange,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  grid: { md: 12 },
}

/** @type {Field} Target field */
export const TARGET = {
  name: 'TARGET',
  label: T.TargetNetwork,
  type: INPUT_TYPES.SELECT,
  values: arrayToOptions(
    [T.AnyNetwork, T.ManualNetwork, T.OpennebulaVirtualNetwork],
    {
      addEmpty: false,
    }
  ),
  validation: string()
    .trim()
    .afterSubmit((value) => undefined),
  grid: { xs: 12 },
}

/** @type {Field} IP field */
export const IP = {
  name: 'IP',
  dependOf: TARGET.name,
  label: T.FirstIPIPv6Address,
  type: INPUT_TYPES.TEXT,
  htmlType: (range) => range !== T.ManualNetwork && INPUT_TYPES.HIDDEN,
  validation: mixed().when(TARGET.name, {
    is: (protocol) => protocol === T.ManualNetwork,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  grid: { md: 12 },
}

/** @type {Field} SIZE field */
export const SIZE = {
  name: 'SIZE',
  dependOf: TARGET.name,
  label: T.Size,
  type: INPUT_TYPES.TEXT,
  htmlType: (range) => range !== T.ManualNetwork && INPUT_TYPES.HIDDEN,
  validation: mixed().when(TARGET.name, {
    is: (protocol) => protocol === T.ManualNetwork,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  grid: { md: 12 },
}

/** @type {Field} Networks field */
const NETWORK_ID = {
  name: 'NETWORK_ID',
  label: T.SelectNewNetwork,
  type: INPUT_TYPES.TABLE,
  dependOf: TARGET.name,
  htmlType: (range) =>
    range !== T.OpennebulaVirtualNetwork && INPUT_TYPES.HIDDEN,
  Table: () => VNetworksTable,
  validation: mixed().when(RANGE.name, {
    is: (protocol) => protocol === T.OpennebulaVirtualNetwork,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  grid: { md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [
  RULE_TYPE,
  PROTOCOL,
  ICMP_TYPE,
  ICMPV6_TYPE,
  RANGE_TYPE,
  RANGE,
  TARGET,
  IP,
  SIZE,
  NETWORK_ID,
]

/**
 * @param {object} [stepProps] - Step props
 * @returns {ObjectSchema} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
