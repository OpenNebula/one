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

import { boolean, string, array, object } from 'yup'
import { T, INPUT_TYPES, VLAN_GROUP_RULE_SCOPE_STRING } from '@ConstantsModule'
import { Field, arrayToOptions, getValidationFromFields } from '@UtilsModule'

const VLAN_TAGGED_ID_RANGE_REGEXP = /^\d+(?:-\d+)?$/

const parseVlanTaggedIds = (value) => {
  if (typeof value !== 'string') return [value]

  const ids = value.split(',').map((id) => id.trim().replace(/\s*-\s*/g, '-'))

  return ids.every((id) => VLAN_TAGGED_ID_RANGE_REGEXP.test(id)) ? ids : [value]
}

const normalizeVlanTaggedIds = (value, originalValue) => {
  const values = typeof originalValue === 'string' ? [originalValue] : value

  return Array.isArray(values) ? values.flatMap(parseVlanTaggedIds) : value
}

/** @type {Field} VLAN ID field */
const ID_FIELD = {
  name: 'ID',
  label: T.VlanId,
  tooltip: [T.VLANTaggedConcept],
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  validation: array(string().trim())
    .transform(normalizeVlanTaggedIds)
    .default(() => undefined)
    .required(),
  grid: { md: 12 },
  fieldProps: {
    freeSolo: true,
    autoSelect: true,
    parseFreeSoloValue: parseVlanTaggedIds,
  },
}

/** @type {Field} Scope field */
const SCOPE_FIELD = {
  name: 'SCOPE',
  label: T.Scope,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  values: arrayToOptions(Object.values(VLAN_GROUP_RULE_SCOPE_STRING), {
    addEmpty: false,
    getText: (scope) => {
      switch (scope) {
        case VLAN_GROUP_RULE_SCOPE_STRING.VLAN_ID:
          return T.VLAN_ID
        case VLAN_GROUP_RULE_SCOPE_STRING.OUTER_VLAN_ID:
          return T.OUTER_VLAN_ID
        case VLAN_GROUP_RULE_SCOPE_STRING.CVLAN:
          return T.CVLAN
        case VLAN_GROUP_RULE_SCOPE_STRING.VLAN_TAGGED_ID:
          return T.VLAN_TAGGED_ID
        case VLAN_GROUP_RULE_SCOPE_STRING.ANY:
          return T.ANY
        default:
          return scope.toUpperCase()
      }
    },
    getValue: (scope) => scope,
  }),
  validation: string()
    .trim()
    .default(() => VLAN_GROUP_RULE_SCOPE_STRING.ANY)
    .afterSubmit((value) => value.toUpperCase())
    .required(),
  grid: { md: 12 },
}

const ALL_VNETS_FIELD = {
  name: 'ALL_VNETS',
  label: T.AllVnets,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => true),
  grid: { md: 12 },
}

/**
 * @returns {Field[]} Fields
 */
export const FIELDS = [ID_FIELD, SCOPE_FIELD, ALL_VNETS_FIELD]

/**
 * @param {object} [stepProps] - Step props
 * @returns {object} Schema
 */
export const SCHEMA = object(getValidationFromFields(FIELDS))
