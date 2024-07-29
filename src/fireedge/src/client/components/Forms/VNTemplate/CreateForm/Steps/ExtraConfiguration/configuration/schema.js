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

import { boolean, lazy, object, string } from 'yup'

import {
  INPUT_TYPES,
  RESTRICTED_ATTRIBUTES_TYPE,
  T,
  VN_DRIVERS,
  VN_DRIVERS_STR,
} from 'client/constants'
import {
  Field,
  OPTION_SORTERS,
  arrayToOptions,
  disableFields,
  getObjectSchemaFromFields,
} from 'client/utils'

const {
  fw,
  dot1Q,
  vxlan,
  ovswitch,
  ovswitch_vxlan: openVSwitchVXLAN,
} = VN_DRIVERS

const drivers = Object.keys(VN_DRIVERS_STR)

/** @type {Field} Driver field */
const DRIVER_FIELD = {
  name: 'VN_MAD',
  type: INPUT_TYPES.TOGGLE,
  values: () =>
    arrayToOptions(drivers, {
      addEmpty: false,
      getText: (key) => VN_DRIVERS_STR[key],
      sorter: OPTION_SORTERS.unsort,
    }),
  validation: string()
    .trim()
    .required()
    .default(() => drivers[0]),
  grid: { md: 12 },
  notNull: true,
}

/** @type {Field} Bridge switch linux field */
const BRIDGE_SWITCH = {
  name: 'bridgeSwitch',
  label: T.BridgeSwitch,
  tooltip: T.BridgeSwitchConcept,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

/** @type {Field} Bridge linux field */
const BRIDGE_FIELD = {
  name: 'BRIDGE',
  label: T.Bridge,
  tooltip: T.BridgeConcept,
  dependOf: BRIDGE_SWITCH.name,
  htmlType: (bridgeSwitch) => !bridgeSwitch && INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
    .when(BRIDGE_SWITCH.name, {
      is: (bridgeSwitch) => bridgeSwitch,
      then: (schema) => schema.required(),
    }),
  grid: { md: 6 },
}

/** @type {Field} Bridge switch linux field */
const PHYDEV_SWITCH = {
  name: 'phyDevSwitch',
  label: T.PhysicalDeviceSwitch,
  tooltip: T.PhysicalDeviceSwitchConcept,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) =>
    [dot1Q, vxlan, openVSwitchVXLAN].includes(driver) && INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

/** @type {Field} Physical device field */
const PHYDEV_FIELD = {
  name: 'PHYDEV',
  label: T.PhysicalDevice,
  tooltip: T.PhysicalDeviceConcept,
  dependOf: [PHYDEV_SWITCH.name, DRIVER_FIELD.name],
  htmlType: ([phyDevSwitch, driver] = []) =>
    phyDevSwitch &&
    ![dot1Q, vxlan, openVSwitchVXLAN].includes(driver) &&
    INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, PHYDEV_SWITCH.name], {
      is: (driver, phyDevSwitch) =>
        [dot1Q, vxlan, openVSwitchVXLAN].includes(driver) || !phyDevSwitch,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { md: 6 },
}

/** @type {Field} Filter MAC spoofing field */
const FILTER_MAC_SPOOFING_FIELD = {
  name: 'FILTER_MAC_SPOOFING',
  label: T.MacSpoofingFilter,
  type: INPUT_TYPES.SWITCH,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) => {
    const allowedDrivers = [fw, dot1Q, vxlan, ovswitch, openVSwitchVXLAN]

    return !allowedDrivers.includes(driver) && INPUT_TYPES.HIDDEN
  },
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} Filter IP spoofing field */
const FILTER_IP_SPOOFING_FIELD = {
  name: 'FILTER_IP_SPOOFING',
  label: T.IpSpoofingFilter,
  type: INPUT_TYPES.SWITCH,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) => {
    const allowedDrivers = [fw, dot1Q, vxlan, ovswitch, openVSwitchVXLAN]

    return !allowedDrivers.includes(driver) && INPUT_TYPES.HIDDEN
  },
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} MTU field */
const MTU_FIELD = {
  name: 'MTU',
  label: T.MTU,
  tooltip: T.MTUConcept,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) => {
    const allowedDrivers = [dot1Q, vxlan, ovswitch, openVSwitchVXLAN]

    return !allowedDrivers.includes(driver) && INPUT_TYPES.HIDDEN
  },
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
}

