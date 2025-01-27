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

import { boolean, lazy, string, array } from 'yup'

import {
  INPUT_TYPES,
  RESTRICTED_ATTRIBUTES_TYPE,
  T,
  VN_DRIVERS,
  VN_DRIVERS_STR,
} from '@ConstantsModule'
import {
  Field,
  OPTION_SORTERS,
  arrayToOptions,
  disableFields,
  getObjectSchemaFromFields,
} from '@UtilsModule'

const {
  bridge,
  fw,
  dot1Q,
  vxlan,
  ovswitch,
  ovswitch_vxlan: openVSwitchVXLAN,
} = VN_DRIVERS

const drivers = Object.keys(VN_DRIVERS_STR)

/**
 *
 * Bridged: bridge
 * Bridged & Security Groups: fw
 * 802.1Q: dot1Q
 * VXLAN: vxlan
 * Open vSwitch: ovswitch
 * Open vSwitch - VXLAN: ovswitch_vxlan
 *
 *
 * Attributes                 bridge   fw   dot1Q   vxlan   ovswitch   ovswitch_vxlan   Will be send to the template
 * VN_MAD                        M      M     M       M         M            M                     M
 * bridgeSwitch                  O      M     O       O         O            O
 * BRIDGE                        O      O     O       O         O            O                     X
 * phyDevSwitch                  O      O                       O
 * PHYDEV                        O      O     M       M         O            M                     X
 * vlanTaggedSwitch              O      O                       O
 * VLAN_TAGGED_ID                O      O                       O                                  X
 * FILTER_MAC_SPOOFING                  O             O         O            O                     X
 * FILTER_IP_SPOOFING                   O             O         O            O                     X
 * MTU                                        O       O         O                                  X
 * AUTOMATIC_VLAN_ID                          M       M         M            O                     X
 * VLAN_ID                                    M       M         M            O                     X
 * QInQSwitch                                 O                 O
 * CVLANS                                     O                 O                                  X
 * QINQ_TYPE                                                    O                                  X
 * AUTOMATIC_OUTER_VLAN_ID                                                   M                     X
 * OUTER_VLAN_ID                                                             M                     X
 * VXLAN_MODE                                         O                                            X
 * VXLAN_TEP                                          O                                            X
 * VXLAN_MC                                           O                                            X
 * IP_LINK_CONF                                       O                                            X
 *
 */

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
  name: 'BRIDGE_SWITCH',
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
      otherwise: (schema) => schema.strip(),
    }),
  grid: { md: 6 },
}

/** @type {Field} Bridge switch linux field */
const PHYDEV_SWITCH = {
  name: 'PHYDEV_SWITCH',
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
    [bridge, fw, ovswitch].includes(driver) &&
    INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, PHYDEV_SWITCH.name], {
      is: (driver, phyDevSwitch) =>
        [dot1Q, vxlan, openVSwitchVXLAN].includes(driver) || !phyDevSwitch,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { md: 6 },
}

/** @type {Field} VLAN tagged switch linux field */
const VLAN_TAGGED_ID_SWITCH = {
  name: 'VLAN_TAGGED_ID_SWITCH',
  label: T.VLANTaggedSwitch,
  tooltip: T.VLANTaggedSwitchConcept,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) =>
    ![bridge, fw, ovswitch].includes(driver) && INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

