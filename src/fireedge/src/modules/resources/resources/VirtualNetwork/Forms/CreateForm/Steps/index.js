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
import Configuration from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/constants'
import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/resources/resources/VirtualNetwork/Forms/CreateForm/Steps/General'
import { VN_DRIVERS } from '@ConstantsModule'
import { jsonToXml, createSteps } from '@UtilsModule'
import {
  getUnknownVars,
  normalizeAttributeList,
} from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/utils'

const CONFIGURATION_TABS = [
  'configuration',
  'addresses',
  'security',
  'qos',
  'context',
]

const getConfigurationTabs = ({ data } = {}) =>
  data?.NAME
    ? CONFIGURATION_TABS.filter((tabId) => tabId !== 'addresses')
    : CONFIGURATION_TABS

const Steps = createSteps(
  [
    General,
    (stepProps) =>
      Configuration({
        ...stepProps,
        tabIds: getConfigurationTabs(stepProps),
      }),
  ],
  {
    transformInitialValue: (
      { TEMPLATE = {}, AR_POOL, ...vnet } = {},
      schema
    ) => {
      const addressRanges = AR_POOL?.AR ?? TEMPLATE.AR

      // Init switches of physical device and bridge
      const phyDevSwitch = !vnet.PHYDEV
      const bridgeSwitch = !!(vnet.BRIDGE && !vnet.BRIDGE.startsWith('onebr'))
      const vlanTaggedSwitch = !!TEMPLATE.VLAN_TAGGED_ID
      const QInQSwitch = !!TEMPLATE.CVLANS

      const initialValue = schema.cast(
        {
          [GENERAL_ID]: {
            ...vnet,
            DESCRIPTION: TEMPLATE?.DESCRIPTION,
          },
          [EXTRA_ID]: {
            ...TEMPLATE,
            AR: addressRanges,
            ...vnet,
            SECURITY_GROUPS: normalizeAttributeList(TEMPLATE.SECURITY_GROUPS),
            PHYDEV_SWITCH: phyDevSwitch,
            BRIDGE_SWITCH: bridgeSwitch,
            VLAN_TAGGED_ID_SWITCH: vlanTaggedSwitch,
            Q_IN_Q_SWITCH: QInQSwitch,
            VLAN_TAGGED_ID: TEMPLATE?.VLAN_TAGGED_ID?.split(','),
            CVLANS: TEMPLATE?.CVLANS?.split(','),
            IP_LINK_CONF: TEMPLATE?.IP_LINK_CONF?.split(','),
            ENABLE_DPDK: TEMPLATE?.BRIDGE_TYPE === 'openvswitch_dpdk',
          },
        },
        { stripUnknown: true, context: vnet }
      )

      initialValue[EXTRA_ID] = {
        ...getUnknownVars(TEMPLATE, schema),
        ...initialValue[EXTRA_ID],
      }

      return initialValue
    },
    transformBeforeSubmit: (formData) => {
      const { [GENERAL_ID]: general = {}, [EXTRA_ID]: extra = {} } =
        formData ?? {}

      if (Array.isArray(extra?.SECURITY_GROUPS)) {
        if (extra.SECURITY_GROUPS.length) {
          extra.SECURITY_GROUPS = extra.SECURITY_GROUPS.join(',')
        } else {
          delete extra.SECURITY_GROUPS
        }
      }

      // If ENABLE_DPDK is true, send BRIDGE_TYPE='openvswitch_dpdk'
      if ([VN_DRIVERS.ovswitch].includes(formData?.extra?.VN_MAD)) {
        if (formData?.extra?.ENABLE_DPDK) {
          extra.BRIDGE_TYPE = 'openvswitch_dpdk'
        } else {
          extra.BRIDGE_TYPE = 'openvswitch'
        }
      }

      const cluster = general.CLUSTER || -1
      delete general.CLUSTER

      // Ensure that switches are not sent to the API
      delete extra.PHYDEV_SWITCH
      delete extra.BRIDGE_SWITCH
      delete extra.VLAN_TAGGED_ID_SWITCH
      delete extra.Q_IN_Q_SWITCH
      delete extra.ENABLE_DPDK
      ![VN_DRIVERS.ovswitch].includes(formData?.extra?.VN_MAD) &&
        delete extra?.BRIDGE_TYPE

      return {
        template: jsonToXml({ ...extra, ...general }),
        cluster,
      }
    },
  }
)

export default Steps