/** @type {Field} Automatic VLAN field */
const AUTOMATIC_VLAN_FIELD = {
  name: 'AUTOMATIC_VLAN_ID',
  label: T.AutomaticVlanId,
  type: INPUT_TYPES.SWITCH,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) => {
    const allowedDrivers = [dot1Q, vxlan, ovswitch, openVSwitchVXLAN]

    return !allowedDrivers.includes(driver) && INPUT_TYPES.HIDDEN
  },
  validation: lazy((_, { context }) =>
    boolean()
      .yesOrNo()
      .default(() => context?.AUTOMATIC_VLAN_ID === '1')
  ),
  grid: (self) => (self ? { md: 12 } : { sm: 6 }),
}

/** @type {Field} VLAN ID field */
const VLAN_ID_FIELD = {
  name: 'VLAN_ID',
  label: T.VlanId,
  type: INPUT_TYPES.TEXT,
  dependOf: [DRIVER_FIELD.name, AUTOMATIC_VLAN_FIELD.name],
  htmlType: ([driver, automatic] = []) => {
    const allowedDrivers = [dot1Q, vxlan, ovswitch, openVSwitchVXLAN]
    if (automatic) {
      return INPUT_TYPES.HIDDEN
    } else if (!allowedDrivers.includes(driver)) {
      return INPUT_TYPES.HIDDEN
    }
  },
  validation: string()
    .trim()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, AUTOMATIC_VLAN_FIELD.name], {
      is: (driver, automatic) =>
        [dot1Q, vxlan, ovswitch, openVSwitchVXLAN].includes(driver) &&
        !automatic,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { sm: 6 },
}

/** @type {Field} Automatic Outer VLAN field */
const AUTOMATIC_OUTER_VLAN_ID_FIELD = {
  name: 'AUTOMATIC_OUTER_VLAN_ID',
  label: T.AutomaticOuterVlanId,
  type: INPUT_TYPES.SWITCH,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) => {
    const allowedDrivers = [openVSwitchVXLAN]

    return !allowedDrivers.includes(driver) && INPUT_TYPES.HIDDEN
  },
  validation: lazy((_, { context }) =>
    boolean()
      .yesOrNo()
      .default(() => context?.AUTOMATIC_OUTER_VLAN_ID === '1')
  ),
  grid: (self) => (self ? { md: 12 } : { sm: 6 }),
}

/** @type {Field} Outer VLAN ID field */
const OUTER_VLAN_ID_FIELD = {
  name: 'OUTER_VLAN_ID',
  label: T.OuterVlanId,
  type: INPUT_TYPES.TEXT,
  dependOf: [DRIVER_FIELD.name, AUTOMATIC_OUTER_VLAN_ID_FIELD.name],
  htmlType: ([driver, oAutomatic] = []) => {
    const allowedDrivers = [openVSwitchVXLAN]
    if (oAutomatic) {
      return INPUT_TYPES.HIDDEN
    } else if (!allowedDrivers.includes(driver)) {
      return INPUT_TYPES.HIDDEN
    }
  },
  validation: string()
    .trim()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, AUTOMATIC_OUTER_VLAN_ID_FIELD.name], {
      is: (driver, oAutomatic) =>
        [openVSwitchVXLAN].includes(driver) && !oAutomatic,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.notRequired(),
    }),
  grid: { sm: 6 },
}

const IP_LINK_CONF_FIELD = {
  name: 'IP_LINK_CONF',
  validation: object().afterSubmit((conf, { parent }) => {
    if (vxlan !== parent[DRIVER_FIELD.name]) return

    // => string result: IP_LINK_CONF="option1=value1,option2=,..."
    return Object.entries(conf || {})
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
  }),
}

/**
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {Array} Fields
 */
const FIELDS = (oneConfig, adminGroup) =>
  disableFields(
    [
      DRIVER_FIELD,

      PHYDEV_SWITCH,
      PHYDEV_FIELD,
      BRIDGE_SWITCH,
      BRIDGE_FIELD,

      FILTER_MAC_SPOOFING_FIELD,
      FILTER_IP_SPOOFING_FIELD,
      AUTOMATIC_VLAN_FIELD,
      VLAN_ID_FIELD,
      AUTOMATIC_OUTER_VLAN_ID_FIELD,
      OUTER_VLAN_ID_FIELD,
      MTU_FIELD,
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
const SCHEMA = (oneConfig, adminGroup) =>
  getObjectSchemaFromFields(FIELDS(oneConfig, adminGroup))

export { FIELDS, IP_LINK_CONF_FIELD, SCHEMA }