/** @type {Field} VLAN tagged linux field */
const VLAN_TAGGED_ID = {
  name: 'VLAN_TAGGED_ID',
  label: T.VLANTagged,
  tooltip: [T.VLANTaggedConcept],
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  dependOf: [DRIVER_FIELD.name, VLAN_TAGGED_ID_SWITCH.name],
  htmlType: ([driver, vlanTaggedSwitch] = []) =>
    (!vlanTaggedSwitch || ![bridge, fw, ovswitch].includes(driver)) &&
    INPUT_TYPES.HIDDEN,
  validation: array(string().trim())
    .default(() => undefined)
    .when([DRIVER_FIELD.name, VLAN_TAGGED_ID_SWITCH.name], {
      is: (driver, vlanTaggedSwitch) =>
        [bridge, fw, ovswitch].includes(driver) && vlanTaggedSwitch,
      then: (schema) =>
        schema.required().afterSubmit((value, { context }) => value.join(',')),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { md: 12 },
  fieldProps: { freeSolo: true },
}

/** @type {Field} Filter MAC spoofing field */
const FILTER_MAC_SPOOFING_FIELD = {
  name: 'FILTER_MAC_SPOOFING',
  label: T.MacSpoofingFilter,
  type: INPUT_TYPES.SWITCH,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) =>
    ![fw, vxlan, ovswitch, openVSwitchVXLAN].includes(driver) &&
    INPUT_TYPES.HIDDEN,
  validation: boolean()
    .yesOrNo()
    .afterSubmit((value, { context }) =>
      [fw, vxlan, ovswitch, openVSwitchVXLAN].includes(context?.extra?.VN_MAD)
        ? value
          ? 'YES'
          : 'NO'
        : undefined
    ),
  grid: { md: 12 },
}

/** @type {Field} Filter IP spoofing field */
const FILTER_IP_SPOOFING_FIELD = {
  name: 'FILTER_IP_SPOOFING',
  label: T.IpSpoofingFilter,
  type: INPUT_TYPES.SWITCH,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) =>
    ![fw, vxlan, ovswitch, openVSwitchVXLAN].includes(driver) &&
    INPUT_TYPES.HIDDEN,
  validation: boolean()
    .yesOrNo()
    .afterSubmit((value, { context }) =>
      [fw, vxlan, ovswitch, openVSwitchVXLAN].includes(context?.extra?.VN_MAD)
        ? value
          ? 'YES'
          : 'NO'
        : undefined
    ),
  grid: { md: 12 },
}

/** @type {Field} MTU field */
const MTU_FIELD = {
  name: 'MTU',
  label: T.MTU,
  tooltip: T.MTUConcept,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) =>
    ![dot1Q, vxlan, ovswitch, openVSwitchVXLAN].includes(driver) &&
    INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .afterSubmit((value, { context }) =>
      [dot1Q, vxlan, ovswitch, openVSwitchVXLAN].includes(
        context?.extra?.VN_MAD
      )
        ? value
        : undefined
    ),
}

const AUTOMATIC_VLAN_FIELD = (isUpdate = false, isVnet = false) => ({
  name: 'AUTOMATIC_VLAN_ID',
  label: T.AutomaticVlanId,
  type: INPUT_TYPES.SWITCH,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) =>
    ![dot1Q, vxlan, ovswitch, openVSwitchVXLAN].includes(driver) &&
    INPUT_TYPES.HIDDEN,
  validation: lazy((_, { context }) =>
    boolean()
      .yesOrNo()
      .default(() => context?.VLAN_ID_AUTOMATIC === '1')
      .when(DRIVER_FIELD.name, {
        is: (driver) =>
          ![dot1Q, vxlan, ovswitch, openVSwitchVXLAN].includes(driver),
        then: (schema) => schema.strip(),
      })
  ),
  ...(isUpdate && isVnet && { fieldProps: { disabled: true } }),
  grid: { md: 12 },
})

/** @type {Field} VLAN ID field */
const VLAN_ID_FIELD = {
  name: 'VLAN_ID',
  label: T.VlanId,
  type: INPUT_TYPES.TEXT,
  dependOf: [DRIVER_FIELD.name, AUTOMATIC_VLAN_FIELD().name],
  htmlType: ([driver, automatic] = []) =>
    (automatic ||
      ![dot1Q, vxlan, ovswitch, openVSwitchVXLAN].includes(driver)) &&
    INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, AUTOMATIC_VLAN_FIELD().name], {
      is: (driver, automatic) =>
        [dot1Q, vxlan, ovswitch, openVSwitchVXLAN].includes(driver) &&
        (automatic === 'NO' || !automatic),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { sm: 6 },
}

