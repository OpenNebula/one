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
import { reach } from 'yup'
import { VN_DRIVERS, VN_DRIVERS_STR } from '@ConstantsModule'
import { CUSTOM_VN_MAD } from '@modules/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/constants'

const DEFAULT_GENERAL_ID = 'general'
const DEFAULT_CONFIGURATION_ID = 'extra'

export const ORIGINAL_ADDRESS_RANGE = '__ORIGINAL_ADDRESS_RANGE__'

export const MANAGED_FORM_ATTRIBUTES = [
  'AR',
  'CLUSTER',
  'CLUSTERS',
  'CLUSTER_IDS',
  'SECURITY_GROUPS',
  'VN_MAD',
  CUSTOM_VN_MAD,
  'PHYDEV',
  'PHYDEV_SWITCH',
  'BRIDGE',
  'BRIDGE_SWITCH',
  'VLAN_TAGGED_ID',
  'VLAN_TAGGED_ID_SWITCH',
  'ENABLE_DPDK',
  'BRIDGE_TYPE',
  'FILTER_MAC_SPOOFING',
  'FILTER_IP_SPOOFING',
  'MTU',
  'AUTOMATIC_VLAN_ID',
  'VLAN_ID',
  'Q_IN_Q_SWITCH',
  'CVLANS',
  'QINQ_TYPE',
  'AUTOMATIC_OUTER_VLAN_ID',
  'OUTER_VLAN_ID',
  'VXLAN_MODE',
  'VXLAN_TEP',
  'VXLAN_MC',
  'IP_LINK_CONF',
  'NETWORK_ADDRESS',
  'NETWORK_MASK',
  'GATEWAY',
  'GATEWAY6',
  'DNS',
  'GUEST_MTU',
  'METHOD',
  'IP6_METHOD',
  'ROUTES',
  'INBOUND_AVG_BW',
  'INBOUND_PEAK_BW',
  'INBOUND_PEAK_KB',
  'OUTBOUND_AVG_BW',
  'OUTBOUND_PEAK_BW',
  'OUTBOUND_PEAK_KB',
]

/**
 * Converts an actual custom driver name to the values used by the form.
 *
 * @param {string} vnMad - Virtual network driver
 * @returns {object} VN_MAD form values
 */
export const getVnMadFormValues = (vnMad) => {
  if (!vnMad) return {}

  if (!Object.prototype.hasOwnProperty.call(VN_DRIVERS_STR, vnMad)) {
    return { VN_MAD: VN_DRIVERS.custom, [CUSTOM_VN_MAD]: vnMad }
  }

  return {
    VN_MAD: vnMad,
    ...(vnMad === VN_DRIVERS.custom && { [CUSTOM_VN_MAD]: vnMad }),
  }
}

/**
 * Replaces the custom form option with the actual driver name.
 *
 * @param {object} attributes - Virtual network template attributes
 * @returns {object} Template attributes ready to send to OpenNebula
 */
export const resolveVnMad = (attributes = {}) => {
  const { [CUSTOM_VN_MAD]: customVnMad, ...template } = attributes

  return {
    ...template,
    VN_MAD:
      template.VN_MAD === VN_DRIVERS.custom ? customVnMad : template.VN_MAD,
  }
}

/**
 * @param {string} key - Attribute path
 * @returns {string} Root attribute name
 */
const getRootAttribute = (key) => `${key ?? ''}`.split('.')[0].split('[')[0]

/**
 * @param {string} key - Attribute path
 * @param {string[]} managedFields - Attribute names controlled by the form
 * @returns {boolean} True if the attribute is controlled by a graphical section
 */
export const isManagedAttribute = (
  key,
  managedFields = MANAGED_FORM_ATTRIBUTES
) => managedFields.includes(getRootAttribute(key))

/**
 * @param {string|string[]} value - Comma-separated or array attribute value
 * @returns {string[]} Normalized string list
 */
export const normalizeAttributeList = (value) =>
  [value ?? []]
    .flat()
    .flatMap((item) => `${item}`.split(','))
    .map((item) => item.trim())
    .filter(Boolean)

/**
 * @param {object} schema - Current form schema
 * @param {string} key - Schema path
 * @returns {boolean} True if the path exists in the schema
 */
export const existsOnSchema = (schema, key) => {
  try {
    return reach(schema, key) && true
  } catch (e) {
    return false
  }
}

/**
 * @param {object} fromAttributes - Attributes to check
 * @param {object} schema - Current form schema
 * @param {object} options - Step ids and fields to skip
 * @param {string} options.generalId - General step id
 * @param {string} options.configurationId - Configuration step id
 * @param {string[]} options.dynamicFields - Attributes to skip
 * @param {string[]} options.managedFields - Attributes controlled by graphical sections
 * @returns {object} List of unknown attributes
 */
export const getUnknownVars = (
  fromAttributes = {},
  schema,
  {
    generalId = DEFAULT_GENERAL_ID,
    configurationId = DEFAULT_CONFIGURATION_ID,
    dynamicFields = [],
    managedFields = MANAGED_FORM_ATTRIBUTES,
  } = {}
) => {
  const unknown = {}

  for (const [key, value] of Object.entries(fromAttributes)) {
    if (
      !!value &&
      !dynamicFields.includes(key) &&
      !isManagedAttribute(key, managedFields) &&
      !existsOnSchema(schema, `${generalId}.${key}`) &&
      !existsOnSchema(schema, `${configurationId}.${key}`)
    ) {
      unknown[key] = value
    }
  }

  return unknown
}
