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
import { ObjectSchema, reach } from 'yup'

import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from '@modules/components/Forms/VnTemplate/CreateForm/Steps/ExtraConfiguration'
import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/components/Forms/VnTemplate/CreateForm/Steps/General'

import { jsonToXml } from '@ModelsModule'
import { createSteps } from '@UtilsModule'

const existsOnSchema = (schema, key) => {
  try {
    return reach(schema, key) && true
  } catch (e) {
    return false
  }
}

/**
 * @param {object} fromAttributes - Attributes to check
 * @param {ObjectSchema} schema - Current form schema
 * @returns {object} List of unknown attributes
 */
export const getUnknownVars = (fromAttributes = {}, schema) => {
  const unknown = {}

  for (const [key, value] of Object.entries(fromAttributes)) {
    if (
      !!value &&
      !existsOnSchema(schema, `${GENERAL_ID}.${key}`) &&
      !existsOnSchema(schema, `${EXTRA_ID}.${key}`)
    ) {
      // When the path is not found, it means that
      // the attribute is correct and we can set it
      unknown[key] = value
    }
  }

  return unknown
}

const Steps = createSteps([General, ExtraConfiguration], {
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
          PHYDEV_SWITCH: phyDevSwitch,
          BRIDGE_SWITCH: bridgeSwitch,
          VLAN_TAGGED_ID_SWITCH: vlanTaggedSwitch,
          Q_IN_Q_SWITCH: QInQSwitch,
          VLAN_TAGGED_ID: TEMPLATE?.VLAN_TAGGED_ID?.split(','),
          CVLANS: TEMPLATE?.CVLANS?.split(','),
          IP_LINK_CONF: TEMPLATE?.IP_LINK_CONF?.split(','),
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

    // Ensure that switches of physical device and bridge are not sent to the API
    delete extra.PHYDEV_SWITCH
    delete extra.BRIDGE_SWITCH
    delete extra.VLAN_TAGGED_ID_SWITCH
    delete extra.Q_IN_Q_SWITCH

    return jsonToXml({ ...extra, ...general })
  },
})

export default Steps