/** @type {Field} Q-in-Q network switch linux field */
const Q_IN_Q_SWITCH = {
  name: 'Q_IN_Q_SWITCH',
  label: T.QinQ,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) =>
    ![dot1Q, ovswitch].includes(driver) && INPUT_TYPES.HIDDEN,
  type: INPUT_TYPES.SWITCH,
  validation: boolean().default(() => false),
  grid: { md: 12 },
}

/** @type {Field} CVLANS field */
const CVLANS = {
  name: 'CVLANS',
  label: T.CVLANS,
  tooltip: [T.CVLANSConcept],
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  dependOf: [DRIVER_FIELD.name, Q_IN_Q_SWITCH.name],
  htmlType: ([driver, QInQSwitch] = []) =>
    (!QInQSwitch || ![dot1Q, ovswitch].includes(driver)) && INPUT_TYPES.HIDDEN,
  validation: array(string().trim())
    .default(() => undefined)
    .when([DRIVER_FIELD.name, Q_IN_Q_SWITCH.name], {
      is: (driver, qinqSwitch) =>
        [dot1Q, ovswitch].includes(driver) && qinqSwitch,
      then: (schema) =>
        schema.required().afterSubmit((value, { context }) => value.join(',')),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { md: 12 },
  fieldProps: { freeSolo: true },
}

/** @type {Field} VXLAN tunnel endpoint field */
const QINQ_TYPE = {
  name: 'QINQ_TYPE',
  label: T.QinQType,
  tooltip: T.QinQTypeConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: [DRIVER_FIELD.name, Q_IN_Q_SWITCH.name],
  htmlType: ([driver, QInQSwitch] = []) =>
    (!QInQSwitch || ![ovswitch].includes(driver)) && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(['802.1ad', '802.1q']),
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, Q_IN_Q_SWITCH.name], {
      is: (driver, qinqSwitch) => [ovswitch].includes(driver) && qinqSwitch,
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
}

/** @type {Field} Automatic Outer VLAN field */
const AUTOMATIC_OUTER_VLAN_ID_FIELD = {
  name: 'AUTOMATIC_OUTER_VLAN_ID',
  label: T.AutomaticOuterVlanId,
  type: INPUT_TYPES.SWITCH,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) =>
    ![openVSwitchVXLAN].includes(driver) && INPUT_TYPES.HIDDEN,
  validation: lazy((_, { context }) =>
    boolean()
      .yesOrNo()
      .default(() => context?.AUTOMATIC_OUTER_VLAN_ID === '1')
      .when(DRIVER_FIELD.name, {
        is: (driver) => ![openVSwitchVXLAN].includes(driver),
        then: (schema) => schema.strip(),
      })
  ),
  grid: (self) => (self ? { md: 12 } : { sm: 6 }),
}

/** @type {Field} Outer VLAN ID field */
const OUTER_VLAN_ID_FIELD = {
  name: 'OUTER_VLAN_ID',
  label: T.OuterVlanId,
  type: INPUT_TYPES.TEXT,
  dependOf: [AUTOMATIC_OUTER_VLAN_ID_FIELD.name, DRIVER_FIELD.name],
  htmlType: ([automatic, driver] = []) =>
    (automatic || ![openVSwitchVXLAN].includes(driver)) && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, AUTOMATIC_OUTER_VLAN_ID_FIELD.name], {
      is: (driver, automatic) =>
        [openVSwitchVXLAN].includes(driver) &&
        (automatic === 'NO' || !automatic),
      then: (schema) => schema.required(),
      otherwise: (schema) => schema.strip(),
    }),
  grid: { sm: 6 },
}

