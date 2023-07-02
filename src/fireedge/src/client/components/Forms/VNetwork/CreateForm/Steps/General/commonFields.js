/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { lazy, string, boolean, object } from 'yup'

import { DRIVER_FIELD } from 'client/components/Forms/VNetwork/CreateForm/Steps/General/informationSchema'
import { Field, arrayToOptions } from 'client/utils'
import { T, INPUT_TYPES, VN_DRIVERS } from 'client/constants'

const {
  fw,
  dot1Q,
  vxlan,
  ovswitch,
  ovswitch_vxlan: openVSwitchVXLAN,
} = VN_DRIVERS

/** @type {Field} Bridge linux field */
const BRIDGE_FIELD = {
  name: 'BRIDGE',
  label: T.Bridge,
  tooltip: T.BridgeConcept,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .notRequired()
    .default(() => undefined),
}

/** @type {Field} Physical device field */
const PHYDEV_FIELD = {
  name: 'PHYDEV',
  label: T.PhysicalDevice,
  tooltip: T.PhysicalDeviceConcept,
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(DRIVER_FIELD.name, {
      is: (driver) => [dot1Q, vxlan, openVSwitchVXLAN].includes(driver),
      then: (schema) => schema.required(),
    }),
}

/** @type {Field} Filter MAC spoofing field */
const FILTER_MAC_SPOOFING_FIELD = {
  name: 'FILTER_MAC_SPOOFING',
  label: T.MacSpoofingFilter,
  type: INPUT_TYPES.SWITCH,
  onlyOnHypervisors: [fw],
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} Filter IP spoofing field */
const FILTER_IP_SPOOFING_FIELD = {
  name: 'FILTER_IP_SPOOFING',
  label: T.IpSpoofingFilter,
  type: INPUT_TYPES.SWITCH,
  onlyOnHypervisors: [fw],
  validation: boolean().yesOrNo(),
  grid: { md: 12 },
}

/** @type {Field} MTU field */
const MTU_FIELD = {
  name: 'MTU',
  label: T.MTU,
  tooltip: T.MTUConcept,
  onlyOnHypervisors: [dot1Q, vxlan, ovswitch, openVSwitchVXLAN],
  type: INPUT_TYPES.TEXT,
  validation: string()
    .trim()
    .default(() => undefined),
}

/** @type {Field} Automatic VLAN field */
const AUTOMATIC_VLAN_FIELD = {
  name: 'AUTOMATIC_VLAN_ID',
  label: T.AutomaticVlanId,
  dependOf: 'AUTOMATIC_VLAN_ID',
  type: INPUT_TYPES.SWITCH,
  onlyOnHypervisors: [dot1Q, vxlan, ovswitch, openVSwitchVXLAN],
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
  onlyOnHypervisors: [dot1Q, vxlan, ovswitch, openVSwitchVXLAN],
  dependOf: AUTOMATIC_VLAN_FIELD.name,
  htmlType: (automatic) => automatic && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(AUTOMATIC_VLAN_FIELD.name, {
      is: (automatic) => !automatic,
      then: (schema) => schema.required(),
    }),
  grid: { sm: 6 },
}

/** @type {Field} Automatic Outer VLAN field */
const AUTOMATIC_OUTER_VLAN_ID_FIELD = {
  name: 'AUTOMATIC_OUTER_VLAN_ID',
  label: T.AutomaticOuterVlanId,
  type: INPUT_TYPES.SWITCH,
  onlyOnHypervisors: [openVSwitchVXLAN],
  validation: lazy((_, { context }) =>
    boolean()
      .yesOrNo()
      .default(() => context?.AUTOMATIC_OUTER_VLAN_ID === '1')
  ),
  dependOf: 'AUTOMATIC_OUTER_VLAN_ID',
  grid: (self) => (self ? { md: 12 } : { sm: 6 }),
}

/** @type {Field} Outer VLAN ID field */
const OUTER_VLAN_ID_FIELD = {
  name: 'OUTER_VLAN_ID',
  label: T.OuterVlanId,
  type: INPUT_TYPES.TEXT,
  onlyOnHypervisors: [openVSwitchVXLAN],
  dependOf: AUTOMATIC_OUTER_VLAN_ID_FIELD.name,
  htmlType: (oAutomatic) => oAutomatic && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(AUTOMATIC_OUTER_VLAN_ID_FIELD.name, {
      is: (oAutomatic) => !oAutomatic,
      then: (schema) => schema.required(),
    }),
  grid: { sm: 6 },
}

/** @type {Field} VXLAN mode field */
const VXLAN_MODE_FIELD = {
  name: 'VXLAN_MODE',
  label: T.VxlanMode,
  tooltip: T.VxlanModeConcept,
  type: INPUT_TYPES.SELECT,
  onlyOnHypervisors: [vxlan],
  values: arrayToOptions(['evpn', 'multicast']),
  validation: string()
    .trim()
    .default(() => undefined),
}

/** @type {Field} VXLAN tunnel endpoint field */
const VXLAN_TEP_FIELD = {
  name: 'VXLAN_TEP',
  label: T.VxlanTunnelEndpoint,
  tooltip: T.VxlanTunnelEndpointConcept,
  type: INPUT_TYPES.SELECT,
  onlyOnHypervisors: [vxlan],
  dependOf: VXLAN_MODE_FIELD.name,
  htmlType: (mode) => mode !== 'evpn' && INPUT_TYPES.HIDDEN,
  values: arrayToOptions(['dev', 'local_ip']),
  validation: string()
    .trim()
    .default(() => undefined)
    .when(VXLAN_MODE_FIELD.name, {
      is: (mode) => mode !== 'evpn',
      then: (schema) => schema.strip(),
    }),
}

/** @type {Field} VXLAN multicast field */
const VXLAN_MC_FIELD = {
  name: 'VXLAN_MC',
  label: T.VxlanMulticast,
  tooltip: T.VxlanMulticastConcept,
  type: INPUT_TYPES.TEXT,
  onlyOnHypervisors: [vxlan],
  dependOf: VXLAN_MODE_FIELD.name,
  htmlType: (mode) => mode !== 'multicast' && INPUT_TYPES.HIDDEN,
  validation: string()
    .trim()
    .default(() => undefined)
    .when(VXLAN_MODE_FIELD.name, {
      is: (mode) => mode !== 'multicast',
      then: (schema) => schema.strip(),
    }),
}

/** @type {Field[]} List of common fields */
export const FIELDS = [
  BRIDGE_FIELD,
  PHYDEV_FIELD,

  FILTER_MAC_SPOOFING_FIELD,
  FILTER_IP_SPOOFING_FIELD,

  AUTOMATIC_VLAN_FIELD,
  VLAN_ID_FIELD,
  AUTOMATIC_OUTER_VLAN_ID_FIELD,
  OUTER_VLAN_ID_FIELD,

  MTU_FIELD,
  VXLAN_MODE_FIELD,
  VXLAN_TEP_FIELD,
  VXLAN_MC_FIELD,
]

export const IP_LINK_CONF_FIELD = {
  name: 'IP_LINK_CONF',
  validation: object().afterSubmit((conf, { parent }) => {
    if (vxlan !== parent[DRIVER_FIELD.name]) return

    // => string result: IP_LINK_CONF="option1=value1,option2=,..."
    return Object.entries(conf || {})
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
  }),
}
