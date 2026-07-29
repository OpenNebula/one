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
} from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/General'
import { VN_DRIVERS } from '@ConstantsModule'
import { jsonToXml, createSteps } from '@UtilsModule'
import {
  getUnknownVars,
  normalizeAttributeList,
} from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/utils'

const Steps = createSteps([General, Configuration], {
  transformInitialValue: ({ TEMPLATE, ...vnet } = {}, schema) => {
    const { AR = {}, DESCRIPTION = '' } = TEMPLATE

    // Init switches of physical device and bridge
    const phyDevSwitch = !TEMPLATE.PHYDEV
    const bridgeSwitch = !!(
      TEMPLATE.BRIDGE && !TEMPLATE.BRIDGE.startsWith('onebr')
    )
    const vlanTaggedSwitch = !!TEMPLATE.VLAN_TAGGED_ID
    const QInQSwitch = !!TEMPLATE.CVLANS

    const initialValue = schema.cast(
      {
        [GENERAL_ID]: { ...vnet, DESCRIPTION },
        [EXTRA_ID]: {
          ...TEMPLATE,
          AR,
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

    // Ensure that switches of physical device and bridge are not sent to the API
    delete extra.PHYDEV_SWITCH
    delete extra.BRIDGE_SWITCH
    delete extra.VLAN_TAGGED_ID_SWITCH
    delete extra.Q_IN_Q_SWITCH
    delete extra.ENABLE_DPDK
    ![VN_DRIVERS.ovswitch].includes(formData?.extra?.VN_MAD) &&
      delete extra?.BRIDGE_TYPE

    return jsonToXml({ ...extra, ...general })
  },
})

export default Steps
