/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { array, number, object, string } from 'yup'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { getObjectSchemaFromFields, isIPv4 } from '@UtilsModule'

export const MIRROR_TYPES = ['RSPAN', 'GRE', 'ERSPAN']
export const MIRROR_DIRECTIONS = ['BOTH', 'IN', 'OUT']

const optionalNumber = (min, max) =>
  number()
    .transform((value, original) =>
      original === '' || original == null ? undefined : value
    )
    .integer()
    .min(min)
    .max(max)
    .notRequired()
    .default(undefined)

const remoteIP = string()
  .trim()
  .test('ipv4', T.InvalidIPv4, (value) => !value || isIPv4(value))

const localIP = string()
  .trim()
  .test(
    'local-ip',
    T.MirrorInvalidLocalIP,
    (value) =>
      !value || isIPv4(value) || /^interface:[A-Za-z0-9_.:-]{1,15}$/.test(value)
  )

/**
 * @param {object} schema - Field schema
 * @returns {object} Required field
 */
const requiredField = (schema) => schema.required()

/**
 * @param {object} schema - Field schema
 * @returns {object} Excluded field
 */
const stripField = (schema) => schema.strip()

/**
 * @param {string} type - Mirror type
 * @returns {boolean} Whether the destination is a tunnel
 */
const isTunnel = (type) => ['GRE', 'ERSPAN'].includes(type)

/**
 * @param {string} type - Mirror type
 * @param {string} subtype - ERSPAN subtype
 * @returns {boolean} Whether ERSPAN II is selected
 */
const isERSPANII = (type, subtype) => type === 'ERSPAN' && subtype === 'II'

/**
 * @param {string} type - Mirror type
 * @param {string} subtype - ERSPAN subtype
 * @returns {boolean} Whether ERSPAN III is selected
 */
const isERSPANIII = (type, subtype) => type === 'ERSPAN' && subtype === 'III'

const NAME_FIELD = {
  name: 'NAME',
  label: T.Name,
  type: INPUT_TYPES.TEXT,
  validation: string().trim().required().default(''),
  fieldProps: { isRequired: true, isOptional: false },
}

const TYPE_FIELD = {
  name: 'TYPE',
  label: T.Type,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: MIRROR_TYPES.map((value) => ({ text: value, value })),
  validation: string().nullable().oneOf(MIRROR_TYPES).required().default(null),
  fieldProps: { isRequired: true },
}

const DESCRIPTION_FIELD = {
  name: 'DESCRIPTION',
  label: T.Description,
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: string().trim().notRequired(),
  fieldProps: { isRequired: false, isOptional: true },
  grid: { md: 12 },
}

const OUTPUT_VLAN_FIELD = {
  name: 'OUTPUT_VLAN',
  label: T.MirrorOutputVLAN,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: optionalNumber(1, 4094).when('TYPE', {
    is: 'RSPAN',
    then: requiredField,
    otherwise: stripField,
  }),
  fieldProps: {
    isRequired: true,
    isOptional: false,
    hint: T.MirrorOutputVLANHint,
    inputProps: { min: 1, max: 4094, step: 1 },
  },
}

const REMOTE_IP_FIELD = {
  name: 'REMOTE_IP',
  label: T.MirrorRemoteIP,
  type: INPUT_TYPES.TEXT,
  validation: remoteIP.when('TYPE', {
    is: isTunnel,
    then: requiredField,
    otherwise: stripField,
  }),
  fieldProps: {
    isRequired: true,
    isOptional: false,
    hint: T.MirrorRemoteIPHint,
  },
}

const LOCAL_IP_FIELD = {
  name: 'LOCAL_IP',
  label: T.MirrorLocalIP,
  type: INPUT_TYPES.TEXT,
  validation: localIP.when('TYPE', {
    is: isTunnel,
    otherwise: stripField,
  }),
  fieldProps: {
    isRequired: false,
    isOptional: true,
    hint: T.MirrorLocalIPHint,
  },
}

const ERSPAN_TYPE_FIELD = {
  name: 'ERSPAN_TYPE',
  label: T.MirrorERSPANType,
  tooltip: T.MirrorERSPANTypeConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  readOnly: false,
  values: ['II', 'III'].map((value) => ({ text: value, value })),
  validation: string().when('TYPE', {
    is: 'ERSPAN',
    then: string().oneOf(['II', 'III']).required(),
    otherwise: stripField,
  }),
  fieldProps: { isRequired: true },
}

const ERSPAN_KEY_FIELD = {
  name: 'ERSPAN_KEY',
  label: T.MirrorERSPANKey,
  tooltip: T.MirrorERSPANKeyConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: optionalNumber(0, 1023).when('TYPE', {
    is: 'ERSPAN',
    then: requiredField,
    otherwise: stripField,
  }),
  fieldProps: {
    isRequired: true,
    isOptional: false,
    hint: T.MirrorERSPANKeyHint,
    inputProps: { min: 0, max: 1023, step: 1 },
  },
}

