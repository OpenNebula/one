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
import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/General'

import Extra, {
  STEP_ID as EXTRA_ID,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'

import { TAB_ID as ADVANCED_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/advancedParams'

import { TAB_ID as NETWORK_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking'

import { SECTION_ID as NETWORKS_VALUES_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown'

import Roles, {
  STEP_ID as ROLE_ID,
} from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Roles'

import { TAB_ID as USER_INPUT_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/userInputs'

import { TAB_ID as SCHED_ACTION_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/scheduledActions'

import {
  toNetworkString,
  fromNetworkString,
  toNetworksValueString,
  toUserInputString,
  fromUserInputString,
  fromNetworksValueString,
  createSteps,
  deepClean,
} from '@UtilsModule'

const Steps = createSteps([General, Extra, Roles], {
  transformInitialValue: (ServiceTemplate, schema) => {
    const { NAME: name, DESCRIPTION: description } = ServiceTemplate

    const template = ServiceTemplate?.TEMPLATE?.BODY ?? {}

    /* eslint-disable camelcase */
    const {
      networks = {},
      user_inputs = {},
      networks_values = [],
      [SCHED_ACTION_ID]: sched_actions = [], // FireEdge only prop
      roles,
    } = template
    /* eslint-enable camelcase */

    const networkParse = Object.entries(networks)?.reduce(
      (acc, network, idx) => {
        const res = []
        const parsedNetwork = fromNetworkString(network)

        const matchingNetworksValue = networks_values?.find(
          (nv) => Object.keys(nv)?.pop() === parsedNetwork?.name
        )

        if (matchingNetworksValue) {
          // Size goes to parsedNetworks...
          const { SIZE, ...parsedNetworksValue } = fromNetworksValueString(
            Object.values(matchingNetworksValue)
          )

          // Order matters
          res.push([{ ...parsedNetwork, SIZE }])
          res.push([parsedNetworksValue])
        } else {
          res.push([parsedNetwork])
        }

        acc[idx] = res

        return acc
      },
      []
    )

    const [parsedNetworks, parsedNetworksValues] = [
      networkParse.map(([pn]) => pn).flat(),
      networkParse.map(([, pnv]) => pnv).flat(),
    ]

    return schema.cast(
      {
        [GENERAL_ID]: { name, description },
        [EXTRA_ID]: {
          [NETWORK_ID]: parsedNetworks,
          [NETWORKS_VALUES_ID]: parsedNetworksValues,
          [USER_INPUT_ID]: Object.entries(user_inputs).map(fromUserInputString),
          [SCHED_ACTION_ID]: sched_actions,
          [ADVANCED_ID]: { ...template }, // strips unknown keys so this is fine
        },
        roles,
      },

      { stripUnknown: true }
    )
  },

  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: generalData,
      [EXTRA_ID]: extraData,
      [ROLE_ID]: roleData,
    } = formData

    const {
      [ADVANCED_ID]: extraParams = {},
      [NETWORK_ID]: networks,
      [NETWORKS_VALUES_ID]: networksValues,
      [USER_INPUT_ID]: userInputs,
      [SCHED_ACTION_ID]: schedActions,
    } = extraData

    const formatRole = roleData?.map((role) => {
      const { NIC = [] } = role?.template_contents || {}

      return {
        ...role,
        template_contents: {
          ...role.template_contents,
          NIC: NIC?.filter(
            // Filter out stale NIC's
            ({ NETWORK_ID: NIC_ID } = {}) =>
              networks?.some(
                ({ name: NETWORK_NAME }) => `$${NETWORK_NAME}` === NIC_ID
              )
          )
            ?.map(
              // Filter out stale aliases
              ({
                NIC_ALIAS: { NETWORK_ID: ALIAS_ID, ...alias } = {},
                ...nic
              } = {}) => {
                const validAlias = networks?.some(
                  ({ name: NETWORK_NAME }) => `$${NETWORK_NAME}` === ALIAS_ID
                )

                if (validAlias) {
                  return {
                    ...nic,
                    NIC_ALIAS: {
                      ...alias,
                      NETWORK_ID: ALIAS_ID,
                    },
                  }
                } else {
                  return {
                    ...nic,
                  }
                }
              }
            )
            // Explicitly remove any id's left from fieldArray
            ?.map(
              ({ id, NIC_ALIAS: { id: aliasId, ...alias } = {}, ...nic }) => ({
                ...nic,
                ...(alias ? { NIC_ALIAS: alias } : {}),
              })
            ),
        },
      }
    })

    const formatTemplate = {
      ...generalData,
      ...extraParams,
      roles: formatRole,
      networks: Object.fromEntries(networks?.map(toNetworkString)) ?? [],
      networks_values: networks
        ?.map((network, idx) =>
          toNetworksValueString(network, networksValues[idx])
        )
        ?.filter(Boolean),

      user_inputs: userInputs
        ? Object.fromEntries(userInputs?.map(toUserInputString))
        : [],
      [SCHED_ACTION_ID]: schedActions, // FireEdge only prop
    }

    const cleanedTemplate = deepClean(formatTemplate)

    return cleanedTemplate
  },
})

export default Steps
