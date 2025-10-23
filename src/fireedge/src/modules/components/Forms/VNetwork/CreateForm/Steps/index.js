/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { reach, ObjectSchema } from 'yup'

import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/components/Forms/VNetwork/CreateForm/Steps/General'
import ExtraConfiguration, {
  STEP_ID as EXTRA_ID,
} from '@modules/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration'

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
      unknown[key] = value
    }
  }

  return unknown
}

const Steps = createSteps([General, ExtraConfiguration], {
  transformInitialValue: ({ TEMPLATE, AR_POOL, ...vnet } = {}, schema) => {
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
          AR: AR_POOL.AR,
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

    const cluster = general.CLUSTER || -1
    delete general.CLUSTER

    delete extra.PHYDEV_SWITCH
    delete extra.BRIDGE_SWITCH
    delete extra.VLAN_TAGGED_ID_SWITCH
    delete extra.Q_IN_Q_SWITCH

    return {
      template: jsonToXml({ ...extra, ...general }),
      cluster: cluster,
    }
  },
})

export default Steps