const ERSPAN_INDEX_FIELD = {
  name: 'ERSPAN_INDEX',
  label: T.MirrorERSPANIndex,
  tooltip: T.MirrorERSPANIndexConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: optionalNumber(0, 1048575).when(['TYPE', 'ERSPAN_TYPE'], {
    is: isERSPANII,
    otherwise: stripField,
  }),
  fieldProps: {
    isRequired: false,
    isOptional: true,
    inputProps: { min: 0, max: 1048575, step: 1 },
  },
}

const ERSPAN_HWID_FIELD = {
  name: 'ERSPAN_HWID',
  label: T.MirrorERSPANHWID,
  tooltip: T.MirrorERSPANHWIDConcept,
  type: INPUT_TYPES.TEXT,
  htmlType: 'number',
  validation: optionalNumber(0, 63).when(['TYPE', 'ERSPAN_TYPE'], {
    is: isERSPANIII,
    otherwise: stripField,
  }),
  fieldProps: {
    isRequired: false,
    isOptional: true,
    inputProps: { min: 0, max: 63, step: 1 },
  },
}

export const CONFIGURATION_FIELDS = [
  NAME_FIELD,
  TYPE_FIELD,
  DESCRIPTION_FIELD,
  OUTPUT_VLAN_FIELD,
  REMOTE_IP_FIELD,
  LOCAL_IP_FIELD,
  ERSPAN_TYPE_FIELD,
  ERSPAN_KEY_FIELD,
  ERSPAN_INDEX_FIELD,
  ERSPAN_HWID_FIELD,
]

export const CONFIGURATION_SCHEMA =
  getObjectSchemaFromFields(CONFIGURATION_FIELDS)

export const DIRECTION_FIELD = {
  name: 'DIRECTION',
  label: T.MirrorDirection,
  type: INPUT_TYPES.RADIO,
  variant: 'plain',
  values: [
    { text: T.MirrorDirectionBoth, value: 'BOTH' },
    { text: T.MirrorDirectionIn, value: 'IN' },
    { text: T.MirrorDirectionOut, value: 'OUT' },
  ],
  validation: string().oneOf(MIRROR_DIRECTIONS).default('BOTH'),
}

export const PORTS_FIELD = {
  name: 'PORTS',
  label: T.MirrorSourceInterfaces,
  validation: array()
    .of(
      object({
        VM_ID: string().matches(/^\d+$/).required(),
        NIC_ID: string().matches(/^\d+$/).required(),
      })
    )
    .test(
      'unique-ports',
      T.MirrorDuplicateSource,
      (ports = []) =>
        new Set(ports.map(({ VM_ID, NIC_ID }) => `${VM_ID}:${NIC_ID}`)).size ===
        ports.length
    )
    .default([]),
}

/**
 * @param {string} value - Entered VLAN IDs
 * @returns {string[]} VLAN tokens
 */
export const parseVLANs = (value) =>
  String(value)
    .split(/[\s,]+/)
    .filter(Boolean)

export const VLANS_FIELD = {
  name: 'VLANS',
  label: T.MirrorSourceVLANs,
  validation: array()
    .of(string())
    .test('integer-vlans', T.MirrorInvalidVLAN, (vlans = []) =>
      vlans.every((vlan) => /^\d+$/.test(vlan) && Number(vlan) <= 4094)
    )
    .test(
      'unique-vlans',
      T.MirrorDuplicateVLAN,
      (vlans = []) => new Set(vlans.map(Number)).size === vlans.length
    )
    .default([]),
  fieldProps: {
    hint: T.MirrorVLANHint,
    autoSelect: true,
    separators: ['Enter', ' ', ','],
    parseFreeSoloValue: parseVLANs,
  },
}

export const TRAFFIC_FIELDS = [DIRECTION_FIELD, PORTS_FIELD, VLANS_FIELD]

export const TRAFFIC_SCHEMA = getObjectSchemaFromFields(TRAFFIC_FIELDS)

/**
 * Returns the general configuration fields.
 *
 * @param {boolean} isUpdate - Editing existing settings
 * @returns {object[]} Form fields
 */
export const configurationFields = (isUpdate) => [
  NAME_FIELD,
  { ...TYPE_FIELD, readOnly: isUpdate },
  DESCRIPTION_FIELD,
]

/**
 * Returns destination fields for the active type and ERSPAN subtype.
 *
 * @param {string} type - Mirror type
 * @param {string} subtype - ERSPAN subtype
 * @returns {object[]} Destination fields
 */
export const destinationFields = (type, subtype) =>
  [
    type === 'RSPAN' && OUTPUT_VLAN_FIELD,
    isTunnel(type) && REMOTE_IP_FIELD,
    isTunnel(type) && LOCAL_IP_FIELD,
    type === 'ERSPAN' && ERSPAN_TYPE_FIELD,
    type === 'ERSPAN' && ERSPAN_KEY_FIELD,
    isERSPANII(type, subtype) && ERSPAN_INDEX_FIELD,
    isERSPANIII(type, subtype) && ERSPAN_HWID_FIELD,
  ].filter(Boolean)