/** @type {Field} VXLAN mode field */
const VXLAN_MODE_FIELD = {
  name: 'VXLAN_MODE',
  label: T.VxlanMode,
  tooltip: T.VxlanModeConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) => ![vxlan].includes(driver) && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(['evpn', 'multicast']),
  validation: string()
    .trim()
    .default(() => undefined)
    .when(DRIVER_FIELD.name, {
      is: (driver) => ![vxlan].includes(driver),
      then: (schema) => schema.strip(),
    }),
}

/** @type {Field} VXLAN tunnel endpoint field */
const VXLAN_TEP_FIELD = {
  name: 'VXLAN_TEP',
  label: T.VxlanTunnelEndpoint,
  tooltip: T.VxlanTunnelEndpointConcept,
  type: INPUT_TYPES.AUTOCOMPLETE,
  optionsOnly: true,
  dependOf: [DRIVER_FIELD.name, VXLAN_MODE_FIELD.name],
  htmlType: ([driver, mode] = []) =>
    (mode !== 'evpn' || ![vxlan].includes(driver)) && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(['dev', 'local_ip']),
  validation: string()
    .trim()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, VXLAN_MODE_FIELD.name], {
      is: (driver, mode) => ![vxlan].includes(driver) || mode !== 'evpn',
      then: (schema) => schema.strip(),
    }),
}

/** @type {Field} VXLAN multicast field */
const VXLAN_MC_FIELD = {
  name: 'VXLAN_MC',
  label: T.VxlanMulticast,
  tooltip: T.VxlanMulticastConcept,
  type: INPUT_TYPES.TEXT,
  dependOf: [DRIVER_FIELD.name, VXLAN_MODE_FIELD.name],
  htmlType: ([driver, mode] = []) =>
    (mode !== 'multicast' || ![vxlan].includes(driver)) && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(['dev', 'local_ip']),
  validation: string()
    .trim()
    .default(() => undefined)
    .when([DRIVER_FIELD.name, VXLAN_MODE_FIELD.name], {
      is: (driver, mode) => ![vxlan].includes(driver) || mode !== 'multicast',
      then: (schema) => schema.strip(),
    }),
}

const IP_LINK_CONF_FIELD = {
  name: 'IP_LINK_CONF',
  label: T.IPLinkConf,
  tooltip: [T.IPLinkConfConcept],
  type: INPUT_TYPES.AUTOCOMPLETE,
  multiple: true,
  dependOf: DRIVER_FIELD.name,
  htmlType: (driver) => ![vxlan].includes(driver) && INPUT_TYPES.HIDDEN,
  validation: array(string().trim())
    .default(() => undefined)
    .afterSubmit((value, { context }) =>
      [vxlan].includes(context?.extra?.VN_MAD) ? value?.join(',') : undefined
    ),
  grid: { md: 12 },
  fieldProps: { freeSolo: true },
}

/**
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @param {boolean} isUpdate - User is updating vnet/template
 * @param {boolean} isVnet - User is creating/updating vnet
 * @returns {Array} Fields
 */
const FIELDS = (oneConfig, adminGroup, isUpdate, isVnet) =>
  disableFields(
    [
      DRIVER_FIELD,

      PHYDEV_SWITCH,
      PHYDEV_FIELD,
      BRIDGE_SWITCH,
      BRIDGE_FIELD,
      VLAN_TAGGED_ID_SWITCH,
      VLAN_TAGGED_ID,

      FILTER_MAC_SPOOFING_FIELD,
      FILTER_IP_SPOOFING_FIELD,

      AUTOMATIC_VLAN_FIELD(isUpdate, isVnet),
      VLAN_ID_FIELD,
      AUTOMATIC_OUTER_VLAN_ID_FIELD,
      OUTER_VLAN_ID_FIELD,

      MTU_FIELD,
      VXLAN_MODE_FIELD,
      VXLAN_TEP_FIELD,
      VXLAN_MC_FIELD,

      Q_IN_Q_SWITCH,
      CVLANS,
      QINQ_TYPE,

      IP_LINK_CONF_FIELD,
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

export { FIELDS, SCHEMA }
