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
} from '@modules/resources/resources/VnTemplate/Forms/InstantiateForm/Steps/General'
import { jsonToXml, createSteps } from '@UtilsModule'
import { VN_DRIVERS } from '@ConstantsModule'
import {
  ORIGINAL_ADDRESS_RANGE,
  normalizeAttributeList,
} from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/utils'

const INSTANTIATE_CONFIGURATION_TABS = [
  'configuration',
  'addresses',
  'security',
  'context',
]

const getAddressRanges = (template = {}) => [template?.AR ?? []].flat()
const markOriginalAddressRanges = (addressRanges) =>
  addressRanges.map((addressRange) => ({
    ...addressRange,
    [ORIGINAL_ADDRESS_RANGE]: true,
  }))
const removeInternalAddressRangeAttributes = ({
  [ORIGINAL_ADDRESS_RANGE]: _originalAddressRange,
  ...addressRange
}) => addressRange

const InstantiateConfiguration = (props) =>
  Configuration({
    ...props,
    isInstantiate: true,
    isUpdate: false,
    tabIds: INSTANTIATE_CONFIGURATION_TABS,
  })

const Steps = createSteps(() => [General, InstantiateConfiguration], {
  transformInitialValue: ({ TEMPLATE = {}, ...vnTemplate } = {}, schema) => {
    // Init switches of physical device and bridge
    const phyDevSwitch = !TEMPLATE.PHYDEV
    const bridgeSwitch = !!(
      TEMPLATE.BRIDGE && !TEMPLATE.BRIDGE.startsWith('onebr')
    )
    const vlanTaggedSwitch = !!TEMPLATE.VLAN_TAGGED_ID
    const QInQSwitch = !!TEMPLATE.CVLANS

    const initialValue = schema.cast(
      {
        [GENERAL_ID]: { ...vnTemplate, DESCRIPTION: TEMPLATE.DESCRIPTION },
        [EXTRA_ID]: {
          ...TEMPLATE,
          ...vnTemplate,
          AR: markOriginalAddressRanges(getAddressRanges(TEMPLATE)),
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
      { stripUnknown: true, context: vnTemplate }
    )

    return initialValue
  },
  transformBeforeSubmit: (formData, vnTemplate) => {
    const {
      [GENERAL_ID]: { name, DESCRIPTION } = {},
      [EXTRA_ID]: extraTemplate = {},
    } = formData ?? {}

    if (Array.isArray(extraTemplate?.SECURITY_GROUPS)) {
      if (extraTemplate.SECURITY_GROUPS.length) {
        extraTemplate.SECURITY_GROUPS = extraTemplate.SECURITY_GROUPS.join(',')
      } else {
        delete extraTemplate.SECURITY_GROUPS
      }
    }

    if (
      extraTemplate.AUTOMATIC_VLAN_ID &&
      `${extraTemplate.AUTOMATIC_VLAN_ID}`.toLowerCase() === 'yes'
    ) {
      extraTemplate.VLAN_ID = ' '
    }

    if (Array.isArray(extraTemplate?.AR)) {
      const newAddressRanges = extraTemplate.AR.filter(
        (addressRange) => !addressRange?.[ORIGINAL_ADDRESS_RANGE]
      ).map(removeInternalAddressRangeAttributes)

      newAddressRanges.length
        ? (extraTemplate.AR = newAddressRanges)
        : delete extraTemplate.AR
    }

    // Ensure that switches of physical device and bridge are not sent to the API
    delete extraTemplate.PHYDEV_SWITCH
    delete extraTemplate.BRIDGE_SWITCH
    delete extraTemplate.VLAN_TAGGED_ID_SWITCH
    delete extraTemplate.Q_IN_Q_SWITCH
    delete extraTemplate.ENABLE_DPDK
    ![VN_DRIVERS.ovswitch].includes(formData?.[EXTRA_ID]?.VN_MAD) &&
      delete extraTemplate?.BRIDGE_TYPE

    ![VN_DRIVERS.ovswitch_vxlan].includes(formData?.[EXTRA_ID]?.VN_MAD) &&
      delete extraTemplate?.OUTER_VLAN_ID

    const templateXML = jsonToXml({
      ...extraTemplate,
      DESCRIPTION,
    })

    const templates = {
      id: vnTemplate.ID,
      name,
      template: templateXML,
    }

    return templates
  },
})

export default Steps
